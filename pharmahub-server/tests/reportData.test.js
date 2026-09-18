import { test, before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { createApp } from "../src/app.js";
import { Role } from "../src/models/Role.js";
import { User } from "../src/models/User.js";
import { Sale } from "../src/models/Sale.js";
import { Purchase } from "../src/models/Purchase.js";
import { Batch } from "../src/models/Batch.js";
import { Medicine } from "../src/models/Medicine.js";
import { Supplier } from "../src/models/Supplier.js";
import { AuditLog } from "../src/models/AuditLog.js";
import { SavedReport } from "../src/models/SavedReport.js";
import { ScheduledReport } from "../src/models/ScheduledReport.js";

// Tests only ever run against the dedicated test database via MONGO_URI_TEST.
const uri = process.env.MONGO_URI_TEST;
let connected = false;
if (uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    connected = true;
  } catch (err) {
    console.log(`[test] MongoDB unavailable (${err?.message ?? err}); report data tests skipped`);
  }
} else {
  console.log("[test] MONGO_URI_TEST not set — report data tests skipped");
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
    Batch.deleteMany({}),
    Medicine.deleteMany({}),
    Supplier.deleteMany({}),
    AuditLog.deleteMany({}),
    SavedReport.deleteMany({}),
    ScheduledReport.deleteMany({}),
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

async function upload(path, { file, token }) {
  const form = new FormData();
  form.append("file", file, "bill.png");
  return fetch(`${base}/api/v1${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

async function createUser(prefix, role = "Admin") {
  const email = `${prefix}-${Date.now()}@pharmahub.in`;
  const reg = await request("/auth/register", {
    method: "POST",
    body: { name: "Report Data Tester", email, password: "password123" },
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

const billBody = (over = {}) => ({
  invoiceNo: "MAN-001",
  billDate: "2026-08-14",
  customerName: "Ravi Kumar",
  customerPhone: "9876543210",
  items: [
    { medicineName: "Paracetamol 650", quantity: 2, unitPrice: 50, discountPct: 0, gstRate: 12 },
    { medicineName: "ORS", quantity: 1, unitPrice: 30, discountPct: 0, gstRate: 5 },
  ],
  paymentMode: "UPI",
  paymentStatus: "paid",
  notes: "Walk-in",
  ...over,
});

// Seeds a completed Sale owned by the given user directly in the collection.
async function seedSale(userId, invoiceNo, over = {}) {
  return Sale.create({
    invoiceNo,
    customerName: over.customerName ?? "Walk-in Customer",
    customerPhone: over.customerPhone ?? "",
    items: over.items ?? [
      { medicineName: "Paracetamol 650", quantity: 1, unitPrice: 100, gstRate: 12, lineTotal: 112 },
    ],
    subtotal: over.subtotal ?? 100,
    discountTotal: over.discountTotal ?? 0,
    gstTotal: over.gstTotal ?? 12,
    roundOff: 0,
    grandTotal: over.grandTotal ?? 112,
    paymentMode: over.paymentMode ?? "Cash",
    paymentStatus: over.paymentStatus ?? "paid",
    status: "completed",
    createdBy: userId,
    createdByName: "Staff",
    source: over.source ?? "existing",
    createdAt: over.createdAt ?? new Date("2026-08-15T10:00:00Z"),
  });
}

describe("report data overview", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("list data sources is owner scoped and exposes all 10 cards", async () => {
    const admin = await createUser("rdsrc");
    await seedSale(admin.id, "RD-0001");
    const res = await request("/reports/data", { token: admin.token });
    assert.equal(res.status, 200);
    const sources = (await res.json()).data;
    assert.equal(sources.length, 10);
    const sales = sources.find((s) => s.key === "sales");
    assert.equal(sales.name, "Sales & Bills");
    assert.equal(sales.count, 1);
    assert.ok(sales.lastUpdated);
    assert.ok(sources.some((s) => s.key === "purchases"));
    assert.ok(sources.some((s) => s.key === "audit"));
  });

  test("requires authentication", async () => {
    const res = await request("/reports/data");
    assert.equal(res.status, 401);
  });
});

describe("sales bill CRUD", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("creates a bill and recomputes totals on the server", async () => {
    const admin = await createUser("rdcrud");
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody(),
    });
    assert.equal(res.status, 201);
    const bill = (await res.json()).data;
    assert.ok(bill.id);
    assert.equal(bill.invoiceNo, "MAN-001");
    assert.equal(bill.source, "manual");
    assert.equal(bill.paymentStatus, "paid");
    assert.equal(bill.itemCount, 2);
    assert.equal(bill.subtotal, 130); // 100 + 30
    assert.equal(bill.taxableAmount, 130); // 100 + 30
    assert.equal(bill.gstTotal, 13.5); // 12 + 1.5
    assert.equal(bill.grandTotal, 143.5); // raw 143.5, kept at 2 decimals
    assert.equal(bill.roundOff, 0.5); // nearest-rupee adjustment (144)
    assert.equal(bill.customerName, "Ravi Kumar");
    assert.ok(bill.billDate);
    assert.equal(bill.items[0].taxableAmount, 100);
    assert.equal(bill.items[0].gstAmount, 12);
    assert.equal(bill.items[0].lineTotal, 112);
    assert.equal(bill.items[1].taxableAmount, 30);
    assert.equal(bill.items[1].gstAmount, 1.5);

    const inDb = await Sale.findById(bill.id).lean();
    assert.equal(inDb.createdBy.toString(), admin.id);
    assert.equal(inDb.taxableAmount, 130);
    assert.equal(inDb.status, "completed");
  });

  test("rejects a bill without a bill number", async () => {
    const admin = await createUser("rdnodoc");
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "  " }),
    });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error.message, /Bill number is required/i);
  });

  test("rejects invalid quantity and negative amounts", async () => {
    const admin = await createUser("rdbad");
    const badQty = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ items: [{ medicineName: "X", quantity: 0, unitPrice: 10 }] }),
    });
    assert.equal(badQty.status, 400);
    assert.match((await badQty.json()).error.message, /quantity must be greater than 0/i);

    const badPrice = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ items: [{ medicineName: "X", quantity: 1, unitPrice: -5 }] }),
    });
    assert.equal(badPrice.status, 400);
    assert.match((await badPrice.json()).error.message, /invalid unit price/i);
  });

  test("rejects an invalid bill date and invalid payment mode", async () => {
    const admin = await createUser("rdbad2");
    const badDate = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ billDate: "not-a-date" }),
    });
    assert.equal(badDate.status, 400);
    assert.match((await badDate.json()).error.message, /invalid bill date/i);

    const badMode = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ paymentMode: "Crypto" }),
    });
    assert.equal(badMode.status, 400);
    assert.match((await badMode.json()).error.message, /invalid payment mode/i);
  });

  test("rejects a duplicate bill number for the same user and date with 409", async () => {
    const admin = await createUser("rddup");
    await seedSale(admin.id, "DUP-100", { createdAt: new Date("2026-08-14T12:00:00Z") });
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "dup-100" }),
    });
    assert.equal(res.status, 409);
    assert.match((await res.json()).error.message, /duplicate bill/i);
  });

  test("allows the same bill number on a different date", async () => {
    const admin = await createUser("rddup2");
    await seedSale(admin.id, "REUSED-01", { createdAt: new Date("2026-08-01T10:00:00Z") });
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "reused-01" }),
    });
    assert.equal(res.status, 201);
  });

  test("allows different pharmacies to reuse the same bill number", async () => {
    const alice = await createUser("rdalx");
    const bob = await createUser("rdbobx");
    await seedSale(alice.id, "PH-101", { createdAt: new Date("2026-08-14T12:00:00Z") });
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: bob.token,
      body: billBody({ invoiceNo: "ph-101" }),
    });
    assert.equal(res.status, 201);
  });

  test("lists bills with search, filters and pagination", async () => {
    const admin = await createUser("rdlist");
    await seedSale(admin.id, "LS-001", { customerName: "Ravi Kumar", paymentMode: "UPI", grandTotal: 200 });
    await seedSale(admin.id, "LS-002", { customerName: "Priya", paymentMode: "Cash", grandTotal: 50 });
    await seedSale(admin.id, "LS-003", { customerName: "Priya", paymentMode: "Cash", grandTotal: 75 });
    await seedSale(admin.id, "LS-004", { customerName: "Amit", paymentMode: "UPI", grandTotal: 900 });
    await seedSale(admin.id, "LS-005", { customerName: "Sita", paymentMode: "UPI", grandTotal: 60 });

    const page1 = await request("/reports/data/sales?page=1&limit=2", { token: admin.token });
    assert.equal(page1.status, 200);
    const body = await page1.json();
    assert.equal(body.data.items.length, 2);
    assert.equal(body.data.meta.total, 5);
    assert.equal(body.data.meta.pages, 3);
    assert.equal(body.data.meta.hasMore, true);

    const search = await request("/reports/data/sales?search=priya", { token: admin.token });
    const sBody = await search.json();
    assert.equal(sBody.data.meta.total, 2);
    assert.ok(sBody.data.items.every((i) => i.customerName === "Priya"));

    const filter = await request("/reports/data/sales?paymentMode=UPI", { token: admin.token });
    const fBody = await filter.json();
    assert.equal(fBody.data.meta.total, 3);
    assert.ok(fBody.data.items.every((i) => i.paymentMode === "UPI"));

    const sorted = await request("/reports/data/sales?sort=highest", { token: admin.token });
    const soBody = await sorted.json();
    assert.equal(soBody.data.items[0].grandTotal, 900);
  });

  test("updates a bill and recomputes totals", async () => {
    const admin = await createUser("rdupdate");
    const created = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody(),
    });
    const id = (await created.json()).data.id;

    const res = await request(`/reports/data/sales/${id}`, {
      method: "PUT",
      token: admin.token,
      body: { invoiceNo: "MAN-002", items: [{ medicineName: "ORS", quantity: 2, unitPrice: 30, gstRate: 5 }] },
    });
    assert.equal(res.status, 200);
    const bill = (await res.json()).data;
    assert.equal(bill.invoiceNo, "MAN-002");
    assert.equal(bill.itemCount, 1);
    assert.equal(bill.subtotal, 60);
    assert.equal(bill.grandTotal, 63);

    const after = await request(`/reports/data/sales/${id}`, { token: admin.token });
    assert.equal((await after.json()).data.invoiceNo, "MAN-002");
  });

  test("deletes a bill owned by the user", async () => {
    const admin = await createUser("rddel");
    const doc = await seedSale(admin.id, "DEL-001");
    const res = await request(`/reports/data/sales/${doc._id}`, {
      method: "DELETE",
      token: admin.token,
    });
    assert.equal(res.status, 200);
    const missing = await request(`/reports/data/sales/${doc._id}`, { token: admin.token });
    assert.equal(missing.status, 404);
  });
});

describe("sales bill ownership", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("users only see and manage their own bills", async () => {
    const alice = await createUser("rdalice");
    const bob = await createUser("rdbob");

    const aliceBill = await seedSale(alice.id, "OWN-001");
    const bobBill = await seedSale(bob.id, "OWN-002");

    const aliceList = await request("/reports/data/sales", { token: alice.token });
    const aItems = (await aliceList.json()).data.items;
    assert.equal(aItems.length, 1);
    assert.equal(aItems[0].invoiceNo, "OWN-001");

    const crossGet = await request(`/reports/data/sales/${aliceBill._id}`, { token: bob.token });
    assert.equal(crossGet.status, 404);

    const crossPut = await request(`/reports/data/sales/${aliceBill._id}`, {
      method: "PUT",
      token: bob.token,
      body: { invoiceNo: "HACK-001" },
    });
    assert.equal(crossPut.status, 404);

    const crossDelete = await request(`/reports/data/sales/${aliceBill._id}`, {
      method: "DELETE",
      token: bob.token,
    });
    assert.equal(crossDelete.status, 404);

    const stillThere = await Sale.findById(bobBill._id).lean();
    assert.ok(stillThere);
  });
});

describe("bill image upload", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("accepts a valid image and returns a manual-review fallback", async () => {
    const admin = await createUser("rdupl");
    const res = await upload("/reports/data/sales/upload", {
      token: admin.token,
      file: new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.match(data.file.path, /^\/uploads\/bills\/.+\.png$/);
    assert.equal(data.file.mimeType, "image/png");
    assert.equal(data.extraction.status, "manual");
    assert.match(data.extraction.message, /manual/i);
  });

  test("rejects a non-image file", async () => {
    const admin = await createUser("rdupl2");
    const res = await upload("/reports/data/sales/upload", {
      token: admin.token,
      file: new Blob(["hello"], { type: "text/plain" }),
    });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error.message, /JPEG, PNG and WEBP/i);
  });

  test("rejects an oversized file", async () => {
    const admin = await createUser("rdupl3");
    const big = new Blob([new Uint8Array(10 * 1024 * 1024 + 1024)], { type: "image/jpeg" });
    const res = await upload("/reports/data/sales/upload", {
      token: admin.token,
      file: big,
    });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error.message, /too large/i);
  });

  test("requires authentication", async () => {
    const res = await upload("/reports/data/sales/upload", {
      file: new Blob([new Uint8Array([1])], { type: "image/png" }),
    });
    assert.equal(res.status, 401);
  });
});

describe("CSV validation and import", { skip: !connected && "MongoDB not available - skipped" }, () => {
  const csv = `bill number,date,customer name,customer phone,medicine name,quantity,unit price,payment mode
INV-CSV-001,2026-08-10,Ravi Kumar,9876543210,Paracetamol 650,2,50,UPI
INV-CSV-002,2026-08-11,Priya,9111111111,ORS,3,30,Cash
INV-CSV-003,2026-08-12,Walk-in Customer,,Azithromycin 500,1,80,Cash`;

  test("validates a CSV and reports per-row results", async () => {
    const admin = await createUser("rdval");
    const res = await request("/reports/data/sales/validate-import", {
      method: "POST",
      token: admin.token,
      body: { csv },
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.totalRows, 3);
    assert.equal(data.validCount, 3);
    assert.equal(data.errorCount, 0);
    assert.equal(data.duplicates.length, 0);
    assert.equal(data.preview.length, 3);
    assert.ok(data.preview[0].valid);
    assert.equal(data.preview[0].data.invoiceNo, "INV-CSV-001");
    assert.ok(data.preview[0].data.billDate.startsWith("2026-08-10"));
  });

  test("flags invalid rows with row-level errors", async () => {
    const admin = await createUser("rdval2");
    const bad = `${csv}
,2026-08-13,Ravi,,Medicine X,0,-5,UPI
INV-CSV-004,not-a-date,Ravi,,Medicine Y,1,10,Cash`;
    const res = await request("/reports/data/sales/validate-import", {
      method: "POST",
      token: admin.token,
      body: { csv: bad },
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.errorCount, 2);
    const row5 = data.preview.find((r) => r.row === 5);
    assert.ok(row5);
    assert.equal(row5.valid, false);
    assert.match(row5.errors.join(" "), /Missing Bill Number/i);
    assert.match(row5.errors.join(" "), /Quantity must be greater than 0/i);
    assert.match(row5.errors.join(" "), /Invalid amount/i);
    const row6 = data.preview.find((r) => r.row === 6);
    assert.ok(row6);
    assert.match(row6.errors.join(" "), /Invalid date/i);
  });

  test("detects duplicates inside the file and against the database", async () => {
    const admin = await createUser("rdval3");
    await seedSale(admin.id, "INV-CSV-001");
    const res = await request("/reports/data/sales/validate-import", {
      method: "POST",
      token: admin.token,
      body: { csv: `${csv}
INV-CSV-003,2026-08-12,Walk-in Customer,,Azithromycin 500,1,80,Cash` },
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    const reasons = data.duplicates.map((d) => d.reason);
    assert.ok(reasons.includes("duplicate within file"));
    assert.ok(reasons.includes("bill already exists"));
  });

  test("imports valid rows and they appear in reports", async () => {
    const admin = await createUser("rdimp");
    const validation = await request("/reports/data/sales/validate-import", {
      method: "POST",
      token: admin.token,
      body: { csv },
    });
    const preview = (await validation.json()).data.preview;

    const res = await request("/reports/data/sales/import", {
      method: "POST",
      token: admin.token,
      body: { rows: preview, duplicateMode: "skip" },
    });
    assert.equal(res.status, 201);
    const result = (await res.json()).data;
    assert.equal(result.inserted, 3);
    assert.equal(result.skipped, 0);

    const inDb = await Sale.countDocuments({ createdBy: admin.id, source: "imported" });
    assert.equal(inDb, 3);

    const list = await request("/reports/data/sales", { token: admin.token });
    assert.equal((await list.json()).data.meta.total, 3);
  });

  test("import skips or replaces existing bills per duplicateMode", async () => {
    const admin = await createUser("rdimp2");
    await seedSale(admin.id, "INV-CSV-001", { grandTotal: 999 });

    const validation = await request("/reports/data/sales/validate-import", {
      method: "POST",
      token: admin.token,
      body: { csv },
    });
    const preview = (await validation.json()).data.preview;

    const skip = await request("/reports/data/sales/import", {
      method: "POST",
      token: admin.token,
      body: { rows: preview, duplicateMode: "skip" },
    });
    const skipRes = (await skip.json()).data;
    assert.equal(skipRes.inserted, 2);
    assert.equal(skipRes.skipped, 1);
    const untouched = await Sale.findOne({ invoiceNo: "INV-CSV-001" }).lean();
    assert.equal(untouched.grandTotal, 999);

    const replace = await request("/reports/data/sales/import", {
      method: "POST",
      token: admin.token,
      body: { rows: preview, duplicateMode: "replace" },
    });
    const repRes = (await replace.json()).data;
    assert.equal(repRes.replaced, 3);
    const replaced = await Sale.findOne({ invoiceNo: "INV-CSV-001" }).lean();
    assert.equal(replaced.grandTotal, 100); // 2 x 50, no GST column in the CSV
  });

  test("cancel mode aborts when duplicates exist", async () => {
    const admin = await createUser("rdimp3");
    await seedSale(admin.id, "INV-CSV-001");
    const validation = await request("/reports/data/sales/validate-import", {
      method: "POST",
      token: admin.token,
      body: { csv },
    });
    const preview = (await validation.json()).data.preview;
    const res = await request("/reports/data/sales/import", {
      method: "POST",
      token: admin.token,
      body: { rows: preview, duplicateMode: "cancel" },
    });
    assert.equal(res.status, 409);
  });
});

describe("reports run against created bills", { skip: !connected && "MongoDB not available - skipped" }, () => {
  const config = (over = {}) => ({
    module: "sales",
    selectedFields: over.selectedFields ?? ["paymentMode"],
    groupBy: over.groupBy ?? ["paymentMode"],
    summarizeBy: over.summarizeBy ?? [{ field: "grandTotal", aggregation: "SUM" }],
    filters: over.filters ?? [],
    dateFrom: over.dateFrom ?? "2026-08-01",
    dateTo: over.dateTo ?? "2026-08-31",
  });

  test("manually entered and imported bills feed the custom report engine", async () => {
    const admin = await createUser("rdreport");
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "M-1", paymentMode: "UPI", items: [{ medicineName: "A", quantity: 1, unitPrice: 100, gstRate: 12 }] }),
    });
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "M-2", paymentMode: "Cash", items: [{ medicineName: "A", quantity: 1, unitPrice: 50, gstRate: 12 }] }),
    });
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "M-3", paymentMode: "UPI", items: [{ medicineName: "A", quantity: 1, unitPrice: 150, gstRate: 12 }] }),
    });

    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: config({ summarizeBy: [{ field: "grandTotal", aggregation: "SUM" }, { field: "quantity", aggregation: "COUNT" }] }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 3);
    assert.equal(data.totals.grandTotal, 336); // 112 + 56 + 168
    assert.equal(data.totals.quantity, 3); // COUNT accumulates the row count

    const upi = data.rows.find((r) => r.paymentMode === "UPI");
    assert.equal(upi.grandTotal, 280);
    assert.equal(upi.quantity, 2);
    const cash = data.rows.find((r) => r.paymentMode === "Cash");
    assert.equal(cash.grandTotal, 56);
  });

  test("filters on a measure field (grandTotal) against real persisted values", async () => {
    const admin = await createUser("rdreport2");
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "F-1", paymentMode: "UPI", items: [{ medicineName: "A", quantity: 1, unitPrice: 100, gstRate: 12 }] }),
    });
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "F-2", paymentMode: "Cash", items: [{ medicineName: "A", quantity: 1, unitPrice: 50, gstRate: 12 }] }),
    });
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "F-3", paymentMode: "UPI", items: [{ medicineName: "A", quantity: 1, unitPrice: 150, gstRate: 12 }] }),
    });

    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: config({ filters: [{ field: "grandTotal", operator: "greater_than", value: "100" }] }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 2); // 112 and 168
    assert.equal(data.totals.grandTotal, 280);
  });

  test("date window, payment mode and customer filters apply to created bills", async () => {
    const admin = await createUser("rdreport3");
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "W-1", billDate: "2026-08-05", customerName: "Ravi", paymentMode: "UPI", items: [{ medicineName: "A", quantity: 1, unitPrice: 100, gstRate: 0 }] }),
    });
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({ invoiceNo: "W-2", billDate: "2026-08-20", customerName: "Priya", paymentMode: "Cash", items: [{ medicineName: "B", quantity: 1, unitPrice: 100, gstRate: 0 }] }),
    });

    const outside = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: config({ dateFrom: "2026-09-01", dateTo: "2026-09-30" }),
    });
    assert.equal((await outside.json()).data.totalRecords, 0);

    const byMode = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: config({ filters: [{ field: "paymentMode", operator: "equals", value: "UPI" }] }),
    });
    const modeData = (await byMode.json()).data;
    assert.equal(modeData.totalRecords, 1);
    assert.equal(modeData.rows[0].paymentMode, "UPI");

    const byCustomer = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: config({ filters: [{ field: "customer", operator: "equals", value: "Priya" }] }),
    });
    assert.equal((await byCustomer.json()).data.totalRecords, 1);
  });

  test("averages grand total across created bills", async () => {
    const admin = await createUser("rdreport4");
    await seedSale(admin.id, "AVG-1", { grandTotal: 100 });
    await seedSale(admin.id, "AVG-2", { grandTotal: 200 });
    await seedSale(admin.id, "AVG-3", { grandTotal: 300 });
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: config({ summarizeBy: [{ field: "grandTotal", aggregation: "AVG" }] }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.totals.grandTotal, 200);
    assert.equal(data.rows[0].grandTotal, 200);
  });

  test("spec acceptance: MAN-001 + MAN-002 total to Arjun 324.80 by customer", async () => {
    const admin = await createUser("rdaccept");
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({
        invoiceNo: "MAN-001",
        customerName: "Arjun",
        paymentMode: "UPI",
        items: [{ medicineName: "Dolo 650", quantity: 1, unitPrice: 100, discountPct: 0, gstRate: 12 }],
      }),
    });
    await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: billBody({
        invoiceNo: "MAN-002",
        customerName: "Arjun",
        paymentMode: "Cash",
        items: [{ medicineName: "Dolo 650", quantity: 2, unitPrice: 100, discountPct: 5, gstRate: 12 }],
      }),
    });

    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: config({
        groupBy: ["customer"],
        summarizeBy: [{ field: "grandTotal", aggregation: "SUM" }],
      }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 2);
    const arjun = data.rows.find((r) => r.customer === "Arjun");
    assert.ok(arjun);
    assert.equal(arjun.grandTotal, 324.8); // 112 + 212.80
    assert.equal(data.totals.grandTotal, 324.8);
  });
});

describe("bill discount calculation", { skip: !connected && "MongoDB not available - skipped" }, () => {
  const discountBill = (over = {}) =>
    billBody({ customerName: "Discount Tester", ...over });

  test("Test 1 — no discount: taxable equals subtotal, GST on subtotal", async () => {
    const admin = await createUser("rdd1");
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: discountBill({
        invoiceNo: "DISC-1",
        items: [{ medicineName: "Dolo", quantity: 1, unitPrice: 100, discountPct: 0, gstRate: 5 }],
      }),
    });
    assert.equal(res.status, 201);
    const bill = (await res.json()).data;
    assert.equal(bill.subtotal, 100);
    assert.equal(bill.discountTotal, 0);
    assert.equal(bill.taxableAmount, 100);
    assert.equal(bill.gstTotal, 5);
    assert.equal(bill.grandTotal, 105);
  });

  test("Test 2 — 10% discount reduces taxable and GST", async () => {
    const admin = await createUser("rdd2");
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: discountBill({
        invoiceNo: "DISC-2",
        items: [{ medicineName: "Dolo", quantity: 1, unitPrice: 100, discountPct: 10, gstRate: 5 }],
      }),
    });
    assert.equal(res.status, 201);
    const bill = (await res.json()).data;
    assert.equal(bill.subtotal, 100);
    assert.equal(bill.discountTotal, 10);
    assert.equal(bill.taxableAmount, 90);
    assert.equal(bill.gstTotal, 4.5);
    assert.equal(bill.grandTotal, 94.5);
    assert.equal(bill.items[0].discountPct, 10);
    assert.equal(bill.items[0].taxableAmount, 90);
    assert.equal(bill.items[0].gstAmount, 4.5);
    assert.equal(bill.items[0].lineTotal, 94.5);
  });

  test("Test 3 — 20% discount on ₹500 at 12% GST", async () => {
    const admin = await createUser("rdd3");
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: discountBill({
        invoiceNo: "DISC-3",
        items: [{ medicineName: "Dolo", quantity: 5, unitPrice: 100, discountPct: 20, gstRate: 12 }],
      }),
    });
    assert.equal(res.status, 201);
    const bill = (await res.json()).data;
    assert.equal(bill.subtotal, 500);
    assert.equal(bill.discountTotal, 100);
    assert.equal(bill.taxableAmount, 400);
    assert.equal(bill.gstTotal, 48);
    assert.equal(bill.grandTotal, 448);
  });

  test("Test 4 — multi-item bill sums the item-level discounts", async () => {
    const admin = await createUser("rdd4");
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: discountBill({
        invoiceNo: "DISC-4",
        items: [
          { medicineName: "Dolo", quantity: 2, unitPrice: 100, discountPct: 10, gstRate: 5 },
          { medicineName: "Azithromycin", quantity: 1, unitPrice: 200, discountPct: 5, gstRate: 12 },
        ],
      }),
    });
    assert.equal(res.status, 201);
    const bill = (await res.json()).data;
    // Item 1: gross 200, discount 20, taxable 180, GST 9, total 189
    // Item 2: gross 200, discount 10, taxable 190, GST 22.80, total 212.80
    assert.equal(bill.subtotal, 400);
    assert.equal(bill.discountTotal, 30);
    assert.equal(bill.taxableAmount, 370);
    assert.equal(bill.gstTotal, 31.8);
    assert.equal(bill.grandTotal, 401.8);
    assert.equal(bill.items[0].lineTotal, 189);
    assert.equal(bill.items[1].lineTotal, 212.8);
  });

  test("Test 5 — saved totals survive a reload", async () => {
    const admin = await createUser("rdd5");
    const createdRes = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: discountBill({
        invoiceNo: "DISC-5",
        items: [{ medicineName: "Dolo", quantity: 1, unitPrice: 100, discountPct: 10, gstRate: 5 }],
      }),
    });
    const created = (await createdRes.json()).data;
    assert.equal(created.subtotal, 100);
    assert.equal(created.discountTotal, 10);
    assert.equal(created.taxableAmount, 90);
    assert.equal(created.gstTotal, 4.5);
    assert.equal(created.grandTotal, 94.5);

    const fetchedRes = await request(`/reports/data/sales/${created.id}`, { token: admin.token });
    assert.equal(fetchedRes.status, 200);
    const fetched = (await fetchedRes.json()).data;
    assert.equal(fetched.subtotal, 100);
    assert.equal(fetched.discountTotal, 10);
    assert.equal(fetched.taxableAmount, 90);
    assert.equal(fetched.gstTotal, 4.5);
    assert.equal(fetched.grandTotal, 94.5);
  });

  test("100% discount clamps taxable to zero instead of going negative", async () => {
    const admin = await createUser("rdd6");
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: discountBill({
        invoiceNo: "DISC-6",
        items: [{ medicineName: "Dolo", quantity: 1, unitPrice: 100, discountPct: 100, gstRate: 5 }],
      }),
    });
    assert.equal(res.status, 201);
    const bill = (await res.json()).data;
    assert.equal(bill.subtotal, 100);
    assert.equal(bill.discountTotal, 100);
    assert.equal(bill.taxableAmount, 0);
    assert.equal(bill.gstTotal, 0);
    assert.equal(bill.grandTotal, 0);
  });

  test("discount above 100% is rejected", async () => {
    const admin = await createUser("rdd7");
    const res = await request("/reports/data/sales", {
      method: "POST",
      token: admin.token,
      body: discountBill({
        invoiceNo: "DISC-7",
        items: [{ medicineName: "Dolo", quantity: 1, unitPrice: 100, discountPct: 110, gstRate: 5 }],
      }),
    });
    assert.equal(res.status, 400);
  });
});

describe("purchase report data", { skip: !connected && "MongoDB not available - skipped" }, () => {
  const purchaseBody = (over = {}) => ({
    invoiceNo: "SRJ001107",
    purchaseDate: "2026-08-14",
    supplierName: "SRI SAI VENKATA DURGA ENTERPRISES",
    items: [
      {
        medicineName: "Dolo 650",
        hsnCode: "30049069",
        pack: "2x10",
        batchNumber: "BYE3L033",
        expiryDate: "11/28",
        manufacturer: "Micro Labs",
        quantity: 2,
        unitCost: 2036.3,
        mrp: 2455.2,
        discountPct: 4,
        sgstRate: 2.5,
        cgstRate: 2.5,
      },
    ],
    printedGrandTotal: 4160,
    documentType: "purchase_invoice",
    source: "uploaded",
    notes: "Uploaded purchase invoice",
    ...over,
  });

  test("creates a purchase from an uploaded invoice, keeping the printed total authoritative", async () => {
    const admin = await createUser("rdpcrd");
    const file = new Blob([Buffer.from("fake-png")], { type: "image/png" });
    const up = await upload("/reports/data/purchases/upload", { file, token: admin.token });
    assert.equal(up.status, 200);
    const upData = (await up.json()).data;
    assert.match(upData.file.path, /^\/uploads\/bills\//);
    assert.equal(upData.extraction.status, "manual");

    const res = await request("/reports/data/purchases", {
      method: "POST",
      token: admin.token,
      body: purchaseBody({ originalDocument: upData.file }),
    });
    assert.equal(res.status, 201);
    const doc = (await res.json()).data;
    assert.equal(doc.invoiceNo, "SRJ001107");
    assert.equal(doc.supplier, "SRI SAI VENKATA DURGA ENTERPRISES");
    assert.equal(doc.grandTotal, 4160, "printed total wins");
    assert.equal(doc.printedGrandTotal, 4160);
    assert.equal(doc.calculatedGrandTotal, 4105.18);
    assert.equal(doc.taxableAmount, 3909.7);
    assert.equal(doc.totalSGST, 97.74);
    assert.equal(doc.totalCGST, 97.74);
    assert.equal(doc.gstTotal, 195.48);
    assert.equal(doc.items[0].sgstAmount, 97.74);
    assert.equal(doc.items[0].batchNumber, "BYE3L033");
    assert.ok(doc.originalDocument.path);

    const fetched = await request(`/reports/data/purchases/${doc.id}`, { token: admin.token });
    assert.equal((await fetched.json()).data.supplierName, "SRI SAI VENKATA DURGA ENTERPRISES");
  });

  test("uploaded purchases aggregate in the purchases report module by supplier", async () => {
    const admin = await createUser("rdprag");
    await request("/reports/data/purchases", { method: "POST", token: admin.token, body: purchaseBody() });
    await request("/reports/data/purchases", {
      method: "POST",
      token: admin.token,
      body: purchaseBody({
        invoiceNo: "SRJ002208",
        items: [{ medicineName: "Dolo 650", hsnCode: "30049069", quantity: 1, unitCost: 5000, sgstRate: 0, cgstRate: 0 }],
        printedGrandTotal: 5000,
      }),
    });

    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: {
        module: "purchases",
        selectedFields: ["supplier"],
        groupBy: ["supplier"],
        summarizeBy: [{ field: "purchaseAmount", aggregation: "SUM" }],
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
      },
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 2);
    assert.equal(data.totals.purchaseAmount, 9160, "two invoices must sum to 4160 + 5000");
    assert.equal(data.rows[0].purchaseAmount, 9160);

    const gst = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: {
        module: "suppliers",
        selectedFields: ["supplier"],
        groupBy: ["supplier"],
        summarizeBy: [{ field: "purchaseAmount", aggregation: "SUM" }, { field: "totalSGST", aggregation: "SUM" }],
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
      },
    });
    assert.equal((await gst.json()).data.totals.purchaseAmount, 9160);
  });

  test("duplicate purchase protection is owner + number + date scoped", async () => {
    const admin = await createUser("rdpdup");
    await request("/reports/data/purchases", { method: "POST", token: admin.token, body: purchaseBody() });

    const sameDay = await request("/reports/data/purchases", {
      method: "POST",
      token: admin.token,
      body: purchaseBody({ printedGrandTotal: 5000 }),
    });
    assert.equal(sameDay.status, 409);

    const otherDay = await request("/reports/data/purchases", {
      method: "POST",
      token: admin.token,
      body: purchaseBody({ purchaseDate: "2026-08-20" }),
    });
    assert.equal(otherDay.status, 201);

    const otherUser = await createUser("rdpdupb");
    const foreign = await request("/reports/data/purchases", {
      method: "POST",
      token: otherUser.token,
      body: purchaseBody(),
    });
    assert.equal(foreign.status, 201, "another pharmacy may reuse the number on the same date");
  });

  test("owner scoping keeps another user's purchases out of reports", async () => {
    const alice = await createUser("rdpsca");
    const bob = await createUser("rdpscb");
    await request("/reports/data/purchases", { method: "POST", token: alice.token, body: purchaseBody() });
    await request("/reports/data/purchases", {
      method: "POST",
      token: bob.token,
      body: purchaseBody({ invoiceNo: "BOB-1", printedGrandTotal: 700 }),
    });

    const res = await request("/reports/custom", {
      method: "POST",
      token: bob.token,
      body: {
        module: "purchases",
        selectedFields: ["supplier"],
        groupBy: ["supplier"],
        summarizeBy: [{ field: "purchaseAmount", aggregation: "SUM" }],
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
      },
    });
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 1, "bob must only see his own purchase");
    assert.equal(data.totals.purchaseAmount, 700);
  });

  test("update and delete a purchase", async () => {
    const admin = await createUser("rdpupd");
    const created = (await (await request("/reports/data/purchases", { method: "POST", token: admin.token, body: purchaseBody() })).json()).data;

    const updated = await request(`/reports/data/purchases/${created.id}`, {
      method: "PUT",
      token: admin.token,
      body: { supplierName: "Updated Distributors", items: [{ medicineName: "Dolo 650", quantity: 1, unitCost: 100, gstRate: 5 }], printedGrandTotal: 105 },
    });
    assert.equal(updated.status, 200);
    const upd = (await updated.json()).data;
    assert.equal(upd.supplierName, "Updated Distributors");
    assert.equal(upd.grandTotal, 105);
    assert.equal(upd.taxableAmount, 100);
    assert.equal(upd.totalSGST, 2.5);
    assert.equal(upd.totalCGST, 2.5);

    const del = await request(`/reports/data/purchases/${created.id}`, { method: "DELETE", token: admin.token });
    assert.equal(del.status, 200);
    assert.equal((await (await request("/reports/data/purchases", { token: admin.token })).json()).data.meta.total, 0);
  });

  test("CSV import creates purchases, flags duplicates and respects replace", async () => {
    const admin = await createUser("rdpcsv");
    const csv = [
      "Invoice No,Date,Supplier,Product,Qty,Rate,SGST %,CGST %",
      "CSV-P1,2026-08-10,Distributor A,Medicine X,10,8,0,0",
      "CSV-P2,2026-08-11,Distributor A,Medicine Y,5,100,2.5,2.5",
    ].join("\n");

    const validated = await request("/reports/data/purchases/validate-import", {
      method: "POST",
      token: admin.token,
      body: { csv },
    });
    assert.equal(validated.status, 200);
    const vData = (await validated.json()).data;
    assert.equal(vData.validCount, 2);
    assert.equal(vData.errorCount, 0);

    const imported = await request("/reports/data/purchases/import", {
      method: "POST",
      token: admin.token,
      body: { rows: vData.preview, duplicateMode: "skip" },
    });
    assert.equal(imported.status, 201);
    assert.equal((await imported.json()).data.inserted, 2);

    const again = await request("/reports/data/purchases/import", {
      method: "POST",
      token: admin.token,
      body: { rows: vData.preview, duplicateMode: "skip" },
    });
    assert.equal((await again.json()).data.skipped, 2);

    const total = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: {
        module: "purchases",
        selectedFields: ["supplier"],
        groupBy: ["supplier"],
        summarizeBy: [{ field: "purchaseAmount", aggregation: "SUM" }],
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
      },
    });
    const data = (await total.json()).data;
    assert.equal(data.totalRecords, 2);
    assert.equal(data.totals.purchaseAmount, 80 + 525, "80 + (500 taxable + 25 gst)");
  });
});

describe("read-only report data sources", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("lists purchases, medicines and suppliers from persisted models", async () => {
    const admin = await createUser("rdro");
    const supplier = await Supplier.create({ name: "MedDistributors", gstNumber: "GST123" });
    const med = await Medicine.create({ name: "Azithromycin 500", hsnCode: "30049011", gstRate: 12 });
    await Purchase.create({
      orderNo: "PO-9001",
      supplierId: supplier._id,
      createdBy: admin.id,
      items: [{ medicineId: med._id, medicineName: "Azithromycin 500", quantity: 10, quantityReceived: 10, unitCost: 8, gstRate: 12, lineTotal: 80 }],
      subtotal: 80,
      gstTotal: 9.6,
      grandTotal: 89.6,
    });

    const purchases = await request("/reports/data/purchases", { token: admin.token });
    const pData = (await purchases.json()).data;
    assert.equal(pData.items.length, 1);
    assert.equal(pData.items[0].supplier, "MedDistributors");
    assert.equal(pData.items[0].orderNo, "PO-9001");
    assert.equal(pData.meta.total, 1);

    const meds = await request("/reports/data/medicines", { token: admin.token });
    assert.equal((await meds.json()).data.items.length, 1);

    const suppliers = await request("/reports/data/suppliers", { token: admin.token });
    assert.equal((await suppliers.json()).data.items[0][0], "MedDistributors");
  });

  test("customers and payments are derived from the user's own sales only", async () => {
    const alice = await createUser("rdroa");
    const bob = await createUser("rdrob");
    await seedSale(alice.id, "C-1", { customerName: "Ravi Kumar", grandTotal: 112, paymentMode: "UPI" });
    await seedSale(bob.id, "C-2", { customerName: "Ravi Kumar", grandTotal: 5000, paymentMode: "UPI" });

    const aliceCustomers = await request("/reports/data/customers", { token: alice.token });
    const cData = (await aliceCustomers.json()).data;
    assert.equal(cData.items.length, 1);
    assert.equal(cData.items[0][2], 112); // Ravi Kumar total for Alice only

    const bobPayments = await request("/reports/data/payments", { token: bob.token });
    const pData = (await bobPayments.json()).data;
    assert.equal(pData.items.length, 1);
    assert.equal(pData.items[0][4], 5000);
  });

  test("rejects an unknown source", async () => {
    const admin = await createUser("rdro2");
    const res = await request("/reports/data/nope", { token: admin.token });
    assert.equal(res.status, 400);
  });
});
