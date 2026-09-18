import { test } from "node:test";
import assert from "node:assert/strict";

import { detectDocumentType, parseBillDocument } from "../src/services/billExtraction.service.js";

// Real OCR output captured from uploads/bills/f6f1e47f-cbf8-40d6-b31d-d537cb90835e.png
// (SRI SAI VENKATA DURGA ENTERPRISES GST invoice SRJ001107, dated 10-08-2026).
const REAL_OCR = `SRI SAI VENKATA DURGA ENTERPRISES GST INVOICE Party Name :

D.NO:9-68-23, COTTON FACTORY STREET, CR NG ESHWAR MEDICALS

KOTHAPETA, VIJAYAWADA - 520001. HPR ID: HFR ID:

CASH DATE: 10-08-2026 | GROUND FLOOR 59-8-13 PINNAMANENI PO
Phone : 9292000166, 9010252225 Invoice No SRJ001107 ROAD PVRAO ROAD NEAR ALANKAR BACKERY VIJAYAWA
PHONE. :

D.L NO:WLF20B2026AP000520/WLF21B2026AP000509 : 08. Transport D.L NO:23426**23427/AP/06/03/2021 37-ANDHRA PRADESH

GSTIN : 37ACJFS5535M1ZH Invoice Date 10-08-2026 GSTIN : 37BDQPT9401E1Z5 PAN/AADHAR :BDQPT9401E

Sn HSN Product Name PACK Batch Exp| Qty. Freel MFG. RATE M.R.P| Dis| SGS Value CGST Value

1 30043110 | HUMINSULIN30/70CAR 5 B042527525 11/28 2 - | ELILI 2063.6 |2579.5 | 4.0 2.5 99.05 2.5 99.05 4127.20

Our ONLINE ORDER Code 85263 | Download Order/Pgyment App me9.in/b2b
CLASS TOTAL DISCOUNT GROSS AMT SGST|  cGsT] ToTALGsT[ = | TOTAL ’ 0

GST 5.00% 4127.20 165.09 3962.11 99.05 99.05 198.10 | Total ltems:- 1 DIS AMT. 165.09
GST 12.00% 0.00 0.00 0.00 0.00 0.00 0.00 Total Qty :- 2 GROSS AMT 3962.11
GST 18.00% 0.00 0.00 0.00 0.00 0.00 0.00 SGST PAYBLE 99.05
GST 0.00 % 0.00 0.00 0.00 0.00 0.00 0.00 CGST PAYBLE 99.05
TOTAL 4127.20 165.09 3962.11 99.05 99.05 198.10 CR/DR NOTE 0.00
Rs. Four Thousand One Hundred and Sixty only CHARGES 0.00
IRN NO: _ Grand Total

Terms & Conditions FOR SRI SAI VENKATA DURGA ENTERPRISES

Goods once sold will not be taken back or exchanged.

All disputes subject to Jurisdication only.

Bills not paid due date will attract 24% interest.

Authorised Signatory

Print HEALTH QRCODE on BILL & Ear | MARG ERP NANO Rs 8550 | Click Photo & Import BilL| Call 9885111746,9885020804

4160.00`;

test("detectDocumentType classifies a supplier GST invoice as purchase_invoice", () => {
  assert.equal(detectDocumentType(REAL_OCR), "purchase_invoice");
  assert.equal(detectDocumentType("CASH MEMO\nitems"), "sales_invoice");
  assert.equal(detectDocumentType("Amount received with thanks"), "payment_receipt");
});

test("extracts the invoice header from real OCR text", () => {
  const { fields } = parseBillDocument(REAL_OCR);
  assert.equal(fields.invoiceNumber, "SRJ001107");
  assert.equal(fields.invoiceDate, "2026-08-10");
  assert.equal(fields.supplier.name, "SRI SAI VENKATA DURGA ENTERPRISES");
  assert.equal(fields.supplier.gstin, "37ACJFS5535M1ZH");
  assert.equal(fields.party.gstin, "37BDQPT9401E1Z5");
  assert.match(fields.supplier.phone, /9292000166/);
});

test("extracts and classifies phone numbers from real OCR text", () => {
  const { fields } = parseBillDocument(REAL_OCR);
  assert.deepEqual(fields.supplier.phones, ["+919292000166", "+919010252225"]);
  assert.equal(fields.customerPhone, "");
  assert.equal(fields.party.phone, "");
  assert.equal(fields.phoneCandidates.length, 4);

  const suppliers = fields.phoneCandidates.filter((c) => c.role === "supplier").map((c) => c.normalizedNumber);
  assert.deepEqual(suppliers, ["+919292000166", "+919010252225"]);

  const unknowns = fields.phoneCandidates.filter((c) => c.role === "unknown").map((c) => c.number);
  assert.deepEqual(unknowns, ["9885111746", "9885020804"]);

  assert.equal(fields.phoneCandidates.some((c) => c.role === "customer"), false);
});

test("parses the tabulated line item from real OCR text", () => {
  const { fields } = parseBillDocument(REAL_OCR);
  assert.equal(fields.items.length, 1);
  const it = fields.items[0];
  assert.equal(it.medicineName, "HUMINSULIN30/70CAR");
  assert.equal(it.hsnCode, "30043110");
  assert.equal(it.pack, "5");
  assert.equal(it.batchNumber, "B042527525");
  assert.equal(it.expiryDate, "11/28");
  assert.equal(it.quantity, 2);
  assert.equal(it.unitCost, 2063.6);
  assert.equal(it.mrp, 2579.5);
  assert.equal(it.discountPct, 4);
  assert.equal(it.sgstRate, 2.5);
  assert.equal(it.cgstRate, 2.5);
  assert.equal(it.sgstAmount, 99.05);
  assert.equal(it.cgstAmount, 99.05);
  assert.equal(it.manufacturer, "ELILI");
});

test("parses the printed totals from real OCR text", () => {
  const { fields } = parseBillDocument(REAL_OCR);
  assert.equal(fields.subtotal, 4127.2);
  assert.equal(fields.discount, 165.09);
  assert.equal(fields.taxableAmount, 3962.11);
  assert.equal(fields.totalSGST, 99.05);
  assert.equal(fields.totalCGST, 99.05);
  assert.equal(fields.gstTotal, 198.1);
  assert.equal(fields.printedGrandTotal, 4160);
});

test("never invents data when the document is unreadable", () => {
  const { fields, warnings } = parseBillDocument("");
  assert.equal(fields.items.length, 0);
  assert.ok(warnings.some((w) => /no line items/i.test(w)));
});

test("parses labeled items when OCR emits label:value pairs", () => {
  const text = `MED PLUS DISTRIBUTORS
  GST INVOICE Party: Local Pharma
  Product: DOLO 650
  HSN: 30049099
  Batch: B123456
  Expiry: 09/27
  Quantity: 10
  Rate: 25.5
  MRP: 32
  Discount: 10
  SGST: 2.5
  CGST: 2.5
  Total: 300.00`;
  const { fields } = parseBillDocument(text);
  assert.ok(fields.items.length >= 1);
  const it = fields.items[0];
  assert.equal(it.medicineName, "DOLO 650");
  assert.equal(it.batchNumber, "B123456");
  assert.equal(it.quantity, 10);
});
