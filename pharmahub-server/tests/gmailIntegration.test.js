import { test, before, after, beforeEach, describe, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { createApp } from "../src/app.js";
import { Role } from "../src/models/Role.js";
import { User } from "../src/models/User.js";
import { Integration } from "../src/models/Integration.js";
import { createOAuthState, verifyOAuthState } from "../src/services/gmail.service.js";

// Tests only ever run against the dedicated test database via MONGO_URI_TEST.
const uri = process.env.MONGO_URI_TEST;
let connected = false;
if (uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    connected = true;
  } catch (err) {
    console.log(`[test] MongoDB unavailable (${err?.message ?? err}); gmail integration tests skipped`);
  }
} else {
  console.log("[test] MONGO_URI_TEST not set — gmail integration tests skipped");
}

const GMAIL_ACCOUNT = "pharmacy@gmail.com";
const SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

let server;
let base;
let realFetch;
let googleCalls;

before(async () => {
  if (!connected) return;
  await Role.ensureSystemRoles();

  // Google OAuth env — read live by googleConfig() in config/env.js.
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  process.env.GOOGLE_REDIRECT_URI = "http://localhost:5050/api/v1/integrations/gmail/callback";

  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;

  realFetch = globalThis.fetch;
  googleCalls = [];
  mock.method(globalThis, "fetch", async (url, options = {}) => {
    const target = String(url);
    if (target.startsWith("https://oauth2.googleapis.com/token")) {
      const body = new URLSearchParams(options.body);
      const grantType = body.get("grant_type");
      googleCalls.push({ type: "token", grantType });
      if (grantType === "refresh_token") {
        return new Response(
          JSON.stringify({ access_token: "at-refreshed", expires_in: 3600, scope: SEND_SCOPE }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          access_token: "at-code",
          refresh_token: "rt-code",
          expires_in: 3600,
          scope: SEND_SCOPE,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (target.startsWith("https://oauth2.googleapis.com/revoke")) {
      googleCalls.push({ type: "revoke" });
      return new Response("", { status: 200 });
    }
    if (target.includes("gmail.googleapis.com/gmail/v1/users/me/profile")) {
      googleCalls.push({ type: "profile" });
      return new Response(
        JSON.stringify({ emailAddress: GMAIL_ACCOUNT, id: "gid-123", messagesTotal: 5 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (target.includes("gmail.googleapis.com/gmail/v1/users/me/messages/send")) {
      googleCalls.push({ type: "send", body: JSON.parse(options.body ?? "{}") });
      return new Response(
        JSON.stringify({ id: "msg-1", threadId: "t-1", labelIds: ["SENT"] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return realFetch(url, options);
  });
});

after(async () => {
  mock.restoreAll();
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_REDIRECT_URI;
  if (server) await new Promise((resolve) => server.close(resolve));
  if (connected && mongoose.connection.name === "pharmahub_test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

beforeEach(async () => {
  if (!connected) return;
  await Integration.deleteMany({});
  googleCalls.length = 0;
});

async function request(path, { method = "GET", body, token, redirect } = {}) {
  return fetch(`${base}${path}`, {
    method,
    redirect,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createUser(prefix, { role = "Admin", orgName = "GmailOrg" } = {}) {
  const email = `${prefix}-${Date.now()}@pharmahub.in`;
  const reg = await request("/auth/register", {
    method: "POST",
    body: { name: "Gmail Tester", email, password: "password123" },
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
  const user = await User.findOne({ email }).lean();
  return { token: body.data.token, email, id: String(user._id) };
}

async function startOAuth(token) {
  const res = await request("/integrations/gmail/connect", { token });
  assert.equal(res.status, 200);
  const body = await res.json();
  const url = new URL(body.data.authorizationUrl);
  return { url, state: url.searchParams.get("state"), code: "auth-code-123" };
}

async function completeCallback(user, { token, state, code } = {}) {
  const { url } = token ? await startOAuth(token) : {};
  const finalState = state ?? url.searchParams.get("state");
  return request(`/integrations/gmail/callback?code=${code ?? "auth-code-123"}&state=${encodeURIComponent(finalState)}`, {
    redirect: "manual",
  });
}

describe("gmail integration API", () => {
  test("start connect requires authentication and update permission", async () => {
    const anon = await request("/integrations/gmail/connect");
    assert.equal(anon.status, 401);

    const cashier = await createUser("gmcash", { role: "Cashier", orgName: "CashierGmailOrg" });
    const denied = await request("/integrations/gmail/connect", { token: cashier.token });
    assert.equal(denied.status, 403);
  });

  test("start connect builds a send-only Google OAuth authorization URL", async () => {
    const user = await createUser("gmurl");
    const { url } = await startOAuth(user.token);
    assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
    assert.equal(url.searchParams.get("client_id"), "test-client-id");
    assert.equal(url.searchParams.get("redirect_uri"), process.env.GOOGLE_REDIRECT_URI);
    assert.equal(url.searchParams.get("response_type"), "code");
    assert.equal(url.searchParams.get("scope"), SEND_SCOPE);
    assert.equal(url.searchParams.get("access_type"), "offline");
    assert.ok(url.searchParams.get("state"));
    // The signed state must resolve to this user's tenant.
    assert.equal(verifyOAuthState(url.searchParams.get("state")).tenantId, "GmailOrg");
  });

  test("start connect fails cleanly when Google OAuth is not configured", async () => {
    const user = await createUser("gmcfg");
    const saved = {
      id: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET,
      uri: process.env.GOOGLE_REDIRECT_URI,
    };
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    try {
      const res = await request("/integrations/gmail/connect", { token: user.token });
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.match(body.error.message, /not configured/i);
    } finally {
      process.env.GOOGLE_CLIENT_ID = saved.id;
      process.env.GOOGLE_CLIENT_SECRET = saved.secret;
      process.env.GOOGLE_REDIRECT_URI = saved.uri;
    }
  });

  test("full OAuth callback connects the org Gmail account and never leaks tokens", async () => {
    const user = await createUser("gmcb");

    const cb = await completeCallback(user, { token: user.token });
    assert.equal(cb.status, 302);
    assert.match(cb.headers.get("location"), /gmail=connected/);
    assert.match(cb.headers.get("location"), /\/integrations/);

    // Stored with credentials in the DB (backend-only).
    const record = await Integration.findOne({ tenantId: "GmailOrg", key: "gmail" }).select("+credentials");
    assert.ok(record);
    assert.equal(record.connected, true);
    assert.equal(record.accountEmail, GMAIL_ACCOUNT);
    assert.equal(record.credentials.accessToken, "at-code");
    assert.equal(record.credentials.refreshToken, "rt-code");

    // The API list exposes the connected account but never credentials.
    const list = await request("/integrations", { token: user.token });
    assert.equal(list.status, 200);
    const listBody = await list.json();
    const gmail = listBody.data.find((i) => i.key === "gmail");
    assert.ok(gmail);
    assert.equal(gmail.status, "connected");
    assert.equal(gmail.accountEmail, GMAIL_ACCOUNT);
    assert.equal(gmail.credentials, undefined);
    assert.equal(gmail.accessToken, undefined);
    assert.equal(gmail.refreshToken, undefined);
    const raw = JSON.stringify(listBody);
    assert.ok(!raw.includes("at-code"));
    assert.ok(!raw.includes("rt-code"));
    assert.ok(!raw.includes("clientSecret"));
  });

  test("callback rejects a tampered/forged state and redirects to the UI", async () => {
    const res = await request("/integrations/gmail/callback?code=x&state=forged.state.value", {
      redirect: "manual",
    });
    assert.equal(res.status, 302);
    assert.match(res.headers.get("location"), /gmail=error/);
    const none = await Integration.findOne({ key: "gmail" });
    assert.equal(none, null);
  });

  test("send test email delivers through the Gmail API from the connected account", async () => {
    const user = await createUser("gmtst");
    await completeCallback(user, { token: user.token });

    const res = await request("/integrations/gmail/test", { method: "POST", token: user.token });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.message, "Test email sent successfully");
    assert.equal(body.data.to, GMAIL_ACCOUNT);

    const sendCalls = googleCalls.filter((c) => c.type === "send");
    assert.equal(sendCalls.length, 1);
    const raw = Buffer.from(sendCalls[0].body.raw, "base64url").toString("utf8");
    assert.match(raw, /To: pharmacy@gmail.com/);
    assert.match(raw, /Subject: PharmaHub — Gmail integration test/);
    assert.ok(!googleCalls.some((c) => c.type === "token" && c.grantType === "refresh_token"));
  });

  test("refreshes an expired access token before sending", async () => {
    const user = await createUser("gmrf");
    await completeCallback(user, { token: user.token });
    await Integration.updateOne(
      { tenantId: "GmailOrg", key: "gmail" },
      { $set: { "credentials.tokenExpiresAt": Date.now() - 60 * 1000 } },
    );

    const res = await request("/integrations/gmail/test", { method: "POST", token: user.token });
    assert.equal(res.status, 200);
    assert.ok(googleCalls.some((c) => c.type === "token" && c.grantType === "refresh_token"));
    assert.equal(googleCalls.filter((c) => c.type === "send").length, 1);

    const record = await Integration.findOne({ tenantId: "GmailOrg", key: "gmail" }).select("+credentials");
    assert.equal(record.credentials.accessToken, "at-refreshed");
  });

  test("send test email without a connection is a clean 400", async () => {
    const user = await createUser("gmno");
    const res = await request("/integrations/gmail/test", { method: "POST", token: user.token });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error.message, /Connect a Gmail account/i);
  });

  test("disconnect clears credentials and account info, preserving org isolation records", async () => {
    const user = await createUser("gmdis");
    await completeCallback(user, { token: user.token });

    const res = await request("/integrations/gmail", { method: "DELETE", token: user.token });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.connected, false);
    assert.equal(body.data.configured, false);
    assert.equal(body.data.status, "disconnected");
    assert.equal(body.data.accountEmail, null);

    const record = await Integration.findOne({ tenantId: "GmailOrg", key: "gmail" }).select("+credentials");
    assert.equal(record.credentials, null);
    assert.equal(record.accountEmail, null);
    assert.equal(record.connected, false);

    const list = await request("/integrations", { token: user.token });
    const listBody = await list.json();
    const gmail = listBody.data.find((i) => i.key === "gmail");
    assert.equal(gmail.status, "disconnected");

    const test = await request("/integrations/gmail/test", { method: "POST", token: user.token });
    assert.equal(test.status, 400);
  });

  test("generic gmail connect/configure/disconnect routes are rejected", async () => {
    const user = await createUser("gmgrd");
    const connect = await request("/integrations/gmail/connect", {
      method: "POST",
      token: user.token,
      body: { config: {} },
    });
    assert.equal(connect.status, 400);
    const configure = await request("/integrations/gmail/configure", {
      method: "PUT",
      token: user.token,
      body: { config: {} },
    });
    assert.equal(configure.status, 400);
    const disconnect = await request("/integrations/gmail/disconnect", {
      method: "POST",
      token: user.token,
    });
    assert.equal(disconnect.status, 400);
    const none = await Integration.findOne({ key: "gmail" });
    assert.equal(none, null);
  });

  test("isolates the connected Gmail account between organizations", async () => {
    const userA = await createUser("gma", { orgName: "OrgGmailA" });
    await completeCallback(userA, { token: userA.token });

    const userB = await createUser("gmb", { orgName: "OrgGmailB" });
    const listB = await request("/integrations", { token: userB.token });
    const bodyB = await listB.json();
    assert.deepEqual(bodyB.data, []);

    const testB = await request("/integrations/gmail/test", { method: "POST", token: userB.token });
    assert.equal(testB.status, 400);

    const delB = await request("/integrations/gmail", { method: "DELETE", token: userB.token });
    assert.equal(delB.status, 404);

    // Org A still sees its own connection untouched.
    const listA = await request("/integrations", { token: userA.token });
    const bodyA = await listA.json();
    assert.equal(bodyA.data.find((i) => i.key === "gmail").status, "connected");
  });
});

describe("gmail oauth state helpers", () => {
  test("round-trips, rejects tampering and rejects stale states", () => {
    const user = { _id: "507f1f77bcf86cd799439011", orgName: "StateOrg" };
    const state = createOAuthState(user);
    assert.equal(verifyOAuthState(state).tenantId, "StateOrg");

    assert.throws(() => verifyOAuthState(`${state.slice(0, -3)}xxx`), /tampered/i);
    assert.throws(() => verifyOAuthState("no-dot-here"), /Invalid connection request/i);

    const stale = createOAuthState(user).split(".")[0] + ".";
    assert.throws(() => verifyOAuthState(`${stale}AAAA`), /tampered|Invalid/i);
  });
});
