import { test, before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { createApp } from "../src/app.js";
import { Role } from "../src/models/Role.js";
import { User } from "../src/models/User.js";
import { Sale } from "../src/models/Sale.js";
import { Purchase } from "../src/models/Purchase.js";
import { ReportBill } from "../src/models/ReportBill.js";
import { SavedReport } from "../src/models/SavedReport.js";

// Tests only ever run against the dedicated test database via MONGO_URI_TEST.
const uri = process.env.MONGO_URI_TEST;
let connected = false;
if (uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    connected = true;
  } catch (err) {
    console.log(`[test] MongoDB unavailable (${err?.message ?? err}); report bills tests skipped`);
  }
} else {
  console.log("[test] MONGO_URI_TEST not set — report bills tests skipped");
}

let server;
let base;

before(async () => {
  if (!connected) return;
  await Role.ensureSystemRoles();
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (connected && mongoose.connection.name === "pharmahub_test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

beforeEach(async () => {
  if (!connected) return;
  await Promise.all([
    Sale.deleteMany({}),
    Purchase.deleteMany({}),
    ReportBill.deleteMany({}),
    SavedReport.deleteMany({}),
  ]);
});

async function request(path, { method = "GET", body, token } = {}) {
  return fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createUser(prefix, role = "Admin") {
  const email = `${prefix}-${Date.now()}@pharmahub.in`;
  const reg = await request("/auth/register", {
    method: "POST",
    body: { name: "Report Bills Tester", email, password: "password123" },
  });
  assert.equal(reg.status, 201);
  if (role !== "Pharmacist") {
    await User.updateOne({ email }, { $set: { role, orgName: "PharmaHub" } });
  }
  const login = await request("/auth/login", {
    method: "POST",
    body: { email, password: "password123" },
  });
  assert.equal(login.status, 200);
  const body = await login.json();
  const user = await User.findOne({ email }).lean();
  return { token: body.data.token, email, id: String(user._id) };
}

const salesBillBody = (over = {}) => ({
  documentType: "sales_invoice",
  invoiceNo: "SRJ001107",
  billDate: "2026-08-10",
  customerName: "CR NG ESHWAR MEDICALS",
  customerGstin: "37BDQPT9401E1Z5",
  items: [
    { medicineName: "HUMINSULIN30/70CAR", quantity: 2, unitPrice: 50, discountPct: 10, gstRate: 12 },
    { medicineName: "ORS", quantity: 1, unitPrice: 30, discountPct: 0, gstRate: 5 },
  ],
  paymentMode: "UPI",
  paymentStatus: "paid",
  source: "manual",
  notes: "Report Data bill",
  ...over,
});

const purchaseBillBody = (over = {}) => ({
  documentType: "purchase_invoice",
  invoiceNo: "SRJ001108",
  purchaseDate: "2026-08-11",
  supplier: { name: "SRI SAI VENKATA DURGA ENTERPRISES", gstin: "37ACJFS5535M1ZH", address: "Vijayawada", phone: "9999999999" },
  items: [
    {
      medicineName: "Dolo 650",
      quantity: 2,
      unitCost: 50,
      mrp: 62,
      gstRate: 12,
      hsnCode: "30049069",
      pack: "2x10",
      batchNumber: "BYE3L033",
      expiryDate: "11/28",
      manufacturer: "Micro Labs",
    },
  ],
  printedGrandTotal: 120,
  source: "uploaded",
  notes: "Uploaded purchase invoice",
  ...over,
});

const customConfig = (module, over = {}) => ({
  module,
  selectedFields: over.selectedFields ?? ["paymentMode"],
  groupBy: over.groupBy ?? ["paymentMode"],
  summarizeBy: over.summarizeBy ?? [{ field: "grandTotal", aggregation: "SUM" }],
  filters: over.filters ?? [],
  dateFrom: over.dateFrom ?? "2026-08-01",
  dateTo: over.dateTo ?? "2026-08-31",
});

describe("report bills (unified manager)", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("creates a sales-type bill into reportbills with server-recomputed totals", async () => {
    const admin = await createUser("rbbill1");
    const res = await request("/reports/data/bills", { method: "POST", token: admin.token, body: salesBillBody() });
    assert.equal(res.status, 201);
    const bill = (await res.json()).data;
    assert.equal(bill.kind, "bill");
    assert.equal(bill.invoiceNo, "SRJ001107");
    assert.equal(bill.documentType, "sales_invoice");
    assert.equal(bill.status, "completed");
    // Discount REDUCES the taxable amount: 100 -> 90 -> +10.8 GST; 30 -> +1.5 GST.
    assert.equal(bill.subtotal, 130);
    assert.equal(bill.discountTotal, 10);
    assert.equal(bill.taxableAmount, 120);
    assert.equal(bill.gstTotal, 12.3);
    assert.equal(bill.grandTotal, 132.3);
    assert.equal(bill.party.name, "CR NG ESHWAR MEDICALS");

    const persisted = await ReportBill.findOne({ createdBy: admin.id, "invoice.invoiceNumber": "SRJ001107" }).lean();
    assert.ok(persisted, "bill must be persisted in the reportbills collection");
    assert.equal(persisted.createdBy.toString(), admin.id);
    assert.equal(persisted.orgName, "PharmaHub");
    assert.equal(persisted.invoice.invoiceNumber, "SRJ001107");
    assert.equal(new Date(persisted.createdAt).toISOString().slice(0, 10), "2026-08-10");
  });

  test("creates a purchase-type bill keeping the printed grand total authoritative", async () => {
    const admin = await createUser("rbbill2");
    const res = await request("/reports/data/bills", { method: "POST", token: admin.token, body: purchaseBillBody() });
    assert.equal(res.status, 201);
    const bill = (await res.json()).data;
    assert.equal(bill.kind, "bill");
    assert.equal(bill.documentType, "purchase_invoice");
    assert.equal(bill.status, "received");
    // Calculated total is 112, printed is 120 -> grand total must follow the printed value.
    assert.equal(bill.calculatedGrandTotal, 112);
    assert.equal(bill.printedGrandTotal, 120);
    assert.equal(bill.grandTotal, 120);
    assert.equal(bill.supplierName, "SRI SAI VENKATA DURGA ENTERPRISES");
    assert.equal(bill.source, "uploaded");
  });

  test("rejects a duplicate bill number on the same calendar day with 409", async () => {
    const admin = await createUser("rbbill3");
    const first = await request("/reports/data/bills", { method: "POST", token: admin.token, body: salesBillBody() });
    assert.equal(first.status, 201);
    const dup = await request("/reports/data/bills", { method: "POST", token: admin.token, body: salesBillBody() });
    assert.equal(dup.status, 409);
    // Same number on a different day is fine.
    const otherDay = await request("/reports/data/bills", {
      method: "POST",
      token: admin.token,
      body: salesBillBody({ billDate: "2026-08-12" }),
    });
    assert.equal(otherDay.status, 201);
  });

  test("lists the unified union of reportbills, sales and purchases with filters", async () => {
    const admin = await createUser("rbbill4");
    await request("/reports/data/bills", { method: "POST", token: admin.token, body: salesBillBody() });
    await request("/reports/data/bills", { method: "POST", token: admin.token, body: purchaseBillBody() });
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: {
        invoiceNo: "LEGACY-SALE",
        billDate: "2026-08-13",
        customerName: "Legacy Customer",
        items: [{ medicineName: "A", quantity: 1, unitPrice: 100, gstRate: 12 }],
        paymentMode: "Cash",
        paymentStatus: "paid",
      },
    });

    const all = await request("/reports/data/bills", { token: admin.token });
    assert.equal(all.status, 200);
    const list = (await all.json()).data;
    assert.equal(list.meta.total, 3);
    const kinds = list.items.map((i) => i.kind).sort();
    assert.deepEqual(kinds, ["bill", "bill", "sale"]);

    const salesOnly = await request("/reports/data/bills?documentType=sales", { token: admin.token });
    const salesList = (await salesOnly.json()).data;
    assert.equal(salesList.meta.total, 2); // 1 reportbill + 1 legacy sale

    const uploaded = await request("/reports/data/bills?source=uploaded", { token: admin.token });
    const uploadedList = (await uploaded.json()).data;
    assert.equal(uploadedList.meta.total, 1);
    assert.equal(uploadedList.items[0].source, "uploaded");

    const search = await request("/reports/data/bills?search=DURGA", { token: admin.token });
    assert.equal((await search.json()).data.meta.total, 1);

    const dateFilter = await request("/reports/data/bills?dateFrom=2026-08-11&dateTo=2026-08-11", { token: admin.token });
    assert.equal((await dateFilter.json()).data.meta.total, 1);

    const sorted = await request("/reports/data/bills?sort=highest", { token: admin.token });
    const sortedList = (await sorted.json()).data;
    assert.equal(sortedList.items[0].grandTotal, 132.3);
  });

  test("get/update/delete route by collection across reportbill, sale and purchase records", async () => {
    const admin = await createUser("rbbill5");
    const rb = (await (await request("/reports/data/bills", { method: "POST", token: admin.token, body: salesBillBody() })).json()).data;
    const legacySale = (await (await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: {
        invoiceNo: "LEGACY-1",
        billDate: "2026-08-13",
        customerName: "C",
        items: [{ medicineName: "A", quantity: 1, unitPrice: 100, gstRate: 12 }],
      },
    })).json()).data;
    const legacyPurchase = (await (await request("/reports/data/purchases", {
      method: "POST",
      token: admin.token,
      body: {
        invoiceNo: "LEGACY-P",
        purchaseDate: "2026-08-14",
        supplierName: "S",
        items: [{ medicineName: "B", quantity: 1, unitCost: 10, gstRate: 12 }],
      },
    })).json()).data;

    const gotRb = await request(`/reports/data/bills/${rb.id}`, { token: admin.token });
    assert.equal((await gotRb.json()).data.kind, "bill");
    const gotSale = await request(`/reports/data/bills/${legacySale.id}`, { token: admin.token });
    assert.equal((await gotSale.json()).data.kind, "sale");
    const gotPurchase = await request(`/reports/data/bills/${legacyPurchase.id}`, { token: admin.token });
    assert.equal((await gotPurchase.json()).data.kind, "purchase");

    const putRb = await request(`/reports/data/bills/${rb.id}`, {
      method: "PUT",
      token: admin.token,
      body: { customerName: "Renamed Customer", items: [{ medicineName: "A", quantity: 2, unitPrice: 100, gstRate: 12 }] },
    });
    assert.equal(putRb.status, 200);
    const updatedRb = (await putRb.json()).data;
    assert.equal(updatedRb.customerName, "Renamed Customer");
    assert.equal(updatedRb.grandTotal, 224);

    const putSale = await request(`/reports/data/bills/${legacySale.id}`, {
      method: "PUT",
      token: admin.token,
      body: { customerName: "Sale Renamed", notes: "touched" },
    });
    assert.equal((await putSale.json()).data.customerName, "Sale Renamed");

    const delRb = await request(`/reports/data/bills/${rb.id}`, { method: "DELETE", token: admin.token });
    assert.equal(delRb.status, 200);
    const delSale = await request(`/reports/data/bills/${legacySale.id}`, { method: "DELETE", token: admin.token });
    assert.equal(delSale.status, 200);
    const delPurchase = await request(`/reports/data/bills/${legacyPurchase.id}`, { method: "DELETE", token: admin.token });
    assert.equal(delPurchase.status, 200);

    const remaining = await request("/reports/data/bills", { token: admin.token });
    assert.equal((await remaining.json()).data.meta.total, 0);
  });

  test("summary aggregates total / uploaded / manual / total value", async () => {
    const admin = await createUser("rbbill6");
    await request("/reports/data/bills", { method: "POST", token: admin.token, body: salesBillBody() }); // manual 132.3
    await request("/reports/data/bills", { method: "POST", token: admin.token, body: purchaseBillBody() }); // uploaded 120
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: {
        invoiceNo: "S-1",
        billDate: "2026-08-13",
        items: [{ medicineName: "A", quantity: 1, unitPrice: 100, gstRate: 12 }],
      },
    }); // manual 112
    await request("/reports/data/purchases", {
      method: "POST",
      token: admin.token,
      body: {
        invoiceNo: "P-1",
        purchaseDate: "2026-08-14",
        supplierName: "S",
        items: [{ medicineName: "B", quantity: 1, unitCost: 10, gstRate: 12 }],
      },
    }); // manual 11.2

    const res = await request("/reports/data/bills/summary", { token: admin.token });
    assert.equal(res.status, 200);
    const summary = (await res.json()).data;
    assert.equal(summary.total, 4);
    assert.equal(summary.uploaded, 1);
    assert.equal(summary.manual, 3);
    assert.equal(summary.totalValue, 132.3 + 120 + 112 + 11.2);
  });

  test("report engine unions reportbills into sales, purchases and gst modules", async () => {
    const admin = await createUser("rbbill7");
    await request("/reports/data/bills", { method: "POST", token: admin.token, body: salesBillBody() }); // sales side, 132.3
    await request("/reports/data/bills", { method: "POST", token: admin.token, body: purchaseBillBody() }); // purchase side, 120

    const sales = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: customConfig("sales"),
    });
    assert.equal(sales.status, 200);
    const salesData = (await sales.json()).data;
    assert.equal(salesData.totalRecords, 1);
    assert.equal(salesData.totals.grandTotal, 132.3);

    const purchases = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: customConfig("purchases", { selectedFields: ["supplier"], groupBy: ["supplier"], summarizeBy: [{ field: "purchaseAmount", aggregation: "SUM" }] }),
    });
    const purchaseData = (await purchases.json()).data;
    assert.equal(purchaseData.totalRecords, 1);
    assert.equal(purchaseData.totals.purchaseAmount, 120);

    // GST partitions each report bill exactly once: one sales-type + one purchase-type.
    const gst = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: customConfig("gst", {
        selectedFields: ["documentType"],
        groupBy: ["documentType"],
        summarizeBy: [{ field: "gstAmount", aggregation: "SUM" }, { field: "invoiceCount", aggregation: "COUNT" }],
      }),
    });
    const gstData = (await gst.json()).data;
    assert.equal(gstData.totalRecords, 2);
    assert.equal(gstData.totals.gstAmount, 12.3 + 12);
    const salesRow = gstData.rows.find((r) => r.documentType === "sales_invoice");
    const purchaseRow = gstData.rows.find((r) => r.documentType === "purchase_invoice");
    assert.ok(salesRow && purchaseRow, "both sides must be represented once");
  });

  test("saved report configuration persists for later runs", async () => {
    const admin = await createUser("rbbill8");
    await request("/reports/data/bills", { method: "POST", token: admin.token, body: salesBillBody() });

    const cfg = {
      name: "Report Bills Sales",
      module: "sales",
      groupBy: ["paymentMode"],
      summarizeBy: [{ field: "netSales", aggregation: "SUM" }],
      filters: [],
      dateConfig: { presetId: "month" },
    };
    const created = await request("/reports/saved", { method: "POST", token: admin.token, body: cfg });
    assert.equal(created.status, 201);
    const saved = (await created.json()).data;
    assert.equal(saved.name, "Report Bills Sales");

    const list = await request("/reports/saved", { token: admin.token });
    assert.equal((await list.json()).data.length, 1);

    const run = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: { module: "sales", selectedFields: ["paymentMode"], groupBy: ["paymentMode"], summarizeBy: [{ field: "netSales", aggregation: "SUM" }], filters: [], dateFrom: "2026-08-01", dateTo: "2026-08-31" },
    });
    assert.equal(run.status, 200);
    assert.equal((await run.json()).data.totals.netSales, 132.3);
  });
});
