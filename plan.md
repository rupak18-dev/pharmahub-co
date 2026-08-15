# PharmaHub — Batches Connectivity Plan

**Date:** 2026-08-12
**Scope:** Make the frontend **Batches** feature (list, detail, add) fully backed by the `pharmahub-server` Express API (`/api/v1`), with real JWT login. Migrate the backend's flat Batch model to the nested "agreed schema" defined in `pharmahub-co/src/lib/batch-schema.js`.

---

# PharmaHub — Real Authentication Plan (end-to-end, no demo accounts)

**Date:** 2026-08-13
**Branch:** frontend `auth` (`pharmahub-co`) · backend `Auth` (`pharmahub-server`)
**Scope:** Replace the localStorage mock auth with real JWT auth against the existing Express backend. Signup takes **only email / password / confirm**; the user's **name, role and org are collected in onboarding** and synced via a new self-profile endpoint. No demo accounts anywhere (frontend UI, backend seed, dev-bypass).

**Backend already provides (no work):**
- `POST /api/v1/auth/register` · `POST /api/v1/auth/login` · `GET /api/v1/auth/me` · `POST /api/v1/auth/change-password` (bcrypt + JWT).
- Envelope `{ success, message, data, meta }`; JWT payload `{ sub: userId }`, expiry `7d`.

## Backend changes — `pharmahub-server` (Auth branch)

| File | Change |
|---|---|
| `scripts/seed.js` | Remove the demo `users` array, the user-creation loop, and the "Sign-in accounts" console block. No demo users are seeded. |
| `src/types/index.js` | `authSchemas.register`: make `name` optional (`z.string().trim().max(120).optional()`). Add `authSchemas.profile = z.object({ name?, role?, orgName? })`. |
| `src/services/auth.service.js` | `registerUser`: default `name` to the email local-part when absent; role stays `"Pharmacist"`. Add `updateProfile(userId, { name, role, orgName })` → update + return `toPublicUser`. |
| `src/controllers/auth.controller.js` | Add `updateProfile` handler (self-update, `ok(...)`, `recordAudit`). |
| `src/routes/auth.routes.js` | Add `PUT /auth/profile` (`auth`, `validate(authSchemas.profile)`). |
| `src/middlewares/auth.js` | Remove `devBypassEnabled` / `devFallbackUser` and both bypass branches — a valid Bearer JWT is always required (even in dev). |

Notes:
- Self role change via `PUT /auth/profile` is required so onboarding can assign the role. Acceptable while the app bootstraps; flag for hardening later.
- Backend tests create their own users dynamically — removing the seed demo users does **not** break them.

## Frontend changes — `pharmahub-co` (auth branch)

| File | Change |
|---|---|
| `.env.local` | Add `VITE_API_URL=http://localhost:5000/api/v1`. |
| `src/lib/auth.jsx` | Rewrite to real JWT via `apiRequest`: session `PharmaHub_session_v2 = { token, user }`; boot restores cached user then hydrates via `GET /auth/me` (invalid → clear); `signIn(email, password)` → `POST /auth/login`; `signUp({ email, password })` → `POST /auth/register` then auto-login; `signOut()` clears; `switchRole(role)` stays a frontend-only demo toggle; add `updateProfile({ name, role, orgName })` → `PUT /auth/profile`. Context keeps all existing keys so no consumers break. |
| `src/Pages/Auth/LoginPage.jsx` | Remove demo login handler, `db.reset()` fallback, `setValue`, `PharmaHub_session_v1` cleanup. |
| `src/Pages/Auth/components/Login/LoginForm.jsx` | Remove the demo accounts box, `onDemoClick` prop, and fake social buttons + divider. |
| `src/Pages/Auth/SignupPage.jsx` | Schema: email + password + confirm + terms. `onSubmit` → real `signUp({ email, password })` → auto-login → `navigate("/onboarding")`. Remove the fake verify-email step. |
| `src/Pages/Auth/components/Shared/SignupForm.jsx` | Only Email / Password / Confirm (+ Terms). Remove fake Google button + divider. |
| `src/Pages/Onboarding/OnboardingPage.jsx` + `steps/Completion.jsx` | On completion call `updateProfile({ name: firstName + " " + lastName, role: mapJobTitle(jobTitle), orgName: organizationName })` before navigating to `/dashboard`. Job title → system role map: exact matches Owner/Pharmacist/Cashier/Inventory Manager, admin-ish titles → Admin, everything else → Pharmacist. |
| `src/Components/shared/AppRoot.jsx` | Reset handler also clears `PharmaHub_session_v2`. |

