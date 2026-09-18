import dns from "node:dns";
import { MongoClient } from "mongodb";

// Shared Mongo client used by the serverless API handlers (and scripts).
// On Vercel, env vars are injected; locally we fall back to .env.local.
function loadEnv() {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(".env.local");
    }
  } catch {
    // .env.local missing or empty is fine.
  }
}

let cachedClient = null;

// Route hostname resolution through the OS resolver (libuv getaddrinfo) instead
// of Node's c-ares DNS. c-ares gets ECONNREFUSED on NAT64 networks (e.g. some
// VPNs/hotspots), which breaks both mongodb+srv:// SRV lookups and A records.
// Harmless on normal networks.
const lookup = (hostname, options, callback) => dns.lookup(hostname, options, callback);

export async function getClient() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (local dev) or the Vercel project env.",
    );
  }
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      lookup,
    });
  }
  if (!cachedClient.topology?.isConnected?.()) {
    await cachedClient.connect();
  }
  return cachedClient;
}

export async function getDb() {
  const client = await getClient();
  const dbName = process.env.MONGODB_DB || "pharmahub";
  return client.db(dbName);
}

// Maps a Mongo document to a plain JSON-safe object with a string id.
export function toClientDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id) };
}
