import { test, before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { createApp } from "../src/app.js";
import { Role } from "../src/models/Role.js";
import { User } from "../src/models/User.js";
import { Integration } from "../src/models/Integration.js";

// Tests only ever run against the dedicated test database via MONGO_URI_TEST.
const uri = process.env.MONGO_URI_TEST;
let connected = false;
if (uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    connected = true;
  } catch (err) {
    console.log(`[test] MongoDB unavailable (${err?.message ?? err}); integrations tests skipped`);
  }
} else {
  console.log("[test] MONGO_URI_TEST not set — integrations tests skipped");
}

let server;
let base;

before(async () => {
  if (!connected) return;
  await Role.ensureSystemRoles();
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (connected && mongoose.connection.name === "pharmahub_test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

beforeEach(async () => {
  if (!connected) return;
  await Integration.deleteMany({});
});

async function request(path, { method = "GET", body, token } = {}) {
  return fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createUser(prefix, { role = "Admin", orgName = "PharmaHub" } = {}) {
  const email = `${prefix}-${Date.now()}@pharmahub.in`;
  const reg = await request("/auth/register", {
    method: "POST",
    body: { name: "Integration Tester", email, password: "password123" },
  });
  assert.equal(reg.status, 201);

  const patch = {};
  if (role !== "Pharmacist") patch.role = role;
  if (orgName) patch.orgName = orgName;
  if (Object.keys(patch).length > 0) {
    await User.updateOne({ email }, { $set: patch });
  }

  const login = await request("/auth/login", {
    method: "POST",
    body: { email, password: "password123" },
  });
  assert.equal(login.status, 200);
  const body = await login.json();
  return { token: body.data.token, email };
}

const WA_PHONE = "+919876543210";

async function connectWhatsApp(token, phone = WA_PHONE) {
  return request("/integrations/whatsapp/connect", {
    method: "POST",
    token,
    body: { config: { phone } },
  });
}

describe("integrations API", () => {
  test("requires authentication", async () => {
    const res = await request("/integrations");
    assert.equal(res.status, 401);
  });

  test("returns an empty list for a user with no integrations (no fabricated records)", async () => {
    const user = await createUser("empty");
    const res = await request("/integrations", { token: user.token });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.data, []);
  });

  test("connects WhatsApp Business, normalizes the phone and persists it", async () => {
    const user = await createUser("wa");

    const connect = await connectWhatsApp(user.token, "+91 98765 43210");
    assert.equal(connect.status, 200);
    const connected = await connect.json();
    assert.equal(connected.data.key, "whatsapp");
    assert.equal(connected.data.status, "connected");
    assert.equal(connected.data.connected, true);
    assert.deepEqual(connected.data.config, { phone: WA_PHONE });
    assert.equal(connected.data.destinationUrl, `https://wa.me/${WA_PHONE.replace("+", "")}`);

    const list = await request("/integrations", { token: user.token });
    assert.equal(list.status, 200);
    const listBody = await list.json();
    assert.equal(listBody.data.length, 1);
    assert.equal(listBody.data[0].key, "whatsapp");
    assert.equal(listBody.data[0].status, "connected");

    const byId = await request(`/integrations/${connected.data.id}`, { token: user.token });
    assert.equal(byId.status, 200);
    const byIdBody = await byId.json();
    assert.equal(byIdBody.data.id, connected.data.id);
  });

  test("rejects invalid WhatsApp phone numbers", async () => {
    const user = await createUser("bad");
    for (const phone of ["12345", "5555555555", "+92 98765 43210"]) {
      const res = await connectWhatsApp(user.token, phone);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.match(body.error.message, /valid Indian mobile/i);
    }
  });

  test("requires a phone number for WhatsApp", async () => {
    const user = await createUser("nophone");
    const res = await connectWhatsApp(user.token, "");
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error.message, /required/i);
  });

  test("never stores secrets and marks non-WhatsApp integrations as configured only", async () => {
    const user = await createUser("sec");
    const res = await request("/integrations/stripe/connect", {
      method: "POST",
      token: user.token,
      body: { config: { apiKey: "sk_live_SECRETVALUE123", publishableKey: "pk_live_public" } },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "configured");
    assert.equal(body.data.connected, false);
    assert.equal(body.data.config.apiKey, undefined);
    assert.equal(body.data.config.publishableKey, "pk_live_public");
  });

  test("configure updates the stored config", async () => {
    const user = await createUser("cfg");
    await connectWhatsApp(user.token);
    const res = await request("/integrations/whatsapp/configure", {
      method: "PUT",
      token: user.token,
      body: { config: { phone: "98765 43211" } },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.config.phone, "+919876543211");
  });

  test("disconnects (retains config) and reconnects", async () => {
    const user = await createUser("disc");
    const connect = await connectWhatsApp(user.token);
    const connected = await connect.json();

    const dis = await request(`/integrations/${connected.data.id}/disconnect`, { method: "POST", token: user.token });
    assert.equal(dis.status, 200);
    const disBody = await dis.json();
    assert.equal(disBody.data.connected, false);
    assert.equal(disBody.data.status, "configured");
    assert.equal(disBody.data.disconnectedAt, disBody.data.disconnectedAt);

    const re = await connectWhatsApp(user.token);
    assert.equal(re.status, 200);
    const reBody = await re.json();
    assert.equal(reBody.data.status, "connected");
    assert.equal(reBody.data.connected, true);
  });

  test("isolates integrations between different organizations", async () => {
    const userA = await createUser("orga", { role: "Admin", orgName: "OrgA" });
    const userB = await createUser("orgb", { role: "Admin", orgName: "OrgB" });
    await connectWhatsApp(userA.token);

    const listB = await request("/integrations", { token: userB.token });
    const bodyB = await listB.json();
    assert.deepEqual(bodyB.data, []);

    const listA = await request("/integrations", { token: userA.token });
    const bodyA = await listA.json();
    assert.equal(bodyA.data.length, 1);
  });

  test("shares integrations within the same organization", async () => {
    const userA = await createUser("share1", { role: "Admin", orgName: "SharedOrg" });
    const userB = await createUser("share2", { role: "Admin", orgName: "SharedOrg" });
    await connectWhatsApp(userA.token);

    const listB = await request("/integrations", { token: userB.token });
    const bodyB = await listB.json();
    assert.equal(bodyB.data.length, 1);
    assert.equal(bodyB.data[0].key, "whatsapp");
    assert.equal(bodyB.data[0].status, "connected");
  });

  test("denies updates to roles without integration permission", async () => {
    const cashier = await createUser("cash", { role: "Cashier", orgName: "CashierOrg" });
    const res = await connectWhatsApp(cashier.token);
    assert.equal(res.status, 403);
  });
});
