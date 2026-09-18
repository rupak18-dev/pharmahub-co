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
        if (!req.url || !req.url.startsWith("/api/")) return next();
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
  server: { port: 5100, strictPort: true, host: true },
});