## Verification
1. Backend: `npm run lint`, `npm test`, restart `npm run dev`.
2. Frontend: `npm run lint`, `npm run build`.
3. Manual: signup (email/password/confirm) → auto-login → onboarding (name/role/org) → dashboard shows updated profile → sign out → sign in works; wrong password and duplicate-email show real backend errors.

## Decisions / notes
- **Terms checkbox is retained** on signup (legal consent) — signup still only *collects* email/password/confirm.
- **Forgot-password stays simulated** (`requestPasswordReset` mock) — no backend endpoint yet; out of scope.
- First registered user self-selects `Owner` in onboarding; subsequent signups default to `Pharmacist` until they complete onboarding.
- Only auth moves to the backend in this task; medicines/inventory/sales/etc. stay in the localStorage db (Batches already talks to the API).

---

# Legacy: Batches plan (see below)

**Current state (verified by research)**
- Frontend batches read/write MongoDB **directly** via Vercel-style `api/` handlers (`api/batches.js`, `api/batches/[id].js`, `api/medicines.js`) using the **nested** schema. Auth is localStorage-only demo profiles (`src/lib/auth.jsx`). Frontend `apiRequest` expects `{ data }` / `{ error }` envelopes.
- Backend has full batch CRUD with JWT + RBAC (`src/routes/batch.routes.js`, `src/controllers/batch.controller.js`) but a **flat** schema (`mfgDate`, `expiryDate`, `mrp`, `purchasePrice`, `sellingPrice`, `currentStock`, lowercase `status`, `locationType`, `rackCode`), a `{ success, message, data, meta }` envelope, and `listBatches` **populates** `medicineId`.
- Target contract (frontend `batchDocSchema`): nested `dates / pricing / status / stock / warehouse` + `batchType`, `audit`, `version`, `movements`; uppercase `status.state` enum.

---

## Phase 1 — Backend: migrate Batch model to nested

### 1.1 `src/models/Batch.js` — rewrite schema
Replace the flat fields with nested subdocuments:

```js
{
  medicineId: ObjectId ref "Medicine" (required, index),
  supplierId: ObjectId ref "Supplier" (nullable, index),
  batchNumber: String (required, trim, max 40),
  batchType: enum ["C","L","V"] default "C",
  dates: {
    manufacturingDate: Date (required),
    expiryDate: Date (required, index),
    quarantineUntil: Date | null,
  },
  pricing: { purchasePrice: Number>=0, mrp: Number>=0, sellingPrice: Number>=0, gstRate: Number>=0 },
  status: {
    isRecalled: Boolean default false,
    state: enum ["ACTIVE","QUARANTINED","RECALLED","BLOCKED","RETIRED"] default "ACTIVE",
    quarantineReason: String | null,
  },
  stock: { uom: String default "Units", quantityOnHand: Number>=0, reservedQuantity: Number>=0, quarantined: Number>=0 },
  warehouse: { locationType: enum(constants.locationTypes), rackCode: String default "" },
  audit: { createdAt: Date, updatedAt: Date, updatedBy: String },
  version: Number default 1,
  movements: [{ id, type, note, qty, timestamp, from, to, by }],
}
```

- `movements` subdoc merges the frontend contract (`id`, `type`, `note`, `qty`, `timestamp`) with backend audit extras (`from`, `to`, `by`).
- **Drop** `mfgDate`, `expiryDate`, `mrp`, `purchasePrice`, `sellingPrice`, `currentStock`, flat `status`, `locationType`, `rackCode`.
- **Drop** the `pre("save")` derived-status hook — status is now manual; `near_expiry`/`expired` are derived client-side.
- Keep unique index `{ medicineId: 1, batchNumber: 1 }`.

### 1.2 `src/types/index.js` — nested request validation
Replace `batchSchemas.create / update / patch` to mirror the frontend `batchDocSchema` / `batchPatchSchema`:
- `create`: `medicineId` (ObjectId), `supplierId` (nullable), `batchNumber`, `batchType` (enum default "C"), `dates` (ISO strings; `quarantineUntil` nullable), `pricing` (numbers), `status` (enum + `isRecalled` + nullable `quarantineReason`), `stock` (`uom`, `quantityOnHand`, `reservedQuantity`, `quarantined`), `warehouse` (enum + `rackCode`). Allow the frontend's extra `version`/`audit` (zod strips unknown keys; model defaults fill them).
- `update` / `patch`: union of `action` (keep `batchActions`) **or** nested field updates.
- Ensure the frontend's existing POST/PATCH bodies validate without changes.

