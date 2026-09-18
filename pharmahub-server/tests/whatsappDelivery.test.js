import { test, before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import { createApp } from "../src/app.js";
import { Role } from "../src/models/Role.js";
import { User } from "../src/models/User.js";
import { Integration } from "../src/models/Integration.js";
import { ReportBill } from "../src/models/ReportBill.js";
import { generatedBillDir } from "../src/services/invoicePdf.service.js";

// Tests only ever run against the dedicated test database via MONGO_URI_TEST.
const uri = process.env.MONGO_URI_TEST;
let connected = false;
if (uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    connected = true;
  } catch (err) {
    console.log(`[test] MongoDB unavailable (${err?.message ?? err}); whatsapp delivery tests skipped`);
  }
} else {
  console.log("[test] MONGO_URI_TEST not set — whatsapp delivery tests skipped");
}

// Mock the WhatsApp Business Cloud API. Local API requests are forwarded to the
// real fetch; only graph.facebook.com calls are intercepted.
const realFetch = globalThis.fetch;
const metaCalls = [];
let metaShouldFail = false;
let metaShouldThrow = false;

const ORIGINAL_ENV = {
  token: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  templateName: process.env.WHATSAPP_BILL_TEMPLATE_NAME,
  publicUrl: process.env.API_PUBLIC_URL,
};

let server;
let base;

