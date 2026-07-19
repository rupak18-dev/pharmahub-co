
# PharmacyOS — Phase 1 Plan

Scope for this pass is **Phase 1 only**. Later phases (Sales/POS, Purchases, Expiry, Audit, Reports, Notifications, AI, Admin) will each get their own plan once Phase 1 is signed off, held to the same visual bar.

Stack matches the request: React + TypeScript (TanStack Start template already in place) + Tailwind + shadcn/ui + React Hook Form + Zod + Recharts. All data is in-memory/localStorage behind a service layer so a MongoDB backend can drop in later.

## 1. Design system foundation

- Set primary to medical teal `#0F766E` and status tokens (success/warn/danger/muted) in `src/styles.css` as semantic tokens.
- Inter for UI; JetBrains Mono for numeric table cells (batch #, qty, price).
- Shared building blocks: `PageHeader`, `DataTable` (search + sort + filter + pagination + empty state, stacks to cards on mobile), `StatusBadge`, `KpiCard`, `ConfirmDialog`, `FormShell`.
- Consistent spacing scale, card, and button treatments used across marketing pages and app.

## 2. Routes

Public (same design system as app):
- `/` — landing page (hero, feature highlights: batch tracking, expiry alerts, GST billing, RBAC; CTA to sign up / sign in; footer).
- `/login`, `/signup`, `/forgot-password` — centered card layouts, Zod validation, error/confirmation states.

Authenticated shell under `/dashboard`:
- `/dashboard` (overview)
- `/dashboard/medicines`, `/dashboard/medicines/categories`, `/dashboard/medicines/manufacturers`
- `/dashboard/batches`, `/dashboard/batches/$batchId` (history)
- `/dashboard/inventory` (stock in/out/adjustments, valuation, dead/fast/slow, reorder alerts)
- `/dashboard/users` (roles + permission matrix — visible to Owner/Admin only)

Sidebar shows all 13 modules grouped, but Phase 2–4 modules render a "Coming in Phase X" placeholder screen (still styled to spec) so nav is complete from day one. Sidebar collapses to a Sheet drawer on mobile.

## 3. Mock auth + RBAC

- `authStore` (Zustand or React context + localStorage): current user, role, login/logout/signup/forgot-password (all local, no network).
- Seeded roles: Owner, Admin, Pharmacist, Cashier, Store Keeper, Inventory Manager with the permission matrix from the brief.
- `usePermission(module, action)` hook drives sidebar visibility, route guards, and button disabling.
- Route guard component redirects unauthenticated users to `/login` and unauthorized users to `/dashboard` with a toast.

## 4. Data/service layer (swap point for MongoDB later)

- `src/services/*` exposes async CRUD functions per collection (medicines, batches, categories, manufacturers, suppliers, stock_movements, activity_logs, profiles, roles, notifications, settings).
- Backed by a single `db` object persisted to localStorage; seeded with realistic demo data on first load.
- TanStack Query wraps every service call so components already use `useQuery`/`useMutation` — swapping to `fetch('/api/...')` later is a one-file change per service.
- Every stock-changing action funnels through a single `applyStockMovement()` helper that writes to `stock_movements` and `activity_logs` atomically.

## 5. Phase 1 module features

**Dashboard**
- KPI cards: Today's Sales, Today's Purchases, Revenue, Profit, Stock Value (values from mock data; sales/purchase KPIs read 0 until Phase 2 but are wired).
- Alert widgets (clickable → filtered lists): Low Stock, Out of Stock, Near Expiry (<90d), Expired.
- Recent Activity feed (last 20 from `activity_logs`).
- AI Insights panel — static placeholder card.

**Medicine Management**
- Master table with search, filter (category, manufacturer, active), sort, pagination.
- Add/Edit drawer form: name, generic, brand, category, manufacturer, HSN, GST rate, storage, barcode (auto-gen + manual override), image upload (stored as data URL for now).
- Deactivate with confirm dialog.
- Simple CRUD screens for Categories and Manufacturers.

**Batch Management**
- Add Batch form tied to a medicine: batch #, mfg/expiry dates, MRP, purchase/selling price, supplier, qty received.
- Per-medicine batch list with computed status (Active / Near Expiry / Expired / Sold Out), color-coded.
- Batch detail page with lifecycle timeline from `stock_movements`.

**Inventory Management**
- Stock In / Stock Out / Adjustment forms (reason required on adjustments and outs).
- Barcode scan via `@zxing/browser` (camera) to look up medicine/batch.
- Inventory Valuation table (sum of `current_stock × purchase_price`).
- Dead Stock (configurable no-movement days), Fast/Slow Moving rankings (based on seeded/mocked movements).
- Auto Reorder alert list driven by per-medicine reorder threshold.

**User & Role Management**
- Users list (invite/deactivate — local only).
- Permission matrix UI: role × module × [View, Create, Update, Delete, Approve, Export] checkbox grid, Owner locked.

## 6. Responsiveness & quality bar

- Every list becomes stacked cards below `md`.
- POS-ready layouts deferred to Phase 2 but sidebar/topbar chrome already handles mobile.
- Every destructive action goes through `ConfirmDialog`.
- Every list has search, filter, sort, pagination, and a styled empty state.
- Landing, auth, and app screens share tokens/components so the product feels unified.

## Technical notes

- TanStack Router file-based routes under `src/routes/`; `_authenticated/` layout gates all `/dashboard/*` routes.
- Home `/` is rewritten from the placeholder to the real landing page.
- No backend, no Supabase, no edge functions in Phase 1 — all logic client-side behind the service layer.
- Barcode/QR generation via `bwip-js`; scanning via `@zxing/browser`.
- Charts via `recharts` (already fits Dashboard needs).
- After Phase 1 is approved and verified end-to-end, I'll return with a Phase 2 plan (Purchases, Sales/POS with FEFO/FIFO, Returns).
