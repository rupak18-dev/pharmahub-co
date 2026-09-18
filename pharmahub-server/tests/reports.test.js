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
import { isValidEmail, computeNextRunAt } from "../src/services/report.service.js";
import { processScheduledReports } from "../src/jobs/scheduledReports.job.js";

// Tests only ever run against the dedicated test database via MONGO_URI_TEST.
// Without it the reports tests are skipped — the configured MONGO_URL is never
// used for tests, so data can never leak into a real database.
const uri = process.env.MONGO_URI_TEST;
let connected = false;
if (uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    connected = true;
  } catch (err) {
    console.log(`[test] MongoDB unavailable (${err?.message ?? err}); reports tests skipped`);
  }
} else {
  console.log("[test] MONGO_URI_TEST not set — reports tests skipped (the configured MONGO_URL is never used for tests)");
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
  // Only ever drop the dedicated test database — never the dev/production DB.
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

async function createUser(prefix, role = "Admin") {
  const email = `${prefix}-${Date.now()}@pharmahub.in`;
  const reg = await request("/auth/register", {
    method: "POST",
    body: { name: "Report Tester", email, password: "password123" },
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

// Seeds one medicine + batch and four completed sales with fixed timestamps so
// date-window, grouping and filtering assertions are deterministic.
async function seedSales(ownerId) {
  const med = await Medicine.create({ name: "Paracetamol 650", hsnCode: "30049011", gstRate: 12 });
  const batch = await Batch.create({
    medicineId: med._id,
    batchNumber: "B-2026-01",
    mfgDate: new Date("2026-01-01T00:00:00Z"),
    expiryDate: new Date("2027-01-01T00:00:00Z"),
    currentStock: 100,
    purchasePrice: 10,
  });
  const mk = (invoiceNo, createdAt, over = {}) =>
    Sale.create({
      invoiceNo,
      createdBy: ownerId,
      customerName: over.customerName ?? "Walk-in Customer",
      paymentMode: over.paymentMode ?? "Cash",
      items: [
        {
          medicineId: med._id,
          batchId: batch._id,
          medicineName: "Paracetamol 650",
          quantity: over.qty ?? 1,
          unitPrice: 50,
          lineTotal: (over.qty ?? 1) * 50,
          gstRate: 12,
        },
      ],
      subtotal: (over.qty ?? 1) * 50,
      gstTotal: (over.qty ?? 1) * 6,
      grandTotal: (over.qty ?? 1) * 56,
      status: over.status ?? "completed",
      createdAt,
      createdByName: "Raja",
    });
  const sales = [
    await mk("INV-1001", new Date("2026-08-10T12:00:00Z"), { paymentMode: "UPI", qty: 2 }),
    await mk("INV-1002", new Date("2026-08-10T13:00:00Z"), { paymentMode: "Cash", customerName: "Anita", qty: 1 }),
    await mk("INV-1003", new Date("2026-08-11T12:00:00Z"), { paymentMode: "UPI", qty: 3 }),
    await mk("INV-1004", new Date("2026-08-20T12:00:00Z"), { paymentMode: "Card" }),
  ];
  return { med, batch, sales };
}

const salesConfig = (over = {}) => ({
  module: "sales",
  selectedFields: over.selectedFields ?? ["paymentMode"],
  groupBy: over.groupBy ?? ["paymentMode"],
  summarizeBy: over.summarizeBy ?? [{ field: "netSales", aggregation: "SUM" }],
  filters: over.filters ?? [],
  dateFrom: over.dateFrom ?? "2026-08-01",
  dateTo: over.dateTo ?? "2026-08-31",
  ...over,
});

describe("report API authentication and catalog", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("report endpoints require authentication", async () => {
    const res = await request("/reports");
    assert.equal(res.status, 401);
  });

  test("Pharmacist can view the catalog but not create saved reports", async () => {
    const pharma = await createUser("rpharma", "Pharmacist");
    assert.equal((await request("/reports", { token: pharma.token })).status, 200);
    const create = await request("/reports/saved", {
      method: "POST",
      token: pharma.token,
      body: { name: "nope", module: "sales" },
    });
    assert.equal(create.status, 403);
  });

  test("catalog exposes builder modules and standard reports with fields/measures", async () => {
    const admin = await createUser("rcat");
    const res = await request("/reports", { token: admin.token });
    assert.equal(res.status, 200);
    const catalog = (await res.json()).data;
    assert.ok(Array.isArray(catalog));

    const sales = catalog.find((r) => r.key === "sales");
    assert.ok(sales, "sales module must be listed");
    assert.equal(sales.type, "custom");
    assert.equal(sales.endpoint, "/reports/sales");
    assert.ok(sales.availableFields.some((f) => f.key === "staff"));
    assert.ok(sales.availableFields.some((f) => f.key === "customer"));
    assert.ok(sales.measures.some((m) => m.key === "netSales"));
    assert.ok(sales.filters.includes("paymentMode"));

    const stock = catalog.find((r) => r.key === "stock-valuation");
    assert.ok(stock, "stock-valuation standard report must be listed");
    assert.equal(stock.endpoint, "/reports/stock-valuation");

    for (const key of ["gst", "payments", "customers", "purchases", "suppliers", "inventory", "expiry", "medicines", "audit"]) {
      assert.ok(catalog.some((r) => r.key === key), `catalog must include "${key}"`);
    }
  });
});

describe("standard reports", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("sales report aggregates completed sales within the date window", async () => {
    const admin = await createUser("rsales");
    await seedSales(admin.id);
    const res = await request("/reports/sales?from=2026-08-01&to=2026-08-31&groupBy=month", { token: admin.token });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.summary.totalInvoices, 4);
    assert.equal(data.summary.totalSales, 392);
    assert.equal(data.summary.totalGst, 42);
    assert.equal(data.series.length, 1);
    assert.equal(data.series[0].period, "2026-08");
    assert.equal(data.series[0].sales, 392);
  });

  test("sales report rejects an invalid from date", async () => {
    const admin = await createUser("rsalesbad");
    const res = await request("/reports/sales?from=not-a-date", { token: admin.token });
    assert.equal(res.status, 400);
  });

  test("purchase report totals supplier spend", async () => {
    const admin = await createUser("rpurchase");
    const supplier = await Supplier.create({ name: "MedDistributors", gstNumber: "GST123" });
    const med = await Medicine.create({ name: "Azithromycin 500", hsnCode: "30049011" });
    await Purchase.create({
      orderNo: "PO-2001",
      supplierId: supplier._id,
      createdBy: admin.id,
      items: [{ medicineId: med._id, medicineName: "Azithromycin 500", quantity: 10, quantityReceived: 10, unitCost: 8, gstRate: 12, lineTotal: 80 }],
      subtotal: 80,
      gstTotal: 9.6,
      grandTotal: 89.6,
      status: "received",
      createdAt: new Date("2026-08-10T12:00:00Z"),
    });
    const res = await request("/reports/purchases?from=2026-08-01&to=2026-08-31", { token: admin.token });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.summary.totalOrders, 1);
    assert.equal(data.summary.received, 1);
    assert.equal(data.summary.totalSpend, 89.6);
    assert.equal(data.records[0].supplierId.name, "MedDistributors");
  });

  test("expiry report separates expired and expiring batches and clamps bad days", async () => {
    const med = await Medicine.create({ name: "Vitamin D3", hsnCode: "300450" });
    const past = new Date("2026-01-01T00:00:00Z");
    const soon = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    await Batch.create({ medicineId: med._id, batchNumber: "X1", mfgDate: past, expiryDate: past, currentStock: 5, purchasePrice: 20 });
    await Batch.create({ medicineId: med._id, batchNumber: "X2", mfgDate: new Date("2026-01-01T00:00:00Z"), expiryDate: soon, currentStock: 10, purchasePrice: 15 });

    const admin = await createUser("rexpiry");
    const res = await request("/reports/expiry?days=90", { token: admin.token });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.summary.expiredCount, 1);
    assert.equal(data.summary.expiredValue, 100);
    assert.equal(data.summary.expiringCount, 1);
    assert.equal(data.days, 90);

    const clamped = await request("/reports/expiry?days=oops", { token: admin.token });
    assert.equal(clamped.status, 200);
    assert.equal((await clamped.json()).data.days, 90);
  });

  test("stock valuation sums only in-stock inventory", async () => {
    const med = await Medicine.create({ name: "Cough Syrup", hsnCode: "300490" });
    await Batch.create({ medicineId: med._id, batchNumber: "S1", mfgDate: new Date("2026-01-01T00:00:00Z"), expiryDate: new Date("2027-01-01T00:00:00Z"), currentStock: 5, purchasePrice: 20 });
    await Batch.create({ medicineId: med._id, batchNumber: "S2", mfgDate: new Date("2026-01-01T00:00:00Z"), expiryDate: new Date("2027-01-01T00:00:00Z"), currentStock: 0, purchasePrice: 40 });

    const admin = await createUser("rstock");
    const res = await request("/reports/stock-valuation", { token: admin.token });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.summary.totalUnits, 5);
    assert.equal(data.summary.totalValue, 100);
    assert.equal(data.batches.length, 1);
  });
});

