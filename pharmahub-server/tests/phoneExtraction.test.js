import { test } from "node:test";
import assert from "node:assert/strict";

import {
  deriveCustomerPhone,
  deriveSupplierPhones,
  extractPhoneCandidates,
} from "../src/services/phoneExtraction.service.js";

function cands(lines, opts) {
  return extractPhoneCandidates(lines, opts);
}

test("recognises a customer number from a customer/mobile labelled line", () => {
  const lines = ["PHARMA MART GST INVOICE", "Customer: Rahul Kumar", "Mobile: 9876543210", "Date 10-08-2026"];
  const c = cands(lines, { documentType: "sales_invoice" });
  assert.equal(c.length, 1);
  assert.equal(c[0].normalizedNumber, "+919876543210");
  assert.equal(c[0].role, "customer");
  assert.equal(c[0].context, "Customer");
  assert.equal(deriveCustomerPhone(c), "+919876543210");
});

test("treats buyer, consignee, deliver-to and party labels as customer signals", () => {
  const cases = {
    Buyer: "Buyer",
    "Bill To": "Bill To",
    "Ship To": "Ship To",
    Consignee: "Consignee",
    "Deliver To": "Delivery To",
    Party: "Party",
  };
  for (const [label, context] of Object.entries(cases)) {
    const c = cands([`${label}: 9866012345`], { documentType: "sales_invoice" });
    assert.equal(deriveCustomerPhone(c), "+919866012345", `label ${label}`);
    assert.equal(c[0].context, context);
  }
});

test("normalises a leading-zero local dialling number", () => {
  const c = cands(["Buyer Phone 09876543210"], { documentType: "sales_invoice" });
  assert.equal(deriveCustomerPhone(c), "+919876543210");
  assert.equal(c[0].number, "09876543210");
});

test("keeps multiple customer candidates with distinct numbers", () => {
  const lines = ["Customer Name: Anil", "Phone: 9123456789", "Buyer Mobile: 9885012345"];
  const c = cands(lines, { documentType: "sales_invoice" });
  assert.equal(c.length, 2);
  assert.equal(deriveCustomerPhone(c), "+919123456789");
});

test("classifies purchase-invoice header phones as supplier, never customer", () => {
  const lines = [
    "GLOBAL DRUGS WHOLESALE GST INVOICE",
    "Distributor Phone : 9000123456",
    "Invoice No ABC123",
    "Party Name :",
    "KARNATAKA MEDICALS",
    "Product Name Batch Qty Rate MRP",
    "DOLO 650 B1 10 25.50 32",
  ];
  const c = cands(lines, { documentType: "purchase_invoice" });
  assert.equal(c.length, 1);
  assert.equal(c[0].role, "supplier");
  assert.deepEqual(deriveSupplierPhones(c), ["+919000123456"]);
  assert.equal(deriveCustomerPhone(c), "");
});

test("matches supplier number by supplier name even without a phone label", () => {
  const lines = [
    "GLOBAL DRUGS WHOLESALE GST INVOICE",
    "9023456781",
    "GSTIN 29AABCL1234F1Z5",
    "KARNATAKA MEDICALS",
    "Product Name Batch Qty Rate MRP",
  ];
  const c = cands(lines, { supplierName: "GLOBAL DRUGS WHOLESALE", partyName: "KARNATAKA MEDICALS", documentType: "purchase_invoice" });
  assert.equal(c.length, 1);
  assert.equal(c[0].role, "supplier");
  assert.equal(c[0].context, "supplier header");
  assert.equal(deriveCustomerPhone(c), "");
});

test("classifies a party-name-matched number as customer even on a purchase bill", () => {
  const lines = ["SUPPLIER BILL", "Party :", "VIJAYA PHARMA", "Phone: 9866012345", "Date 10-08-2026"];
  const c = cands(lines, { supplierName: "SOME DISTRIBUTOR", partyName: "VIJAYA PHARMA", documentType: "purchase_invoice" });
  assert.equal(c.length, 1);
  assert.equal(c[0].role, "customer");
  assert.equal(deriveCustomerPhone(c), "+919866012345");
});

test("marks support/helpline numbers as unknown so they are never used", () => {
  const c = cands(["Call 9885111746,9885020804", "MARG ERP NANO Rs 8550"], { documentType: "purchase_invoice" });
  assert.equal(c.length, 2);
  for (const item of c) assert.equal(item.role, "unknown");
  assert.equal(deriveCustomerPhone(c), "");
  assert.deepEqual(deriveSupplierPhones(c), []);
});

test("does not treat the pharmacy's own sales-header phone as the customer", () => {
  const lines = ["NEW PHARMA GST INVOICE", "Phone : 9292000166, 9010252225", "Customer: Rahul", "Mobile: 9876543210"];
  const c = cands(lines, { documentType: "sales_invoice" });
  assert.equal(c.length, 3);
  const roles = c.map((x) => `${x.number}:${x.role}`);
  assert.ok(roles.includes("9292000166:unknown"), roles.join(", "));
  assert.ok(roles.includes("9010252225:unknown"), roles.join(", "));
  assert.equal(deriveCustomerPhone(c), "+919876543210");
});

test("excludes non-mobile numbers: dates, GSTINs, invoice numbers, HSN, amounts, PINs", () => {
  const lines = [
    "GST INVOICE SRJ001107 DATED 10-08-2026",
    "GSTIN : 37ACJFS5535M1ZH",
    "HSN 30043110",
    "RATE 2579.5 M.R.P DIS 4.0",
    "TOTAL 4127.20",
    "VIJAYAWADA - 520001",
    "D.L NO:23426**23427/AP/06/03/2021",
  ];
  assert.deepEqual(cands(lines), []);
});

test("uses per-line OCR confidence and never fabricates a score", () => {
  const lines = [
    { text: "Customer: Rahul Kumar", confidence: 0 },
    { text: "Mobile: 9876543210", confidence: 86.42 },
  ];
  const c = cands(lines, { documentType: "sales_invoice" });
  assert.equal(c[0].confidence, 86);
  const plain = cands(["Mobile: 9876543210"], { documentType: "sales_invoice" });
  assert.equal(plain[0].confidence, null);
});

test("falls back to document confidence for plain-string lines", () => {
  const c = cands(["Mobile: 9876543210"], { documentType: "sales_invoice", docConfidence: 91 });
  assert.equal(c[0].confidence, 91);
});

test("handles strings and object lines interchangeably", () => {
  const a = cands(["Customer: A", "Mobile: 9876543210"], { documentType: "sales_invoice" });
  const b = cands([{ text: "Customer: A" }, { text: "Mobile: 9876543210" }], { documentType: "sales_invoice" });
  assert.deepEqual(a, b);
  assert.equal(a.length, 1);
});