### 1.3 `src/controllers/batch.controller.js` — nested CRUD + serialization
- Add serializer (helper in this file or new `src/utils/serialize.js`):
  ```js
  serializeBatch(doc) => { id: String(doc._id), ...doc }   // ObjectIds/Dates already JSON-safe via res.json
  ```
- `listBatches`:
  - Support frontend query params: `medicineId`, `state` → `filter["status.state"]`, `search` → `batchNumber: { $regex, $options:"i" }`.
  - **Do NOT populate `medicineId`** (frontend relies on `m.id === b.medicineId`).
  - Sort by `dates.expiryDate`. Return `ok(res, items.map(serializeBatch), ...)`.
- `getBatch`: nested read + attach `locations` from `InventoryItem.find({ batchId })`, serialize.
- `createBatch`: build nested doc, set `audit.createdAt/updatedAt`, push `created` movement, `recordAudit`.
- `updateBatch`: port the action semantics from the frontend reference `api/batches/[id].js`:
  - `quarantine`: `status.state="QUARANTINED"`, `quarantineReason`, `dates.quarantineUntil` (+14d), `stock.quarantined += stock.quantityOnHand`, `stock.quantityOnHand = 0`.
  - `activate`: `state="ACTIVE"`, `isRecalled=false`, clear reason/until, `stock.quantityOnHand = stock.quarantined`, `stock.quarantined = 0`.
  - `recall`: `state="RECALLED"`, `isRecalled=true`, reason.
  - `block`: `state="BLOCKED"`, reason.
  - `retire`: `state="RETIRED"`, zero `stock.quantityOnHand`/`quarantined`.
  - Field updates: apply nested `dates / pricing / status / stock / warehouse` + `medicineId` / `supplierId` / `batchNumber` / `batchType`, logging a movement on stock/warehouse changes.
- `deleteBatch`: guard on `batch.stock.quantityOnHand > 0`.

### 1.4 Consumers of the flat shape (all must move to nested fields)

| File | Change |
|---|---|
| `src/services/batch.service.js` | `refreshBatchStatus` → no derived store (ACTIVE default only); `recordBatchMovement` → new movement shape (`{ id, type, note, qty, timestamp, from, to, by }`); `getNearExpiryBatches`/`getExpiredBatches` filter on `dates.expiryDate`; `getLowStockMedicines` uses `stock.quantityOnHand`; retire `autoRefreshExpiryStatuses` (no stored derived status) and its callers. |
| `src/services/inventory.service.js` | `batch.stock.quantityOnHand += quantity`; `$inc: { "stock.quantityOnHand": -quantity }`; `adjustStock` uses `batch.stock.quantityOnHand = Math.max(0, ...)`. |
| `src/services/purchase.service.js` | `receivePurchase` create/update batches nested: `pricing.purchasePrice`, `pricing.mrp`, `pricing.sellingPrice`, `dates.expiryDate`/`mfgDate`, `stock: { quantityOnHand: 0, uom, reservedQuantity: 0, quarantined: 0 }`, `warehouse: { locationType, rackCode }`, `status: { state: "ACTIVE" }`. |
| `src/services/sale.service.js` | Candidate query excludes manual states (`status.state ∉ [RECALLED, RETIRED, BLOCKED, QUARANTINED]`) **and** `dates.expiryDate > now`; `batch.sellingPrice` → `batch.pricing.sellingPrice`. |
| `src/services/stock.service.js` | `getStockSummary`/`pickBatchesFEFO` read `dates.expiryDate`, `pricing.mrp/sellingPrice`, `stock.quantityOnHand`; derive status per doc from expiry (reuse `classifyBatchStatus`). |
| `src/services/report.service.js` | `expiryReport`/`stockValuationReport` on `dates.expiryDate`, `stock.quantityOnHand`, `pricing.purchasePrice`; compute status buckets from expiry. |
| `src/services/dashboard.service.js` | All `currentStock`/`purchasePrice`/`expiryDate` reads → nested; notification bodies use `dates.expiryDate`. |

### 1.5 One-time data migration — `scripts/migrate-batches.js`
- Idempotent; skips docs that already have a `dates` field.
- Map old → new:
  - `mfgDate`/`expiryDate` → `dates.manufacturingDate`/`dates.expiryDate`
  - `mrp`/`purchasePrice`/`sellingPrice` → `pricing.*`; `gstRate` → `pricing.gstRate`
  - `currentStock` → `stock.quantityOnHand`; `reservedQuantity` → `stock.reservedQuantity`
  - `locationType`/`rackCode` → `warehouse.*`
  - old `status` string → `status.state` (active/near_expiry/expired → `ACTIVE`; quarantined/recalled/blocked/retired → same-state uppercase)
  - old `movements` (`{action, reason, from, to, by, at}`) → `{ id, type: action, note: reason, qty: 0, timestamp: at, from, to, by }`
