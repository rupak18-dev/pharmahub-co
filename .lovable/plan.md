# Phase 2–4: Complete remaining modules

The Phase 1 modules you already have (Medicines, Batches, Inventory, Users, Dashboard) will not be changed. This plan fleshes out every placeholder route in one pass, wired to the existing localStorage `db` and `applyStockMovement` helpers so nothing is mocked twice.

## 1. Sales / POS — `/dashboard/sales`

- Two-pane POS layout: left = medicine search + cart, right = live totals.
- Search by name/brand/barcode; adding a line auto-picks batch via **FEFO** (earliest expiry with stock > 0), shows batch #, expiry, MRP.
- Per-line: qty, price override (if permitted), discount %, GST auto from medicine.
- Cart totals: subtotal, discount, GST breakup, round-off, grand total.
- Checkout dialog: customer name/phone (optional), payment mode (Cash/Card/UPI), tender + change calc.
- On confirm: create `Sale` + `SaleItems`, call `applyStockMovement("out", …)` per line (updates batch stock, writes `stockMovements` + `activityLogs`), print-friendly receipt view.
- "Today's sales" list with drill-in; void sale (Admin/Owner) reverses stock.

New types: `Sale`, `SaleItem`, `PaymentMode`. New route: `sales.$saleId.tsx` for receipt.

## 2. Purchases / GRN — `/dashboard/purchases`

- Tabbed: **Purchase Orders** and **Goods Received (GRN)**.
- PO: supplier, expected date, line items (medicine + qty + expected price), status (draft/placed/received/cancelled).
- GRN form: pick PO (optional), supplier, invoice #, invoice date; per line enter batch #, mfg/expiry, MRP, purchase price, selling price, qty received.
- Submit creates `Batch` records and `applyStockMovement("in", …)` for each line; links to PO if any.
- List view with filters; drill-in shows all created batches from that GRN.

New types: `PurchaseOrder`, `POItem`, `GRN`, `GRNItem`.

## 3. Expiry — `/dashboard/expiry`

- Three tabs: **Near expiry** (within settings.nearExpiryDays), **Expired (with stock)**, **Disposed**.
- Columns: medicine, batch #, expiry, days remaining, current stock, value at cost.
- Bulk-select → **Dispose** action: sets batch status `disposed`, writes `applyStockMovement("adjustment", -currentStock, reason="Disposed – expired")`.
- Export CSV of the current tab.

## 4. Audit — `/dashboard/audit`

- Full `activityLogs` viewer with filters: user, entity type, action, date range, free-text search.
- Sticky-header dense table; click row → side panel with `details` JSON pretty-printed.
- Export CSV. Owner/Admin only (respect `audit.view`).

## 5. Reports — `/dashboard/reports`

Card grid of on-demand reports rendered inline (recharts already in the stack via shadcn charts, otherwise plain tables):

- Sales summary (day/week/month) – revenue, invoices, avg basket.
- Top 10 medicines by revenue and by units.
- Stock valuation by category / manufacturer.
- GST summary (output tax collected, by rate).
- Purchase summary by supplier.
- Slow/dead stock report.
- Each report: date-range picker + Export CSV.

## 6. Notifications — `/dashboard/notifications`

- Derived (not stored) alert feed computed from live db state:
  - Low stock (per reorder threshold), Out of stock, Near expiry, Expired-with-stock, Recently disposed, Recent voids.
- Grouped by severity; each item deep-links to the relevant module (batch, medicine, expiry tab).
- "Mark as read" stored in `db.notificationsRead: string[]` (id = hash of alert type + entity + day).

Adds one field to `DB` + `settings`-adjacent state.

## 7. AI Insights — `/dashboard/ai`

- Frontend-only heuristic insights (no external calls yet), clearly labelled "Heuristic preview – ML in a later phase":
  - Demand trend: 7-day vs prior-7-day movement per medicine → top gainers/losers.
  - Reorder suggestions: medicines projected to hit zero within N days at current burn rate.
  - Expiry risk: batches whose remaining days < projected days-to-sell.
  - Anomaly flag: sales > 3× rolling avg.
- Cards with sparkline (simple inline SVG) + "Apply" shortcut to create a draft PO for a suggestion.

## 8. Admin / Settings — `/dashboard/admin`

Tabbed settings page (Owner/Admin only):

- **Organization**: org name, currency, timezone, GST default, address (edits `db.settings` + owner profile).
- **Thresholds**: nearExpiryDays, deadStockDays, lowStockDefault.
- **Roles & permissions**: link to existing users matrix.
- **Data**: Export full DB as JSON, Import JSON (with confirm), Reset demo data, Clear activity logs.
- **About**: version, build info.

## 9. Shared additions

- `src/lib/types.ts`: add `Sale`, `SaleItem`, `PurchaseOrder`, `POItem`, `GRN`, `GRNItem`, `PaymentMode`; extend `DB` with `sales`, `purchaseOrders`, `grns`, `notificationsRead`.
- `src/lib/db.ts`: migration bump + defaults for new arrays.
- `src/lib/stock.ts`: add `pickBatchesFEFO(medicineId, qty)` helper used by POS and disposal.
- `src/lib/csv.ts`: tiny CSV exporter used by Audit, Expiry, Reports.
- `src/components/pharmacy/DataTable.tsx`: extract the sticky-header dense table pattern already used in Medicines/Batches so new pages reuse it.
- Sidebar (`AppSidebar.tsx`): unchanged links, but remove the "Phase X" placeholder badges once each page ships.
- Permission matrix: no schema change — modules `sales`, `purchases`, `expiry`, `audit`, `reports`, `notifications`, `ai`, `admin` already exist; every new action respects `usePermission()`.

## Out of scope (call out explicitly)

- Real backend / MongoDB wiring — still local `db` service, structured for a drop-in swap.
- Real ML models, email/SMS delivery, and payment-gateway integration — the UI and data shapes are in place, but external services land later.
- Barcode scanner hardware integration (input field accepts scans via keyboard wedge, which works today).

## Delivery order

1. Shared types/db migration + FEFO helper + CSV helper + DataTable extract.
2. Sales / POS (highest user value).
3. Purchases / GRN.
4. Expiry + Audit (share table/export patterns).
5. Reports.
6. Notifications + AI Insights.
7. Admin / Settings.

Each step ends with a typecheck; sidebar badges are cleared as pages ship.