before(async () => {
  if (!connected) return;
  process.env.WHATSAPP_ACCESS_TOKEN = "test-access-token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "100000000000000";
  process.env.API_PUBLIC_URL = "http://media.test";

  globalThis.fetch = async (url, init) => {
    if (String(url).includes("graph.facebook.com")) {
      metaCalls.push({ url: String(url), init });
      if (metaShouldThrow) throw new TypeError("ECONNREFUSED graph.facebook.com");
      if (metaShouldFail) {
        return new Response(
          JSON.stringify({ error: { code: 131047, message: "Rate limit hit" } }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ messages: [{ id: "wamid.HBgEAAQ" }] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return realFetch(url, init);
  };

  await Role.ensureSystemRoles();
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  if (globalThis.fetch !== realFetch) globalThis.fetch = realFetch;
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  if (server) await new Promise((resolve) => server.close(resolve));
  if (connected && mongoose.connection.name === "pharmahub_test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

beforeEach(async () => {
  if (!connected) return;
  await Promise.all([Integration.deleteMany({}), ReportBill.deleteMany({})]);
  metaCalls.length = 0;
  metaShouldFail = false;
  metaShouldThrow = false;
});

async function request(path, { method = "GET", body, token } = {}) {
  return fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createUser(prefix, orgName = "PharmaHub") {
  const email = `${prefix}-${Date.now()}@pharmahub.in`;
  const reg = await request("/auth/register", {
    method: "POST",
    body: { name: "WhatsApp Tester", email, password: "password123" },
  });
  assert.equal(reg.status, 201);
  await User.updateOne({ email }, { $set: { role: "Admin", orgName } });
  const login = await request("/auth/login", {
    method: "POST",
    body: { email, password: "password123" },
  });
  assert.equal(login.status, 200);
  const body = await login.json();
  const user = await User.findOne({ email }).lean();
  return { token: body.data.token, email, id: String(user._id) };
}

async function connectWhatsApp(token, phone = "+919876543210") {
  const res = await request("/integrations/whatsapp/connect", {
    method: "POST",
    token,
    body: { config: { phone } },
  });
  assert.equal(res.status, 200);
  return res.json();
}

const salesBillBody = (over = {}) => ({
  documentType: "sales_invoice",
  invoiceNo: `INV-WA-${Math.floor(Math.random() * 1000000)}`,
  billDate: "2026-08-10",
  customerName: "Deepa Medicals",
  customerPhone: "9876543210",
  items: [
    { medicineName: "Paracetamol", quantity: 2, unitPrice: 50, discountPct: 0, gstRate: 12 },
    { medicineName: "ORS", quantity: 1, unitPrice: 30, discountPct: 0, gstRate: 5 },
  ],
  paymentMode: "Cash",
  paymentStatus: "paid",
  source: "manual",
  ...over,
});

const purchaseBillBody = (over = {}) => ({
  documentType: "purchase_invoice",
  invoiceNo: `PUR-WA-${Math.floor(Math.random() * 1000000)}`,
  purchaseDate: "2026-08-11",
  supplier: { name: "SRI SAI VENKATA DURGA ENTERPRISES", gstin: "37ACJFS5535M1ZH", phone: "9999999999" },
  items: [{ medicineName: "Dolo 650", quantity: 2, unitCost: 50, gstRate: 12 }],
  source: "manual",
  ...over,
});

async function createBill(token, over = {}) {
  const res = await request("/reports/data/bills", { method: "POST", token, body: salesBillBody(over) });
  assert.equal(res.status, 201);
  return (await res.json()).data;
}

async function manualSend(token, id) {
  return request(`/reports/data/bills/${id}/whatsapp`, { method: "POST", token });
}

describe("whatsapp bill delivery", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("bill is saved even when WhatsApp Business is not connected (no Meta call, delivery skipped)", async () => {
    const admin = await createUser("nowa", "OrgNoWa");
    const bill = await createBill(admin.token, { invoiceNo: "INV-SKIP" });

    assert.equal(bill.whatsapp.status, "skipped");
    assert.equal(bill.whatsapp.reason, "not_connected");
    assert.equal(metaCalls.length, 0);

    const persisted = await ReportBill.findOne({ _id: bill.id }).lean();
    assert.ok(persisted, "bill must be persisted despite delivery being skipped");
    assert.equal(persisted.whatsappDelivery.status, "skipped");
    assert.equal(persisted.whatsappDelivery.reason, "not_connected");
    assert.equal(persisted.whatsappDelivery.attempts, 0);
    assert.ok(persisted.whatsappDelivery.skippedAt, "skipped outcome must be timestamped");
  });

  test("connected WhatsApp Business but missing server Meta credentials is reported as server_not_configured, not not_connected", async () => {
    const admin = await createUser("wanocfg", "OrgWaNoCfg");
    await connectWhatsApp(admin.token, "+91 98765 43210");

    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    try {
      const bill = await createBill(admin.token, { invoiceNo: "INV-NOCFG" });
      assert.equal(bill.whatsapp.status, "skipped");
      assert.equal(bill.whatsapp.reason, "server_not_configured");
      assert.equal(bill.whatsapp.recipientPhone, "+919876543210");
      assert.equal(metaCalls.length, 0, "no Meta call when server credentials are missing");

      const persisted = await ReportBill.findOne({ _id: bill.id }).lean();
      assert.equal(persisted.whatsappDelivery.status, "skipped");
      assert.equal(persisted.whatsappDelivery.reason, "server_not_configured");
      assert.ok(persisted.whatsappDelivery.skippedAt);
    } finally {
      process.env.WHATSAPP_ACCESS_TOKEN = "test-access-token";
      process.env.WHATSAPP_PHONE_NUMBER_ID = "100000000000000";
    }
  });

  test("persists the customer phone normalized to +91 form (leading zero allowed)", async () => {
    const admin = await createUser("wanorm", "OrgWaNorm");
    const bill = await createBill(admin.token, { customerPhone: "0 98765 43210" });

    assert.equal(bill.customerPhone, "+919876543210");
    const persisted = await ReportBill.findOne({ _id: bill.id }).lean();
    assert.equal(persisted.customer.phone, "+919876543210");
    assert.equal(persisted.whatsappDelivery.status, "skipped");
    assert.equal(persisted.whatsappDelivery.reason, "not_connected");
  });

  test("sends the generated invoice PDF to the customer via Meta when connected", async () => {
    const admin = await createUser("waok", "OrgWaOk");
    await connectWhatsApp(admin.token, "+91 98765 43210");
    const bill = await createBill(admin.token, { invoiceNo: "INV-SENT" });

    assert.equal(bill.whatsapp.status, "sent");
    assert.equal(bill.whatsapp.messageId, "wamid.HBgEAAQ");
    assert.equal(bill.whatsapp.reason, null);
    assert.equal(metaCalls.length, 1);

    const call = metaCalls[0];
    assert.ok(call.url.includes("/100000000000000/messages"), "uses the configured phone number id");
    assert.equal(call.init.headers.Authorization, "Bearer test-access-token");

    const payload = JSON.parse(call.init.body);
    assert.equal(payload.messaging_product, "whatsapp");
    assert.equal(payload.to, "+919876543210");
    assert.equal(payload.type, "document");
    assert.equal(payload.document.filename, "INV-SENT.pdf");
    assert.equal(payload.document.link, `http://media.test/uploads/generated/${bill.id}.pdf`);
    assert.match(payload.document.caption, /Thank you for your purchase from OrgWaOk/);
    assert.match(payload.document.caption, /Your bill INV-SENT is ready/);
    assert.match(payload.document.caption, /Total: ₹143\.50/);

    const persisted = await ReportBill.findById(bill.id).lean();
    assert.equal(persisted.whatsappDelivery.status, "sent");
    assert.equal(persisted.whatsappDelivery.recipientPhone, "+919876543210");
    assert.equal(persisted.whatsappDelivery.attempts, 1);
    assert.ok(persisted.whatsappDelivery.sentAt);

    const generated = path.join(generatedBillDir, `${bill.id}.pdf`);
    assert.ok(fs.existsSync(generated), "a real invoice PDF must be written to disk");
  });

  test("bill is saved without delivery when the customer has no phone number", async () => {
    const admin = await createUser("nophone", "OrgNoPhone");
    await connectWhatsApp(admin.token);
    const bill = await createBill(admin.token, { invoiceNo: "INV-NOPHONE", customerPhone: "" });

    assert.equal(bill.whatsapp.status, "skipped");
    assert.equal(bill.whatsapp.reason, "no_number");
    assert.equal(metaCalls.length, 0);
    assert.ok(await ReportBill.findById(bill.id).lean(), "bill persisted without a customer phone");
  });

  test("bill is saved without delivery when the customer phone is invalid", async () => {
    const admin = await createUser("badnum", "OrgBadNum");
    await connectWhatsApp(admin.token);
    const bill = await createBill(admin.token, { invoiceNo: "INV-BADNUM", customerPhone: "12345" });

    assert.equal(bill.whatsapp.status, "skipped");
    assert.equal(bill.whatsapp.reason, "invalid_number");
    assert.equal(metaCalls.length, 0);
    assert.ok(await ReportBill.findById(bill.id).lean());
  });

  test("Meta API failure keeps the bill saved and a retry re-sends it", async () => {
    const admin = await createUser("retry", "OrgRetry");
    await connectWhatsApp(admin.token);

    metaShouldFail = true;
    const bill = await createBill(admin.token, { invoiceNo: "INV-FAIL" });
    assert.equal(bill.whatsapp.status, "failed");
    assert.equal(bill.whatsapp.errorCode, "131047");

    let persisted = await ReportBill.findById(bill.id).lean();
    assert.equal(persisted.whatsappDelivery.status, "failed");
    assert.equal(persisted.whatsappDelivery.attempts, 1);
    assert.match(persisted.whatsappDelivery.errorMessage, /Rate limit hit/);

    metaShouldFail = false;
    const retry = await request(`/reports/data/bills/${bill.id}/whatsapp/retry`, { method: "POST", token: admin.token });
    assert.equal(retry.status, 200);
    const retried = (await retry.json()).data;
    assert.equal(retried.whatsapp.status, "sent");

    persisted = await ReportBill.findById(bill.id).lean();
    assert.equal(persisted.whatsappDelivery.status, "sent");
    assert.equal(persisted.whatsappDelivery.attempts, 2);
    assert.ok(persisted.whatsappDelivery.messageId);
  });

  test("uses the uploaded bill image when the bill has an original document", async () => {
    const admin = await createUser("img", "OrgImg");
    await connectWhatsApp(admin.token);
    const bill = await createBill(admin.token, { invoiceNo: "INV-IMG" });
    assert.equal(metaCalls.length, 1);

    await ReportBill.updateOne(
      { _id: bill.id },
      { $set: { originalDocument: { filename: "scan.png", path: "/uploads/bills/fake.png", mimeType: "image/png", size: 100 } } },
    );

    const send = await manualSend(admin.token, bill.id);
    assert.equal(send.status, 200);
    assert.equal(metaCalls.length, 2);
    const payload = JSON.parse(metaCalls[1].init.body);
    assert.equal(payload.type, "image");
    assert.equal(payload.image.link, "http://media.test/uploads/bills/fake.png");
  });

  test("delivery state is exposed on detail and list endpoints", async () => {
    const admin = await createUser("view", "OrgView");
    await connectWhatsApp(admin.token);
    const bill = await createBill(admin.token, { invoiceNo: "INV-VIEW" });

    const detail = await request(`/reports/data/bills/${bill.id}`, { token: admin.token });
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).data.whatsapp.status, "sent");

    const list = await request("/reports/data/bills", { token: admin.token });
    const items = (await list.json()).data.items;
    assert.equal(items.length, 1);
    assert.equal(items[0].whatsapp.status, "sent");
  });

  test("organizations are isolated: another org can neither send nor read the bill", async () => {
    const orgA = await createUser("orga", "OrgA");
    const orgB = await createUser("orgb", "OrgB");

    await connectWhatsApp(orgA.token);
    const billA = await createBill(orgA.token, { invoiceNo: "INV-ORG" });

    const bList = await request("/reports/data/bills", { token: orgB.token });
    assert.equal((await bList.json()).data.meta.total, 0, "org B must not see org A bills");

    const sendAsB = await manualSend(orgB.token, billA.id);
    assert.equal(sendAsB.status, 404, "org B cannot deliver org A's bill");

    const billB = await createBill(orgB.token, { invoiceNo: "INV-ORGB" });
    assert.equal(billB.whatsapp.reason, "not_connected", "org B has no connected integration");
  });

  test("manual send is rejected for non-sales bills and missing bills", async () => {
    const admin = await createUser("msend", "OrgMSend");
    await connectWhatsApp(admin.token);

    const purchase = await request("/reports/data/bills", {
      method: "POST",
      token: admin.token,
      body: purchaseBillBody(),
    });
    assert.equal(purchase.status, 201);
    const p = (await purchase.json()).data;
    const bad = await manualSend(admin.token, p.id);
    assert.equal(bad.status, 400);

    const missing = await manualSend(admin.token, new mongoose.Types.ObjectId().toString());
    assert.equal(missing.status, 404);
  });

  test("uses an approved template when WHATSAPP_BILL_TEMPLATE_NAME is set", async () => {
    process.env.WHATSAPP_BILL_TEMPLATE_NAME = "pharmahub_bill";
    try {
      const admin = await createUser("tpl", "OrgTpl");
      await connectWhatsApp(admin.token);
      const bill = await createBill(admin.token, { invoiceNo: "INV-TPL" });
      assert.equal(bill.whatsapp.status, "sent");
      assert.equal(metaCalls.length, 1);
      const payload = JSON.parse(metaCalls[0].init.body);
      assert.equal(payload.type, "template");
      assert.equal(payload.template.name, "pharmahub_bill");
      assert.equal(payload.template.language.code, "en");
      assert.deepEqual(
        payload.template.components[0].parameters.map((x) => x.text),
        ["OrgTpl", "INV-TPL", "₹143.50"],
      );
    } finally {
      delete process.env.WHATSAPP_BILL_TEMPLATE_NAME;
    }
  });

  test("network failure during delivery never loses the bill and records a failed attempt", async () => {
    const admin = await createUser("net", "OrgNet");
    await connectWhatsApp(admin.token);

    metaShouldThrow = true;
    const bill = await createBill(admin.token, { invoiceNo: "INV-NET" });
    assert.equal(bill.whatsapp.status, "failed");
    assert.equal(bill.whatsapp.errorCode, "network_error");

    const persisted = await ReportBill.findById(bill.id).lean();
    assert.equal(persisted.whatsappDelivery.status, "failed");
    assert.equal(persisted.whatsappDelivery.attempts, 1);
    assert.match(persisted.whatsappDelivery.errorMessage, /ECONNREFUSED/);
  });

  test("credentials are never exposed on the integration or bill responses", async () => {
    const admin = await createUser("sec", "OrgSec");
    const connected = await connectWhatsApp(admin.token);
    const body = JSON.stringify(connected);
    assert.doesNotMatch(body, /access.?token/i);
    assert.doesNotMatch(body, /secret/i);

    const list = await request("/integrations", { token: admin.token });
    assert.equal(list.status, 200);
    const listBody = JSON.stringify(await list.json());
    assert.doesNotMatch(listBody, /access.?token/i);

    const bill = await createBill(admin.token, { invoiceNo: "INV-SEC" });
    const billBody = JSON.stringify(bill);
    assert.doesNotMatch(billBody, /access.?token/i);
    assert.doesNotMatch(billBody, /secret/i);
  });
});
