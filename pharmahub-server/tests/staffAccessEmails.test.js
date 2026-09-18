import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

// Tests are only ever allowed to run against the dedicated test database,
// explicitly provided via MONGO_URI_TEST (see api.test.js for the rationale).
const uri = process.env.MONGO_URI_TEST;
let connected = false;

// The mailer is real here, but SMTP is not configured in the test environment,
// so sendEmail resolves to `{ skipped: true }` without ever sending. Every
// notification attempt is nonetheless recorded in the audit trail (with the
// email kind + subject), which is exactly what these tests assert against —
// how many emails were attempted and which variant was selected.
const { createApp } = await import("../src/app.js");
const { Role } = await import("../src/models/Role.js");
const { User } = await import("../src/models/User.js");
const { AuditLog } = await import("../src/models/AuditLog.js");

if (uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    connected = true;
  } catch (err) {
    console.log(`[test] MongoDB unavailable (${err?.message ?? err}); staff-access email tests skipped`);
  }
} else {
  console.log("[test] MONGO_URI_TEST not set — staff-access email tests skipped");
}

let server;
let base;

before(async () => {
  if (!connected) return;
  await Role.ensureSystemRoles();
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  // Only ever drop the dedicated test database — never the dev/production DB.
  if (connected && mongoose.connection.name === "pharmahub_test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

async function request(path, { method = "GET", body, token } = {}) {
  return fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("staff access email notifications (requires MongoDB)", { skip: !connected && "MongoDB not available - skipped" }, () => {
  // Every notification attempt for a given member, newest first. Each record
  // carries the selected email variant in details.kind.
  const notificationsFor = (userId) =>
    AuditLog.find({
      entityType: "user",
      entityId: String(userId),
      action: { $regex: /^(Role change email|Staff removal email)/ },
    }).sort({ createdAt: -1 });

  // Register an Owner, create a Cashier member in the same org and return an
  // API-usable id plus the member's _id used to query the audit trail.
  async function setup(prefix) {
    const ownerEmail = `${prefix}-owner-${Date.now()}@pharmahub.demo`;
    const memberEmail = `${prefix}-member-${Date.now()}@pharmahub.demo`;
    const reg = await request("/auth/register", {
      method: "POST",
      body: { name: "Test Owner", email: ownerEmail, password: "password123" },
    });
    assert.equal(reg.status, 201);
    await User.updateOne({ email: ownerEmail }, { $set: { role: "Owner", orgName: "PharmaHub" } });
    const loginRes = await request("/auth/login", {
      method: "POST",
      body: { email: ownerEmail, password: "password123" },
    });
    assert.equal(loginRes.status, 200);
    const ownerToken = (await loginRes.json()).data.token;
    const member = await User.create({
      name: `${prefix} Member`,
      email: memberEmail,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) => bcrypt.hash("password123", 10)),
      role: "Cashier",
      orgName: "PharmaHub",
      active: true,
      status: "active",
    });
    const list = await request("/users", { token: ownerToken });
    const found = (await list.json()).data.find((u) => u.email === memberEmail);
    assert.ok(found, "the new member must be visible to the owner");
    return { ownerToken, id: found.id, userId: member._id };
  }

  test("role-only change sends exactly one role email", async () => {
    const { ownerToken, id, userId } = await setup("roleonly");
    const res = await request(`/users/${id}`, {
      method: "PATCH",
      token: ownerToken,
      body: { role: "Pharmacist" },
    });
    assert.equal(res.status, 200);

    const logs = await notificationsFor(userId);
    assert.equal(logs.length, 1, "a role-only change must produce exactly one email attempt");
    assert.equal(logs[0].details.kind, "role");
    assert.equal(logs[0].details.subject, "Your PharmaHub role has been updated");
  });

  test("access-only change sends exactly one access email", async () => {
    const { ownerToken, id, userId } = await setup("accessonly");
    const res = await request(`/users/${id}`, {
      method: "PATCH",
      token: ownerToken,
      body: {
        role: "Cashier",
        accessIds: ["dashboard", "medicines", "sales", "reports"],
        permissions: {
          reports: { view: true, create: false, update: false, delete: false, approve: false, export: false },
        },
      },
    });
    assert.equal(res.status, 200);

    const logs = await notificationsFor(userId);
    assert.equal(logs.length, 1, "an access-only change must produce exactly one email attempt");
    assert.equal(logs[0].details.kind, "access");
    assert.equal(logs[0].details.subject, "Your PharmaHub access has been updated");
  });

  test("role + access in one save sends exactly ONE consolidated email", async () => {
    const { ownerToken, id, userId } = await setup("both");
    const res = await request(`/users/${id}`, {
      method: "PATCH",
      token: ownerToken,
      body: {
        role: "Pharmacist",
        accessIds: ["dashboard", "medicines", "sales", "reports"],
        permissions: {
          reports: { view: true, create: false, update: false, delete: false, approve: false, export: false },
        },
      },
    });
    assert.equal(res.status, 200);

    const logs = await notificationsFor(userId);
    assert.equal(logs.length, 1, "role + access in one save must produce exactly one consolidated email");
    assert.equal(logs[0].details.kind, "both");
    assert.equal(logs[0].details.subject, "Your PharmaHub role and access have been updated");
  });

  test("re-saving identical role/access state sends no additional email", async () => {
    const { ownerToken, id, userId } = await setup("nochange");
    const body = {
      role: "Cashier",
      accessIds: ["dashboard", "medicines", "sales"],
      department: "Front Desk",
      permissions: {
        batches: { view: false, create: false, update: false, delete: false, approve: false, export: false },
      },
      featureAccess: { dataExport: false },
    };
    const first = await request(`/users/${id}`, { method: "PATCH", token: ownerToken, body });
    assert.equal(first.status, 200);
    const firstCount = (await notificationsFor(userId)).length;
    assert.equal(firstCount, 1, "the first meaningful change must be notified once");

    const again = await request(`/users/${id}`, { method: "PATCH", token: ownerToken, body });
    assert.equal(again.status, 200);
    assert.equal(
      (await notificationsFor(userId)).length,
      firstCount,
      "re-saving the exact same state must not send another email",
    );
  });

  test("removing a member sends exactly one staff-removal email", async () => {
    const { ownerToken, id, userId } = await setup("removal");
    const del = await request(`/users/${id}`, { method: "DELETE", token: ownerToken });
    assert.equal(del.status, 200);

    const logs = await notificationsFor(userId);
    assert.equal(logs.length, 1, "a removal must produce exactly one email attempt");
    assert.equal(logs[0].details.subject, "You are no longer a member of PharmaHub");
    assert.match(logs[0].action, /Staff removal email/);
  });

  test("inviting a member creates pending invitation and records audit", async () => {
    const { ownerToken } = await setup("invite-audit");
    const inviteEmail = `invited-${Date.now()}@pharmahub.demo`;
    const res = await request("/users/invite", {
      method: "POST",
      token: ownerToken,
      body: {
        name: "Invited Staff",
        email: inviteEmail,
        role: "Store Keeper",
        accessIds: ["dashboard", "medicines", "inventory", "purchases"],
      },
    });
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.ok(json.data.link);
    assert.equal(json.data.email, inviteEmail);
    assert.equal(json.data.role, "Store Keeper");

    const audit = await AuditLog.findOne({
      entityType: "invitation",
      "details.email": inviteEmail,
    });
    assert.ok(audit, "an audit record must be created for the invitation");
  });

  test("user effective permissions respect explicit accessIds additions and exclusions", async () => {
    const { getEffectivePermissions } = await import("../src/services/permissions.service.js");
    // Cashier with custom access granting purchases (not normally in Cashier) and excluding medicines
    const customCashier = {
      role: "Cashier",
      accessIds: ["dashboard", "sales", "purchases"],
      permissions: {},
    };
    const perms = await getEffectivePermissions(customCashier);
    assert.equal(perms.sales?.view, true, "sales is in accessIds and granted");
    assert.equal(perms.purchases?.view, true, "purchases is in accessIds and granted even though not in default Cashier");
    assert.equal(perms.medicines?.view, false, "medicines is omitted from accessIds and denied");
    assert.equal(perms.batches?.view, false, "batches is omitted from accessIds and denied");
  });
});