describe("custom report engine", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("groups by a single field and aggregates measures", async () => {
    const admin = await createUser("rcustom1");
    await seedSales(admin.id);
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: salesConfig(),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 4);
    assert.deepEqual(data.groupBy, ["paymentMode"]);
    assert.equal(data.rows.length, 3);

    const upi = data.rows.find((r) => r.paymentMode === "UPI");
    assert.ok(upi);
    assert.equal(upi.netSales, 280);
    assert.equal(upi.quantity ?? 0, 0); // quantity not requested

    const cash = data.rows.find((r) => r.paymentMode === "Cash");
    assert.equal(cash.netSales, 56);
    assert.equal(data.totals.netSales, 392);
  });

  test("groups by multiple fields and returns every column", async () => {
    const admin = await createUser("rcustom2");
    await seedSales(admin.id);
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: salesConfig({
        groupBy: ["paymentMode", "customer"],
        summarizeBy: [{ field: "netSales", aggregation: "SUM" }, { field: "quantity", aggregation: "SUM" }],
      }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.deepEqual(data.groupBy, ["paymentMode", "customer"]);
    const row = data.rows.find((r) => r.paymentMode === "UPI" && r.customer === "Walk-in Customer");
    assert.ok(row, "row must carry BOTH group columns");
    assert.equal(row.netSales, 280);
    assert.equal(row.quantity, 5);
  });

  test("applies an equals filter", async () => {
    const admin = await createUser("rcustom3");
    await seedSales(admin.id);
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: salesConfig({ filters: [{ field: "paymentMode", operator: "equals", value: "Cash" }] }),
    });
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 1);
    assert.equal(data.rows[0].netSales, 56);
  });

  test("applies a numeric between filter on a numeric field (gstSlab)", async () => {
    const admin = await createUser("rcustom4");
    await seedSales(admin.id);
    const hit = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: {
        module: "gst",
        selectedFields: ["gstSlab"],
        groupBy: ["gstSlab"],
        summarizeBy: [{ field: "gstAmount", aggregation: "SUM" }],
        filters: [{ field: "gstSlab", operator: "between", value: "10,15" }],
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
      },
    });
    assert.equal(hit.status, 200);
    assert.equal((await hit.json()).data.totalRecords, 4);

    const miss = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: {
        module: "gst",
        selectedFields: ["gstSlab"],
        groupBy: ["gstSlab"],
        summarizeBy: [{ field: "gstAmount", aggregation: "SUM" }],
        filters: [{ field: "gstSlab", operator: "between", value: "1,5" }],
      },
    });
    assert.equal(miss.status, 200);
    assert.equal((await miss.json()).data.totalRecords, 0);
  });

  test("applies a date between filter on a date field (billDate)", async () => {
    const admin = await createUser("rcustom5");
    await seedSales(admin.id);
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: salesConfig({ filters: [{ field: "billDate", operator: "between", value: "2026-08-10,2026-08-11" }] }),
    });
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 3);
    assert.equal(data.totals.netSales, 336);
  });

  test("applies an in filter on a text field", async () => {
    const admin = await createUser("rcustom6");
    await seedSales(admin.id);
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: salesConfig({ filters: [{ field: "paymentMode", operator: "in", value: "Cash, UPI" }] }),
    });
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 3);
  });

  test("applies a contains filter on a text field", async () => {
    const admin = await createUser("rcustom7");
    await seedSales(admin.id);
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: salesConfig({ filters: [{ field: "medicine", operator: "contains", value: "paracetamol" }] }),
    });
    assert.equal((await res.json()).data.totalRecords, 4);
  });

  test("matches a specific day with an equals filter on a date field", async () => {
    const admin = await createUser("rcustom8");
    await seedSales(admin.id);
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: salesConfig({ filters: [{ field: "billDate", operator: "equals", value: "2026-08-10" }] }),
    });
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 2);
    assert.equal(data.totals.netSales, 168);
  });

  test("date window is enforced at the DB level and includes the to-day", async () => {
    const admin = await createUser("rcustom9");
    await seedSales(admin.id);
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: salesConfig({ dateFrom: "2026-08-10", dateTo: "2026-08-10" }),
    });
    const data = (await res.json()).data;
    assert.equal(data.totalRecords, 2, "both noon sales on Aug 10 must be included");
  });

  test("rejects invalid module, field, operator, measure and dates", async () => {
    const admin = await createUser("rcustom10");
    await seedSales(admin.id);
    const check = async (body, status) => {
      const res = await request("/reports/custom", { method: "POST", token: admin.token, body });
      assert.equal(res.status, status);
    };
    await check(salesConfig({ module: "nope" }), 400);
    await check(salesConfig({ groupBy: ["nonexistent"] }), 400);
    await check(salesConfig({ summarizeBy: [{ field: "nope", aggregation: "SUM" }] }), 400);
    await check(salesConfig({ filters: [{ field: "paymentMode", operator: "like", value: "x" }] }), 400);
    await check(salesConfig({ dateFrom: "not-a-date" }), 400);
    await check(salesConfig({ dateFrom: "2026-08-31", dateTo: "2026-08-01" }), 400);
  });

  test("returns a valid empty result when nothing matches", async () => {
    const admin = await createUser("rcustom11");
    await seedSales(admin.id);
    const res = await request("/reports/custom", {
      method: "POST",
      token: admin.token,
      body: salesConfig({ filters: [{ field: "paymentMode", operator: "equals", value: "Cheque" }] }),
    });
    assert.equal(res.status, 200);
    const data = (await res.json()).data;
    assert.deepEqual(data.rows, []);
    assert.equal(data.totalRecords, 0);
    assert.ok(data.message);
  });
});

