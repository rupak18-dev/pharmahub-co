import mongoose from "mongoose";

import { env } from "./env.js";

// Logs the connection target without ever printing credentials.
function describeTarget(uri) {
  try {
    const u = new URL(uri);
    return `${u.protocol}//${u.username ? `${u.username}@` : ""}${u.host}`;
  } catch {
    return "<unparseable connection string>";
  }
}

export async function connectDB() {
  if (!env.mongoUri) {
    throw new Error(
      "MongoDB is not configured. Set MONGO_URL (or MONGO_URI) in .env. There is no localhost fallback — the server will not start without an explicit connection string. Example: MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/pharmahub",
    );
  }

  mongoose.set("strictQuery", true);
  console.log(`[db] connecting to ${describeTarget(env.mongoUri)}`);
  mongoose.connection.on("connected", () => {
    console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);
  });
  mongoose.connection.on("error", (err) => {
    console.error(`[db] connection error: ${err.message}`);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[db] disconnected from MongoDB");
  });

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
