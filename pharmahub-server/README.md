# PharmaHub Server — README

Backend API for the PharmaHub pharmacy management system.

- **Stack:** Node.js + Express + JavaScript (ESM) + MongoDB (Mongoose)
- **Validation:** zod (mirrors the schemas used by the frontend)
- **Auth:** JWT (Bearer) + role-based access control
- **Base URL:** `/api/v1`

## Requirements

- Node.js >= 20
- MongoDB. Production uses **MongoDB Atlas**. There is **no localhost fallback**:
  the server refuses to start unless `MONGO_URL` is set to a reachable
  connection string (`MONGO_URI` is accepted as a legacy alias). The exact
  configured URI is used — it can never silently switch to a local database.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   edit .env and set a strong JWT_SECRET, plus your MONGO_URL Atlas string:
#   MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/pharmahub?retryWrites=true&w=majority

# 3. Seed data (optional — no user accounts are seeded by default)
npm run seed
#   user accounts are opt-in so a live database never accumulates demo data:
#   npm run seed -- --owner-email=owner@example.com   one real Owner account
#   (development only) the demo Owner login is auto-created on server start

# 4. Start in development mode (auto-reload)
npm run dev
```

The API will be available at `http://localhost:5050/api/v1`.

## Scripts

| Command          | Description                                  |
| ---------------- | -------------------------------------------- |
| `npm run dev`    | Start with nodemon (auto-restart)            |
| `npm start`      | Start in production mode                     |
| `npm run seed`   | Seed medicines/inventory (add `--force` to reset) |
| `npm test`       | Run tests against an isolated `pharmahub_test` database |
| `npm run lint`   | Lint with ESLint                             |

## Demo account (development only, auto-created on server start)

In `development` the server automatically ensures one demo Owner login so the
UI can be explored immediately. It is never created in `test`/`production`, and
no demo data is ever seeded into a live database.

| Email                     | Password       | Role   |
| ------------------------- | -------------- | ------ |
| `demo@pharmahub.local`    | `PharmaHub@123` | Owner  |

Use `npm run seed -- --owner-email=owner@example.com` to create a real Owner
account instead.

## Quick smoke test

```bash
curl http://localhost:5050/api/v1/health

curl -X POST http://localhost:5050/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@pharmahub.local","password":"PharmaHub@123"}'
```

Use the returned `token` in the `Authorization: Bearer <token>` header for all
other endpoints.

## Documentation

- [API.md](docs/API.md) — complete endpoint reference
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — folder structure and layering
- [DATA_MODEL.md](docs/DATA_MODEL.md) — MongoDB collections and relationships

## Folder structure

```
pharmahub-server/
├── src/
│   ├── config/         env, DB connection, constants
│   ├── core/           app bootstrap, server entry, logger, responses, ApiError
│   ├── models/         Mongoose schemas/models
│   ├── controllers/    HTTP request handlers
│   ├── routes/         Express routers (one per resource)
│   ├── services/       business logic (sales, purchases, inventory, reports)
│   ├── middlewares/    auth, authorize, validate, errorHandler, notFound
│   ├── types/          JSDoc typedefs + zod request validation schemas
│   └── utils/          id generation, dates, pagination
├── docs/
├── scripts/            seed.js
└── tests/              integration + health tests
```

## License

MIT