describe("saved reports", { skip: !connected && "MongoDB not available - skipped" }, () => {
  test("create, list, update and delete lifecycle", async () => {
    const admin = await createUser("rsaved1");
    const cfg = { name: "Monthly UPI Sales", module: "sales", groupBy: ["paymentMode"], summarizeBy: [{ field: "netSales", aggregation: "SUM" }], filters: [], dateConfig: { presetId: "month" } };

    const created = await request("/reports/saved", { method: "POST", token: admin.token, body: cfg });
    assert.equal(created.status, 201);
    const saved = (await created.json()).data;
    assert.ok(saved.id);
    assert.equal(saved.groupBy.length, 1);

    const list = await request("/reports/saved", { token: admin.token });
    const listBody = (await list.json()).data;
    assert.equal(listBody.length, 1);
    assert.equal(listBody[0].id, saved.id);
    assert.ok(Array.isArray(listBody[0].filters));

    const updated = await request(`/reports/saved/${saved.id}`, {
      method: "PUT",
      token: admin.token,
      body: { name: "Renamed" },
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).data.name, "Renamed");

    const del = await request(`/reports/saved/${saved.id}`, { method: "DELETE", token: admin.token });
    assert.equal(del.status, 200);
    assert.equal((await (await request("/reports/saved", { token: admin.token })).json()).data.length, 0);
  });

  test("re-saving with an existing id updates instead of duplicating", async () => {
    const admin = await createUser("rsaved2");
    const cfg = { name: "Re-saved", module: "sales", groupBy: ["paymentMode"], summarizeBy: [{ field: "netSales", aggregation: "SUM" }] };
    const first = (await (await request("/reports/saved", { method: "POST", token: admin.token, body: cfg })).json()).data;

    const second = await request("/reports/saved", {
      method: "POST",
      token: admin.token,
      body: { ...cfg, id: first.id, name: "Re-saved v2" },
    });
    assert.equal(second.status, 201);
    assert.equal((await second.json()).data.id, first.id);

    assert.equal(await SavedReport.countDocuments({ createdBy: admin.id }), 1, "must not duplicate");
    const stored = await SavedReport.findById(first.id).lean();
    assert.equal(stored.name, "Re-saved v2");
  });

  test("saved reports are scoped to the owning user", async () => {
    const adminA = await createUser("rsavedA");
    const adminB = await createUser("rsavedB");
    const created = (await (
      await request("/reports/saved", { method: "POST", token: adminA.token, body: { name: "Mine", module: "sales" } })
    ).json()).data;

    assert.equal((await (await request("/reports/saved", { token: adminB.token })).json()).data.length, 0);
    const put = await request(`/reports/saved/${created.id}`, { method: "PUT", token: adminB.token, body: { name: "Hijack" } });
    assert.equal(put.status, 404);
    const del = await request(`/reports/saved/${created.id}`, { method: "DELETE", token: adminB.token });
    assert.equal(del.status, 404);
    const still = await request("/reports/saved", { token: adminA.token });
    assert.equal((await still.json()).data.length, 1);
  });
});

