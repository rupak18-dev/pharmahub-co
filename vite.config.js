import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Serves the Vercel-style `api/` handlers from the Vite dev server so the app
// talks to MongoDB locally without deploying. Mirrors Vercel function routing.
const handlers = new Map();

function apiMiddleware() {
  return {
    name: "api-handlers",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // `/api/v1/*` is proxied to the pharmahub-server backend — skip here.
        if (!req.url || !req.url.startsWith("/api/")) return next();
        if (req.url.startsWith("/api/v1")) return next();
        try {
          const url = new URL(req.url, "http://localhost");
          const parts = url.pathname.split("/").filter(Boolean); // ["api","batches","<id>"]

          let load;
          if (parts[1] === "batches" && parts.length === 2) {
            load = () => import("./api/batches.js");
          } else if (parts[1] === "batches" && parts.length === 3) {
            req.query = {
              ...Object.fromEntries(url.searchParams),
              id: decodeURIComponent(parts[2]),
            };
            load = () => import("./api/batches/[id].js");
          } else if (parts[1] === "medicines" && parts.length === 2) {
            load = () => import("./api/medicines.js");
          } else if (parts[1] === "expiry" && parts.length === 2) {
            load = () => import("./api/expiry.js");
          } else if (parts[1] === "expiry" && parts.length === 3) {
            req.query = {
              ...Object.fromEntries(url.searchParams),
              id: decodeURIComponent(parts[2]),
            };
            load = () => import("./api/expiry/[id].js");
          } else {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: `No route for ${url.pathname}` }));
          }

          if (!req.query) req.query = Object.fromEntries(url.searchParams);
          if (req.method !== "GET" && req.method !== "HEAD") {
            req.body = await readBody(req);
          }

          // Express/Vercel-style helpers the handlers expect.
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (payload) => {
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify(payload));
          };
          res.send = (payload) => res.end(payload);

          const mod = handlers.get(url.pathname) ?? (await load());
          handlers.set(url.pathname, mod);

          const handler = mod.default ?? mod;
          await handler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.method === "GET" || req.method === "HEAD") return resolve(undefined);
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on("error", () => resolve(undefined));
  });
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  // The dev server must NOT pre-bundle @vercel/analytics: the package ships a
  // top-level `isProduction` in several entry files, and the optimizer merging
  // them into one module scope throws `Identifier 'isProduction' has already
  // been declared`. Excluding keeps them served as-is (they're valid ESM).
  optimizeDeps: {
    exclude: [
      "@vercel/analytics",
      "@vercel/analytics/react",
      "@vercel/speed-insights",
      "@vercel/speed-insights/react",
    ],
  },
  server: {
    port: 6000,
    // Non-strict: if 6000 is busy Vite picks 6001, then 6002, and so on.
    strictPort: false,
    host: true,
    proxy: {
      "/api/v1": {
        target: "https://pharmahub-server.onrender.com",
        changeOrigin: true,
        secure: true,
        configure(proxy) {
          // The browser thinks the request is same-origin (it goes through the
          // Vite proxy), so strip the Origin header — otherwise the backend's
          // production CSRF/CORS guard sees a localhost origin and rejects it.
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
          });
        },
      },
    },
  },
});
