# Fix Production Crash + Standalone Server CI Errors

## Context
- Vercel prod crash: `ReferenceError: useRef is not defined` — AppLayout.jsx wraps every authenticated route
- GitHub Actions lint failures run against the STANDALONE repo `C:\Users\guntu\OneDrive\Desktop\PharmaHub\pharmahub-server` (Render-deployed API), which got a botched "merged with Test" commit
- User approved: fix Google OAuth fragment handoff, mount CSRF guard, commit & push both repos

## Phase A — Frontend hotfix (pharmahub-co)
1. `src/Components/shared/AppLayout.jsx` line 2: add `useRef` to react import
2. Verify: `npx vite build`, `npx eslint src`
3. Commit + push (branch Test)

## Phase B — Standalone server repairs (pharmahub-server repo)
1. `src/types/index.js`: delete OLD duplicate keys at lines ~146–155 (`forgotPassword`, token-based `resetPassword`, `demoLogin`); keep new code-based schemas (128–135) + profile schema
2. `src/services/auth.service.js`:
   - Delete entire demo block: `requestDemoLogin` (~101), `verifyDemoLogin` (~142), `DemoLoginToken` import (line 10)
   - Delete OLD token-based `resetPassword` (~239); KEEP code-based one (~276) used by controller
3. `src/controllers/auth.controller.js`:
   - Delete corrupted `updateMyProfile` handler (124–135, contains demoLoginVerify body); KEEP alias line 139 (= _updateMyProfile from user.controller)
   - Delete `demoLogin`/`demoLoginVerify` handlers + demo-login import
4. `src/routes/auth.routes.js`: remove `/demo-login` routes
5. Delete files: `src/services/demo-login.service.js`, `src/models/DemoLoginToken.js`, `src/services/devUser.service.js`; remove exports/imports (models/index.js line 21, server.js line 6+21)
   - NOTE: KEEP `email.service.js` — otp.service.js depends on it here
6. `src/server.js`: remove ensureDevelopmentUser; ADD `startScheduledReportWorker()` guarded by `!env.isTest` after listen; fix legacy MONGO_URL error string
7. `scripts/seed.js`: add `import { randomUUID } from "node:crypto"`, remove unused bcrypt import, restore missing `userCount` variable

## Phase C — Security parity (standalone)
1. Mount CSRF guard: compare `src/middlewares/csrf.js` vs co-repo app.js guard; mount requiring `X-PharmaHub-Client` header on POST/PATCH/PUT/DELETE (frontend api.js always sends it; exempt auth callback GETs)
2. Google OAuth: replace `googleResultRedirect` fragment handoff (#token=...) with httpOnly session cookie set + plain redirect to /auth/callback; frontend `GoogleCallbackPage.jsx` rewritten to hydrate user via GET /auth/me instead of parsing fragment

## Phase D — Verification
1. Standalone: `npm run lint` (0 errors), `npm test`, boot check + /api/v1/health
2. Frontend: build + eslint src
3. Commit & push BOTH repos (separate commits, branch Test / default branch)

## Risks
- CSRF mount could break non-browser clients → verify test suite passes (tests send required header per co-repo pattern)
- GoogleCallbackPage change must ship together with backend cookie change (deploy frontend after server)