- Add npm script `"migrate:batches": "node scripts/migrate-batches.js"`.

### 1.6 Docs + tests
- `docs/DATA_MODEL.md` and `docs/API.md`: update the Batch collection/endpoints to the nested contract; update batch query params (`medicineId`, `state`, `search`).
- `tests/api.test.js`: add nested batch flow — create batch (nested payload) → list (assert `id`, nested fields) → PATCH `quarantine` action → GET detail → delete.

---

## Phase 2 — Frontend: switch Batches to the backend API

### 2.1 `src/lib/api.js` — base URL, auth header, envelope
- Base URL: `import.meta.env.VITE_API_URL` (default `http://localhost:5000/api/v1`).
- Attach `Authorization: Bearer <token>` from the auth session (see 2.2).
- Normalize response: `success: true` → return `json.data` (accept `null`/undefined for 204); error `{ success:false, error:{message} }` → `throw new Error(message)`; keep tolerance for the old `{ data }` handler shape.

### 2.2 `src/lib/auth.jsx` — real JWT login
- `signIn(email, password)` → `POST {base}/auth/login`; persist `{ token, user }` as `PharmaHub_session_v2`; expose `getAuthToken()`.
- `signOut()` clears the session.
- `src/Pages/Auth/LoginPage.jsx`: update demo login to backend seed creds (`owner@pharmahub.demo` / `password123`); remove the `db.reset()` fallback. `onSubmit` already passes `(email, password)` — no change needed there.

### 2.3 `src/Pages/Batches/BatchesPage.jsx`
- Use shared `apiRequest` from `@/lib/api` (remove local duplicate).
- Medicines mapper: `{ id: m.id ?? m._id, generic: m.genericName, brand: m.brandName, manufacturerName: m.manufacturerId?.name }`.
- Fetch `/suppliers` (GET, requires `purchases.view`) and pass to `AddBatchSheet` so `supplierId` is a real ObjectId.
- Keep the existing nested POST payload — it now validates against the backend.

### 2.4 `src/Pages/Batches/BatchDetailPage.jsx`
- Use shared `apiRequest` (remove local duplicate). Everything else already reads nested fields (`dates.*`, `pricing.*`, `stock.*`, `warehouse.*`, `status.state`).

### 2.5 `src/Components/shared/AddBatchSheet.jsx`
- Accept a `suppliers` prop (backend list) and use it in the dropdown.
- "New supplier" → `POST {base}/suppliers` (requires `purchases.create`) instead of `db.set`.
- Rack options logic unchanged.

### 2.6 `vite.config.js` (optional)
- Add `server.proxy` `/api/v1` → `http://localhost:5000` for relative-URL parity. Works either way since backend `CORS_ORIGIN=*`.

### 2.7 Deprecate direct-Mongo handlers
- Leave `api/batches.js`, `api/batches/[id].js`, `api/medicines.js`, `api/_lib/mongo.js` in place but unused by the UI. Add a short deprecation comment; deletion is optional cleanup.

---

## Phase 3 — Verification

1. Backend: `npm run seed -- --force` → `npm run migrate:batches` → `npm test` → `npm run lint`.
2. Start backend (`npm run dev`, :5000) and frontend (`npm run dev`, :5100).
3. Manual flow: login as `owner@pharmahub.demo` / `password123` → Batches loads from backend → Add batch (incl. new supplier + quarantine location) → detail page shows dates/pricing/stock → statuses render correctly.
4. Frontend: run its lint/build scripts (verify exact names from `pharmahub-co/package.json` during execution).

---

## Decisions / notes
- **Derived statuses** (`near_expiry`, `expired`) are computed, not stored — matches frontend `computeBatchStatus`. Server-side filters switch to `dates.expiryDate`.
- **`medicineId` is NOT populated** in the batch list so `m.id === b.medicineId` still works; every batch response gets an `id` alias.
- Frontend sales/inventory/purchases pages still use the localStorage db — **out of scope**; only Batches + auth switch over in this task.
- Confirm during execution: exact frontend lint/build script names; callers of `autoRefreshExpiryStatuses` for clean retirement.