describe("scheduled reports", { skip: !connected && "MongoDB not available - skipped" }, () => {
  const validSchedule = {
    reportName: "Daily Sales Digest",
    config: { module: "sales", fields: ["paymentMode"], measures: [{ field: "netSales", aggregation: "SUM" }] },
    recipients: ["owner@pharmahub.in"],
    frequency: "daily",
    time: "09:00",
    status: "active",
  };

  test("rejects invalid frequency, time, format, email and missing name", async () => {
    const admin = await createUser("rsched1");
    const cases = [
      { ...validSchedule, frequency: "hourly" },
      { ...validSchedule, time: "25:99" },
      { ...validSchedule, format: "pdf" },
      { ...validSchedule, recipients: ["bad@pharmahub.demo"] },
      { ...validSchedule, reportName: "  " },
      { ...validSchedule, recipients: "not-an-array" },
    ];
    for (const body of cases) {
      const res = await request("/reports/schedules", { method: "POST", token: admin.token, body });
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body)}`);
    }
  });

  test("create computes nextRunAt and updates recompute it on frequency/status changes", async () => {
    const admin = await createUser("rsched2");
    const created = (await (
      await request("/reports/schedules", { method: "POST", token: admin.token, body: validSchedule })
    ).json()).data;
    assert.ok(created.id);
    assert.ok(created.nextRunAt, "nextRunAt must be set on create");
    const first = new Date(created.nextRunAt).getTime();

    const weekly = await request(`/reports/schedules/${created.id}`, {
      method: "PUT",
      token: admin.token,
      body: { frequency: "weekly" },
    });
    const weeklyData = (await weekly.json()).data;
    assert.notEqual(new Date(weeklyData.nextRunAt).getTime(), first, "frequency change must recompute nextRunAt");
    assert.ok(new Date(weeklyData.nextRunAt).getTime() > Date.now());

    const paused = await request(`/reports/schedules/${created.id}`, {
      method: "PUT",
      token: admin.token,
      body: { status: "paused" },
    });
    assert.equal((await paused.json()).data.nextRunAt, null);

    const resumed = await request(`/reports/schedules/${created.id}`, {
      method: "PUT",
      token: admin.token,
      body: { status: "active" },
    });
    assert.ok((await resumed.json()).data.nextRunAt, "reactivating must schedule the next run");
  });

  test("schedules are scoped to the owning user", async () => {
    const adminA = await createUser("rschedA");
    const adminB = await createUser("rschedB");
    const created = (await (
      await request("/reports/schedules", { method: "POST", token: adminA.token, body: validSchedule })
    ).json()).data;

    assert.equal((await (await request("/reports/schedules", { token: adminB.token })).json()).data.length, 0);
    const put = await request(`/reports/schedules/${created.id}`, { method: "PUT", token: adminB.token, body: { time: "10:00" } });
    assert.equal(put.status, 404);
    const del = await request(`/reports/schedules/${created.id}`, { method: "DELETE", token: adminB.token });
    assert.equal(del.status, 404);
  });

  test("isValidEmail rejects reserved demo/test TLDs and malformed addresses", () => {
    assert.equal(isValidEmail("owner@pharmahub.in"), true);
    assert.equal(isValidEmail("owner@pharmahub.demo"), false);
    assert.equal(isValidEmail("x@domain.test"), false);
    assert.equal(isValidEmail("x@domain.example"), false);
    assert.equal(isValidEmail("x@domain.invalid"), false);
    assert.equal(isValidEmail("x@domain.local"), false);
    assert.equal(isValidEmail("x@localhost"), false);
    assert.equal(isValidEmail("not-an-email"), false);
    assert.equal(isValidEmail(""), false);
  });

  test("computeNextRunAt schedules the next daily occurrence", () => {
    const now = new Date("2026-08-15T10:00:00Z");
    const next = computeNextRunAt({ frequency: "daily", time: "09:00" }, now);
    assert.ok(next.getTime() > now.getTime());
    const base = new Date(now);
    const today9 = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0, 0);
    const tomorrow9 = new Date(today9);
    tomorrow9.setDate(tomorrow9.getDate() + 1);
    assert.equal(next.getTime(), tomorrow9.getTime());
  });
});

describe("scheduled report worker", { skip: !connected && "MongoDB not available - skipped" }, () => {
  const NOW = new Date("2026-08-15T10:00:00Z");

  async function createDueSchedule(userId, over = {}) {
    return ScheduledReport.create({
      reportName: "Worker Digest",
      config: {
        module: "sales",
        fields: ["paymentMode"],
        measures: [{ field: "netSales", aggregation: "SUM" }],
        filters: [],
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
      },
      recipients: ["owner@pharmahub.in"],
      frequency: "daily",
      time: "09:00",
      status: "active",
      nextRunAt: new Date("2026-08-10T00:00:00Z"),
      createdBy: userId,
      ...over,
    });
  }

  test("processes a due schedule once, sending exactly one email with the CSV", async () => {
    const admin = await createUser("rworker1");
    await seedSales(admin.id);
    const schedule = await createDueSchedule(admin.id);
    const sent = [];
    const sendEmail = async (opts) => {
      sent.push(opts);
      return { skipped: false, messageId: "m1" };
    };

    await processScheduledReports(NOW, { sendEmail });

    assert.equal(sent.length, 1, "exactly one email must be sent");
    assert.deepEqual(sent[0].to, ["owner@pharmahub.in"]);
    assert.match(sent[0].subject, /^PharmaHub — Worker Digest$/);
    assert.equal(sent[0].attachments.length, 1);
    assert.match(sent[0].attachments[0].filename, /\.csv$/);
    assert.match(sent[0].attachments[0].content, /UPI/);

    const updated = await ScheduledReport.findById(schedule._id).lean();
    assert.ok(updated.nextRunAt > NOW, "nextRunAt must advance past the processed occurrence");
    assert.equal(updated.lastSentAt.getTime(), NOW.getTime());
    assert.equal(updated.lastError, null);
  });

  test("running again does not re-send or re-advance (idempotent under overlap)", async () => {
    const admin = await createUser("rworker2");
    await seedSales(admin.id);
    const schedule = await createDueSchedule(admin.id);
    let calls = 0;
    const sendEmail = async () => {
      calls += 1;
      return { skipped: false, messageId: "m" };
    };

    await processScheduledReports(NOW, { sendEmail });
    const afterFirst = await ScheduledReport.findById(schedule._id).lean();
    await processScheduledReports(NOW, { sendEmail });
    const afterSecond = await ScheduledReport.findById(schedule._id).lean();

    assert.equal(calls, 1, "second run must not email again");
    assert.equal(afterSecond.nextRunAt.getTime(), afterFirst.nextRunAt.getTime(), "nextRunAt must not advance twice");
  });

  test("an email failure advances nextRunAt but records lastError and never re-sends", async () => {
    const admin = await createUser("rworker3");
    await seedSales(admin.id);
    const schedule = await createDueSchedule(admin.id);
    const sendEmail = async () => {
      throw new Error("smtp down");
    };

    await processScheduledReports(NOW, { sendEmail });

    const afterFail = await ScheduledReport.findById(schedule._id).lean();
    assert.ok(afterFail.nextRunAt > NOW, "claim must still advance nextRunAt");
    assert.equal(afterFail.lastError, "smtp down");
    assert.equal(afterFail.lastSentAt, null);

    // Crash/restart simulation: the occurrence was consumed, so nothing re-sends.
    let calls = 0;
    await processScheduledReports(NOW, { sendEmail: async () => { calls += 1; return { skipped: false }; } });
    assert.equal(calls, 0, "a consumed occurrence must never be emailed again");
  });

  test("filters out non-deliverable recipient addresses before sending", async () => {
    const admin = await createUser("rworker4");
    await seedSales(admin.id);
    await createDueSchedule(admin.id, { recipients: ["good@pharmahub.in", "bad@pharmahub.demo", "nope@x.test"] });
    const sent = [];
    await processScheduledReports(NOW, { sendEmail: async (opts) => { sent.push(opts); return { skipped: false }; } });
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].to, ["good@pharmahub.in"]);
  });

  test("handles a legacy schedule whose nextRunAt is null", async () => {
    const admin = await createUser("rworker5");
    await seedSales(admin.id);
    const schedule = await createDueSchedule(admin.id, { nextRunAt: null });
    let calls = 0;
    await processScheduledReports(NOW, { sendEmail: async () => { calls += 1; return { skipped: false }; } });
    assert.equal(calls, 1, "a null-nextRunAt schedule must run once");
    const updated = await ScheduledReport.findById(schedule._id).lean();
    assert.ok(updated.nextRunAt > NOW);
  });

  test("paused schedules are never processed", async () => {
    const admin = await createUser("rworker6");
    await seedSales(admin.id);
    await createDueSchedule(admin.id, { status: "paused", nextRunAt: new Date("2026-08-10T00:00:00Z") });
    let calls = 0;
    await processScheduledReports(NOW, { sendEmail: async () => { calls += 1; return { skipped: false }; } });
    assert.equal(calls, 0);
  });
});
