import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { createApp } from "../src/app.js";
import { Role } from "../src/models/Role.js";
import { User } from "../src/models/User.js";
import { Invitation } from "../src/models/Invitation.js";
import { buildRoleChangeEmail, buildStaffRemovalEmail } from "../src/services/emailTemplates.js";
import { uploadsDir } from "../src/middlewares/upload.js";

// Tests are only ever allowed to run against the dedicated test database,
// explicitly provided via MONGO_URI_TEST. They never inherit the configured
// MONGO_URL (which may point at Atlas) — without MONGO_URI_TEST the API flow
// tests are skipped so the test data can never leak into a real database.
const uri = process.env.MONGO_URI_TEST;
let connected = false;
if (uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    connected = true;
  } catch (err) {
    console.log(`[test] MongoDB unavailable (${err?.message ?? err}); API flow tests skipped`);
  }
} else {
  console.log("[test] MONGO_URI_TEST not set — API flow tests skipped (the configured MONGO_URL is never used for tests)");
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
  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;
  return fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      ...(isMultipart ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: isMultipart ? body : body ? JSON.stringify(body) : undefined,
  });
}

describe("full API flow (requires MongoDB)", { skip: !connected && "MongoDB not available - skipped" }, () => {
  const email = `test-${Date.now()}@pharmahub.demo`;

  test("login with invalid credentials returns 401", async () => {
    const res = await request("/auth/login", {
      method: "POST",
      body: { email: "nobody@example.com", password: "wrongpass" },
    });
    assert.equal(res.status, 401);
  });

  test("register a new user", async () => {
    const res = await request("/auth/register", {
      method: "POST",
      body: { name: "Integration Tester", email, password: "password123" },
    });
    assert.equal(res.status, 201);
  });

  let token;
  test("login as the new user", async () => {
    const res = await request("/auth/login", {
      method: "POST",
      body: { email, password: "password123" },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    token = body.data.token;
    assert.ok(token);
    assert.equal(body.data.user.role, "Pharmacist");
  });

  test("get current user via /auth/me", async () => {
    const res = await request("/auth/me", { token });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.email, email);
  });

  test("create a category with the token", async () => {
    // Promote the test user to Admin so the category creation is permitted.
    await User.updateOne({ email }, { $set: { role: "Admin" } });
    const res = await request("/categories", {
      method: "POST",
      token,
      body: { name: `Cat-${Date.now()}` },
    });
    assert.equal(res.status, 201);
  });

  test("read-only role (Cashier) is denied medicine creation", async () => {
    const cashierEmail = `c-${Date.now()}@pharmahub.demo`;
    const created = await request("/users", {
      method: "POST",
      token,
      body: { name: "Test Cashier", email: cashierEmail, password: "password123", role: "Cashier" },
    });
    assert.equal(created.status, 201);

    const login = await request("/auth/login", {
      method: "POST",
      body: { email: cashierEmail, password: "password123" },
    });
    const cashierToken = (await login.json()).data.token;

    const res = await request("/medicines", {
      method: "POST",
      token: cashierToken,
      body: { name: "Should Not Exist" },
    });
    assert.equal(res.status, 403);
  });

  test("list medicines (Pharmacist has view access)", async () => {
    const res = await request("/medicines", { token });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(Array.isArray(body.data), true);
  });

  // ── Invitation & membership lifecycle ────────────────────────────────────────
  const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");
  const future = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

  async function createOwner(name) {
    const ownerEmail = `${name}-${Date.now()}@pharmahub.demo`;
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
    return (await loginRes.json()).data.token;
  }

  test("invite endpoint persists a pending Invitation in MongoDB", async () => {
    const ownerToken = await createOwner("inv-owner");
    const inviteEmail = `invite-${Date.now()}@pharmahub.demo`;

    const res = await request("/users/invite", {
      method: "POST",
      token: ownerToken,
      body: { name: "Moki Test", email: inviteEmail, role: "Pharmacist" },
    });
    assert.equal(res.status, 201);

    const dbInv = await Invitation.findOne({ email: inviteEmail }).select("+tokenHash").lean();
    assert.ok(dbInv, "Invitation document must exist in MongoDB");
    assert.equal(dbInv.status, "pending");
    assert.equal(dbInv.role, "Pharmacist");
    assert.equal(dbInv.orgName, "PharmaHub");
    assert.ok(dbInv.tokenHash);
    assert.ok(dbInv.expiresAt);
  });

  test("accept invitation creates a real persisted active User and marks invitation accepted", async () => {
    const ownerToken = await createOwner("accept-owner");
    const inviteEmail = `accept-${Date.now()}@pharmahub.demo`;
    const rawToken = crypto.randomBytes(32).toString("hex");

    await Invitation.create({
      email: inviteEmail,
      role: "Pharmacist",
      name: "Moki",
      invitedBy: new mongoose.Types.ObjectId(),
      orgName: "PharmaHub",
      tokenHash: hashToken(rawToken),
      expiresAt: future(),
      status: "pending",
    });

    // Validation before acceptance.
    const check = await request(`/users/invite/${rawToken}`);
    assert.equal(check.status, 200);
    assert.equal((await check.json()).data.valid, true);

    // Accept.
    const accept = await request("/users/invitations/accept", {
      method: "POST",
      body: { token: rawToken, name: "Moki", password: "password123" },
    });
    assert.equal(accept.status, 201);
    const body = await accept.json();
    assert.equal(body.data.user.email, inviteEmail);
    assert.equal(body.data.user.role, "Pharmacist");
    assert.equal(body.data.user.status, "active");
    assert.equal(body.data.user.orgName, "PharmaHub");

    // User document persisted with canonical fields.
    const user = await User.findOne({ email: inviteEmail }).select("+passwordHash");
    assert.ok(user, "User document must exist in MongoDB");
    assert.equal(user.name, "Moki");
    assert.equal(user.role, "Pharmacist");
    assert.equal(user.orgName, "PharmaHub");
    assert.equal(user.status, "active");
    assert.equal(user.active, true);
    assert.ok(user.passwordHash && user.passwordHash.length > 0, "password hash must be stored");
    assert.notEqual(user.passwordHash, "password123");

    // Invitation updated, not deleted.
    const dbInv = await Invitation.findOne({ email: inviteEmail }).lean();
    assert.ok(dbInv, "Invitation must be kept for audit");
    assert.equal(dbInv.status, "accepted");
    assert.ok(dbInv.acceptedAt);
    assert.equal(String(dbInv.acceptedBy), String(user._id));

    // One-time link cannot be reused.
    const again = await request("/users/invitations/accept", {
      method: "POST",
      body: { token: rawToken, name: "Moki", password: "password123" },
    });
    assert.equal(again.status, 400);

    // Owner sees the member in Users (org-scoped).
    const users = await request("/users", { token: ownerToken });
    const userList = (await users.json()).data;
    assert.ok(userList.some((u) => u.email === inviteEmail), "member must appear in GET /users");

    // Roles counts include the member.
    const roles = await request("/roles", { token: ownerToken });
    const roleList = (await roles.json()).data;
    const pharmacist = roleList.find((r) => r.name === "Pharmacist");
    assert.ok(pharmacist.assignedUsersCount >= 1, "Pharmacist count must include the new member");
  });

  test("accepting an invitation for an existing email links the account without duplicating it", async () => {
    const ownerToken = await createOwner("link-owner");
    const inviteEmail = `link-${Date.now()}@pharmahub.demo`;
    const rawToken = crypto.randomBytes(32).toString("hex");

    // The invitee registers manually before accepting (email already exists).
    const reg = await request("/auth/register", {
      method: "POST",
      body: { name: "Early Bird", email: inviteEmail, password: "password123" },
    });
    assert.equal(reg.status, 201);
    const before = await User.findOne({ email: inviteEmail }).lean();
    assert.equal(before.role, "Pharmacist");
    assert.equal(before.orgName, undefined);

    await Invitation.create({
      email: inviteEmail,
      role: "Cashier",
      name: "Moki",
      invitedBy: new mongoose.Types.ObjectId(),
      orgName: "PharmaHub",
      tokenHash: hashToken(rawToken),
      expiresAt: future(),
      status: "pending",
    });

    const accept = await request("/users/invitations/accept", {
      method: "POST",
      body: { token: rawToken, name: "Moki", password: "newpass123" },
    });
    assert.equal(accept.status, 201);

    const users = await User.find({ email: inviteEmail }).select("+passwordHash");
    assert.equal(users.length, 1, "must NOT create a duplicate user document");
    const linked = users[0];
    assert.equal(String(linked._id), String(before._id), "must update/link the existing user");
    assert.equal(linked.name, "Moki");
    assert.equal(linked.role, "Cashier");
    assert.equal(linked.orgName, "PharmaHub");
    assert.equal(linked.status, "active");
    assert.equal(linked.active, true);
    const newHashValid = await import("bcryptjs").then(({ default: bcrypt }) =>
      bcrypt.compare("newpass123", linked.passwordHash),
    );
    assert.equal(newHashValid, true, "new password hash must be stored");

    const dbInv = await Invitation.findOne({ email: inviteEmail }).lean();
    assert.equal(dbInv.status, "accepted");

    const usersRes = await request("/users", { token: ownerToken });
    const list = (await usersRes.json()).data;
    assert.equal(
      list.filter((u) => u.email === inviteEmail).length,
      1,
      "exactly one persisted member in GET /users",
    );
  });

  // ── Permission enforcement matrix ────────────────────────────────────────────
  // Invitation-time overrides must persist on the Invitation, transfer to the
  // User on acceptance, and drive both the effective matrix returned at login
  // and the authorize middleware (403), independent of the role defaults.
  const permsOf = (doc) =>
    doc?.permissions instanceof Map ? Object.fromEntries(doc.permissions) : doc?.permissions ?? {};

  test("invited user's permission overrides are enforced by the authorize middleware", async () => {
    const ownerToken = await createOwner("perm-owner");
    const inviteEmail = `perm-${Date.now()}@pharmahub.demo`;
    const rawToken = crypto.randomBytes(32).toString("hex");
    const overrides = {
      batches: { view: false, create: false, update: false, delete: false, approve: false, export: false },
      users: { view: false, create: false, update: false, delete: false, approve: false, export: false },
      reports: { view: false, create: false, update: false, delete: false, approve: false, export: false },
      // Explicit grant for a module the Pharmacist role denies by default
      // (audit is view-only for Pharmacist; here we grant create too).
      audit: { create: true },
    };

    // The invite endpoint persists the overrides on the Invitation document.
    const invite = await request("/users/invite", {
      method: "POST",
      token: ownerToken,
      body: {
        name: "Restricted Pharmacist",
        email: inviteEmail,
        role: "Pharmacist",
        permissions: overrides,
        featureAccess: { dashboard: true, mobile: false },
      },
    });
    assert.equal(invite.status, 201);
    const dbInv = await Invitation.findOne({ email: inviteEmail }).lean();
    assert.equal(permsOf(dbInv).batches.view, false);
    assert.equal(permsOf(dbInv).audit.create, true);
    assert.equal(dbInv.featureAccess.mobile, false);

    // Accept a fresh invitation (created directly with a known token, matching
    // the existing accept-test pattern) carrying the same overrides.
    await Invitation.create({
      email: inviteEmail,
      role: "Pharmacist",
      name: "Restricted Pharmacist",
      invitedBy: new mongoose.Types.ObjectId(),
      orgName: "PharmaHub",
      tokenHash: hashToken(rawToken),
      expiresAt: future(),
      status: "pending",
      permissions: overrides,
      featureAccess: { dashboard: true, mobile: false },
    });

    const accept = await request("/users/invitations/accept", {
      method: "POST",
      body: { token: rawToken, name: "Restricted Pharmacist", password: "password123" },
    });
    assert.equal(accept.status, 201);
    const acceptUser = (await accept.json()).data.user;
    assert.equal(acceptUser.permissions.batches.view, false);
    assert.equal(acceptUser.permissions.users.view, false);
    assert.equal(acceptUser.permissions.medicines.view, true, "role default view must be kept for unrestricted modules");

    const dbUser = await User.findOne({ email: inviteEmail }).lean();
    assert.equal(permsOf(dbUser).batches.view, false);
    assert.equal(dbUser.featureAccess.mobile, false);

    // Login returns the same effective matrix (survives refresh / re-login).
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: inviteEmail, password: "password123" },
    });
    assert.equal(login.status, 200);
    const loginBody = await login.json();
    const memberToken = loginBody.data.token;
    assert.equal(loginBody.data.user.permissions.batches.view, false);
    assert.equal(loginBody.data.user.permissions.users.view, false);
    assert.equal(loginBody.data.user.permissions.reports.view, false);

    // /auth/me and /users/me agree.
    const me = await request("/auth/me", { token: memberToken });
    assert.equal((await me.json()).data.permissions.batches.view, false);
    const usersMe = await request("/users/me", { token: memberToken });
    assert.equal((await usersMe.json()).data.permissions.reports.view, false);

    // Restricted modules → 403; allowed modules → 200. The owner still has
    // full access, and the role defaults were never rewritten.
    assert.equal((await request("/batches", { token: memberToken })).status, 403);
    assert.equal((await request("/reports", { token: memberToken })).status, 403);
    assert.equal((await request("/users", { token: memberToken })).status, 403);
    assert.equal((await request("/medicines", { token: memberToken })).status, 200);
    assert.equal((await request("/sales", { token: memberToken })).status, 200);
    assert.equal((await request("/batches", { token: ownerToken })).status, 200);

    const role = await Role.findOne({ name: "Pharmacist" }).lean();
    assert.equal(permsOf(role).batches.view, true, "role default must be unchanged");
    assert.equal(permsOf(role).users.view, true, "role default must be unchanged");
  });

  // ── Update user permissions (staff access editing) ──────────────────────────
  test("owner can update a member's permission overrides and enforcement follows", async () => {
    const ownerToken = await createOwner("update-owner");
    const memberEmail = `upd-${Date.now()}@pharmahub.demo`;
    const member = await User.create({
      name: "Update Target",
      email: memberEmail,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) => bcrypt.hash("password123", 10)),
      role: "Pharmacist",
      orgName: "PharmaHub",
      active: true,
      status: "active",
    });

    const list = await request("/users", { token: ownerToken });
    const found = (await list.json()).data.find((u) => u.email === memberEmail);
    assert.ok(found);

    const patch = await request(`/users/${found.id}`, {
      method: "PATCH",
      token: ownerToken,
      body: {
        permissions: {
          batches: { view: false, create: false, update: false, delete: false, approve: false, export: false },
          reports: { view: false, create: false, update: false, delete: false, approve: false, export: false },
        },
      },
    });
    assert.equal(patch.status, 200);

    const login = await request("/auth/login", {
      method: "POST",
      body: { email: memberEmail, password: "password123" },
    });
    const memberToken = (await login.json()).data.token;
    assert.equal((await request("/batches", { token: memberToken })).status, 403);
    assert.equal((await request("/reports", { token: memberToken })).status, 403);
    assert.equal((await request("/medicines", { token: memberToken })).status, 200);

    // A bogus module key can never be stored.
    const doc = await User.findById(member._id).lean();
    assert.equal("nonexistent" in permsOf(doc), false);
  });

  // ── Role change lifecycle ──────────────────────────────────────────────────
  test("owner can change a member's role + access; it persists and is enforced after refresh", async () => {
    const ownerToken = await createOwner("role-owner");
    const memberEmail = `rolechg-${Date.now()}@pharmahub.demo`;
    const member = await User.create({
      name: "Role Change Target",
      email: memberEmail,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) => bcrypt.hash("password123", 10)),
      role: "Cashier",
      orgName: "PharmaHub",
      active: true,
      status: "active",
    });

    const list = await request("/users", { token: ownerToken });
    const found = (await list.json()).data.find((u) => u.email === memberEmail);
    assert.ok(found);

    const patch = await request(`/users/${found.id}`, {
      method: "PATCH",
      token: ownerToken,
      body: {
        role: "Pharmacist",
        permissions: {
          batches: { view: false, create: false, update: false, delete: false, approve: false, export: false },
          reports: { view: false, create: false, update: false, delete: false, approve: false, export: false },
        },
        featureAccess: { userAdmin: false, dataExport: true },
      },
    });
    assert.equal(patch.status, 200);
    const patched = (await patch.json()).data;
    assert.equal(patched.role, "Pharmacist");

    // Persisted in MongoDB — survives refresh / re-login.
    const doc = await User.findById(member._id).lean();
    assert.equal(doc.role, "Pharmacist");
    assert.equal(permsOf(doc).batches.view, false);
    assert.equal(doc.featureAccess.userAdmin, false);
    assert.equal(doc.featureAccess.dataExport, true);

    // The authorization middleware enforces the new effective matrix.
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: memberEmail, password: "password123" },
    });
    assert.equal(login.status, 200);
    const memberToken = (await login.json()).data.token;
    assert.equal((await request("/batches", { token: memberToken })).status, 403);
    assert.equal((await request("/reports", { token: memberToken })).status, 403);
    assert.equal((await request("/medicines", { token: memberToken })).status, 200);
    assert.equal((await request("/sales", { token: memberToken })).status, 200);

    // GET /users reflects the new role immediately.
    const after = await request("/users", { token: ownerToken });
    const row = (await after.json()).data.find((u) => u.email === memberEmail);
    assert.equal(row.role, "Pharmacist");
  });

  // ── Access module whitelist + department persistence ────────────────────────
  test("member's access module whitelist, department and designation persist through refresh and re-login", async () => {
    const ownerToken = await createOwner("wl-owner");
    const memberEmail = `wl-${Date.now()}@pharmahub.demo`;
    const member = await User.create({
      name: "Whitelist Target",
      email: memberEmail,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) => bcrypt.hash("password123", 10)),
      role: "Cashier",
      orgName: "PharmaHub",
      active: true,
      status: "active",
    });

    const list = await request("/users", { token: ownerToken });
    const found = (await list.json()).data.find((u) => u.email === memberEmail);
    assert.ok(found);

    // The Cashier's default modules plus Reports, Purchases and Expiry granted
    // via the Staff Access dialog. The whitelist must be stored verbatim.
    const whitelist = ["dashboard", "medicines", "batches", "sales", "shortbook", "reports", "purchases", "expiry"];

    const patch = await request(`/users/${found.id}`, {
      method: "PATCH",
      token: ownerToken,
      body: {
        role: "Cashier",
        accessIds: whitelist,
        department: "Accounts & Finance",
        designation: "Senior Cashier",
        permissions: {
          reports: { view: true, create: false, update: false, delete: false, approve: false, export: false },
          expiry: { view: true, create: false, update: false, delete: false, approve: false, export: false },
          purchases: { view: true, create: false, update: false, delete: false, approve: false, export: false },
        },
        featureAccess: { dataExport: false },
      },
    });
    assert.equal(patch.status, 200);
    const patched = (await patch.json()).data;
    assert.equal(patched.role, "Cashier");
    assert.equal(patched.department, "Accounts & Finance");
    assert.equal(patched.designation, "Senior Cashier");
    assert.ok(patched.accessIds.includes("reports"));
    assert.ok(patched.accessIds.includes("purchases"));
    assert.ok(patched.accessIds.includes("expiry"));
    assert.ok(patched.accessIds.includes("shortbook"));

    // Persisted in MongoDB — a refresh of GET /users re-reads it.
    const doc = await User.findById(member._id).lean();
    assert.deepEqual(doc.accessIds, whitelist);
    assert.equal(doc.department, "Accounts & Finance");
    assert.equal(doc.designation, "Senior Cashier");

    const after = await request("/users", { token: ownerToken });
    const row = (await after.json()).data.find((u) => u.email === memberEmail);
    assert.deepEqual(row.accessIds, whitelist, "GET /users must return the saved whitelist");
    assert.equal(row.department, "Accounts & Finance");
    assert.equal(row.designation, "Senior Cashier");

    // Re-login (the app's refresh path) returns the same saved whitelist.
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: memberEmail, password: "password123" },
    });
    assert.equal(login.status, 200);
    const loginBody = await login.json();
    assert.deepEqual(loginBody.data.user.accessIds, whitelist, "re-login must return the saved whitelist");
    assert.equal(loginBody.data.user.department, "Accounts & Finance");
    // The granted modules are effective after re-login.
    assert.equal(loginBody.data.user.permissions.reports.view, true);
    assert.equal(loginBody.data.user.permissions.expiry.view, true);

    // Bogus/unknown module keys are never persisted into the whitelist.
    const bogus = await request(`/users/${found.id}`, {
      method: "PATCH",
      token: ownerToken,
      body: { accessIds: ["dashboard", "nonexistent-module", "sales"] },
    });
    assert.equal(bogus.status, 200);
    const bogusDoc = await User.findById(member._id).lean();
    assert.ok(bogusDoc.accessIds.includes("dashboard"));
    assert.ok(bogusDoc.accessIds.includes("sales"));
    assert.ok(!bogusDoc.accessIds.includes("nonexistent-module"));
  });

  test("role-change email template reports previous role, new role and effective access", () => {
    const { subject, text } = buildRoleChangeEmail({
      name: "Alex Staff",
      orgName: "PharmaHub",
      previousRole: "Cashier",
      newRole: "Pharmacist",
      permissions: {
        dashboard: { view: true, create: false, update: false, delete: false, approve: false, export: true },
        medicines: { view: true, create: true, update: true, delete: false, approve: false, export: false },
        batches: { view: false, create: false, update: false, delete: false, approve: false, export: false },
      },
      changedBy: "PharmaHub Demo Owner",
    });
    assert.equal(subject, "Your PharmaHub role has been updated");
    assert.match(text, /Cashier/);
    assert.match(text, /Pharmacist/);
    assert.match(text, /updated by an administrator/);
    assert.match(text, /Dashboard: View, Export/);
    assert.match(text, /Medicines: View, Create, Update/);
    assert.doesNotMatch(text, /Batches/);
    assert.match(text, /Please log in again to PharmaHub to apply your updated role and access/);
  });

  test("role-change email includes the member's role for access-only changes", () => {
    const { subject, text } = buildRoleChangeEmail({
      name: "Alex Staff",
      orgName: "PharmaHub",
      newRole: "Cashier",
      permissions: {
        reports: { view: true, create: false, update: false, delete: false, approve: false, export: false },
      },
      changedBy: "PharmaHub Demo Owner",
      kind: "access",
    });
    assert.equal(subject, "Your PharmaHub access has been updated");
    assert.match(text, /Your access settings in PharmaHub have been updated by an administrator/);
    assert.match(text, /Your role: Cashier/);
    assert.match(text, /Your assigned modules and permissions have been changed/);
    assert.doesNotMatch(text, /changed from/);
    assert.doesNotMatch(text, /Previous role/);
    assert.match(text, /Please log in again to PharmaHub to apply your updated access/);
  });

  test("consolidated role+access email uses the single combined subject", () => {
    const { subject, text } = buildRoleChangeEmail({
      name: "Alex Staff",
      orgName: "PharmaHub",
      previousRole: "Cashier",
      newRole: "Pharmacist",
      permissions: {
        sales: { view: true, create: true, update: false, delete: false, approve: false, export: false },
      },
      previousPermissions: {},
      changedBy: "PharmaHub Demo Owner",
      kind: "both",
    });
    assert.equal(subject, "Your PharmaHub role and access have been updated");
    assert.match(text, /Previous role: Cashier/);
    assert.match(text, /New role: Pharmacist/);
    assert.match(text, /Previous access:/);
    assert.match(text, /New access:/);
    assert.match(text, /Sales & POS: View, Create/);
    assert.match(text, /Please log in again to PharmaHub to apply your updated role and access/);
  });

  test("staff-removal email notifies after access is removed", () => {
    const { subject, text } = buildStaffRemovalEmail({
      name: "Alex Staff",
      orgName: "PharmaHub",
    });
    assert.equal(subject, "You are no longer a member of PharmaHub");
    assert.match(text, /has been removed by an administrator/);
    assert.match(text, /You are no longer a member of this PharmaHub organization/);
    assert.match(text, /contact your organization administrator/);
  });

  // ── Remove user (soft delete) ──────────────────────────────────────────────
  test("removing a user excludes them from the users list, role counts, and login", async () => {
    const ownerToken = await createOwner("remove-owner");
    const memberEmail = `rem-${Date.now()}@pharmahub.demo`;
    const member = await User.create({
      name: "Remove Target",
      email: memberEmail,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) =>
        bcrypt.hash("password123", 10),
      ),
      role: "Pharmacist",
      orgName: "PharmaHub",
      active: true,
      status: "active",
    });

    const beforeRoles = await request("/roles", { token: ownerToken });
    const beforeCount = (await beforeRoles.json()).data.find((r) => r.name === "Pharmacist")
      .assignedUsersCount;

    const del = await request(`/users/${member._id}`, { method: "DELETE", token: ownerToken });
    assert.equal(del.status, 200);

    const list = await request("/users", { token: ownerToken });
    const matches = (await list.json()).data.filter((u) => u.email === memberEmail);
    assert.equal(matches.length, 0, "removed user must not appear in the default users list");

    const withRemoved = await request("/users?includeRemoved=true", { token: ownerToken });
    const removedRow = (await withRemoved.json()).data.find((u) => u.email === memberEmail);
    assert.ok(removedRow, "includeRemoved=true must expose the removal audit row");
    assert.equal(removedRow.status, "removed");
    assert.equal(removedRow.active, false);

    const afterRoles = await request("/roles", { token: ownerToken });
    const afterCount = (await afterRoles.json()).data.find((r) => r.name === "Pharmacist")
      .assignedUsersCount;
    assert.equal(afterCount, beforeCount - 1, "role counts must exclude removed users");

    const login = await request("/auth/login", {
      method: "POST",
      body: { email: memberEmail, password: "password123" },
    });
    assert.equal(login.status, 401, "removed user must not be able to sign in");
  });

  test("removing a user revokes their pending invitations", async () => {
    const ownerToken = await createOwner("revoke-owner");
    const memberEmail = `rev-${Date.now()}@pharmahub.demo`;
    const member = await User.create({
      name: "Revoke Target",
      email: memberEmail,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) =>
        bcrypt.hash("password123", 10),
      ),
      role: "Pharmacist",
      orgName: "PharmaHub",
      active: true,
      status: "active",
    });
    const rawToken = crypto.randomBytes(32).toString("hex");
    const inv = await Invitation.create({
      email: memberEmail,
      role: "Pharmacist",
      invitedBy: member._id,
      tokenHash: hashToken(rawToken),
      expiresAt: future(),
      status: "pending",
      orgName: "PharmaHub",
    });

    const del = await request(`/users/${member._id}`, { method: "DELETE", token: ownerToken });
    assert.equal(del.status, 200);

    const dbInv = await Invitation.findById(inv._id).lean();
    assert.equal(dbInv.status, "revoked", "pending invitation must be revoked on user removal");

    const accept = await request("/users/invitations/accept", {
      method: "POST",
      body: { token: rawToken, name: "Revoked", password: "password123" },
    });
    assert.equal(accept.status, 400, "a revoked invitation link must be rejected");
  });

  test("removing a user revokes their accepted invitation so it can never resurrect them", async () => {
    const ownerToken = await createOwner("resurrect-owner");
    const memberEmail = `res-${Date.now()}@pharmahub.demo`;
    const rawToken = crypto.randomBytes(32).toString("hex");
    const inv = await Invitation.create({
      email: memberEmail,
      role: "Cashier",
      name: "Resurrect Target",
      invitedBy: new mongoose.Types.ObjectId(),
      orgName: "PharmaHub",
      tokenHash: hashToken(rawToken),
      expiresAt: future(),
      status: "accepted",
    });
    const member = await User.create({
      name: "Resurrect Target",
      email: memberEmail,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) =>
        bcrypt.hash("password123", 10),
      ),
      role: "Cashier",
      orgName: "PharmaHub",
      active: true,
      status: "active",
    });

    // The user is removed → the accepted invitation (its lifecycle record)
    // must be revoked, and BOTH the users list and the invitations list must
    // stop returning anything for this person.
    const del = await request(`/users/${member._id}`, { method: "DELETE", token: ownerToken });
    assert.equal(del.status, 200);

    const dbInv = await Invitation.findById(inv._id).lean();
    assert.equal(dbInv.status, "revoked", "accepted invitation must be revoked on user removal");

    const users = await request("/users", { token: ownerToken });
    assert.equal(
      (await users.json()).data.some((u) => u.email === memberEmail),
      false,
      "removed user must not appear in the users list",
    );
    const invs = await request("/users/invitations", { token: ownerToken });
    const invData = (await invs.json()).data;
    const resurrectable = (invData ?? []).some(
      (i) => i.email === memberEmail && ["pending", "accepted", "used"].includes(i.status),
    );
    assert.equal(
      resurrectable,
      false,
      "the removed member must not be resurrectable via the invitations list",
    );
  });

  test("an owner cannot remove a member of another organization", async () => {
    const ownerToken = await createOwner("isol-owner");
    const otherOrgUser = await User.create({
      name: "Other Org Member",
      email: `other-org-${Date.now()}@pharmahub.demo`,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) =>
        bcrypt.hash("password123", 10),
      ),
      role: "Pharmacist",
      orgName: "OtherOrg",
      active: true,
      status: "active",
    });

    const del = await request(`/users/${otherOrgUser._id}`, { method: "DELETE", token: ownerToken });
    assert.equal(del.status, 403, "cross-organization removal must be rejected");

    const dbUser = await User.findById(otherOrgUser._id).lean();
    assert.equal(dbUser.status, "active", "the other-org member must remain untouched");
  });

  test("an Owner-role member cannot be removed through the staff-removal flow", async () => {
    const ownerToken = await createOwner("owner-guard");
    const coOwner = await User.create({
      name: "Co Owner",
      email: `co-owner-${Date.now()}@pharmahub.demo`,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) =>
        bcrypt.hash("password123", 10),
      ),
      role: "Owner",
      orgName: "PharmaHub",
      active: true,
      status: "active",
    });

    const del = await request(`/users/${coOwner._id}`, { method: "DELETE", token: ownerToken });
    assert.equal(del.status, 403, "removing an Owner-role member must be rejected");

    const dbCo = await User.findById(coOwner._id).lean();
    assert.equal(dbCo.status, "active", "the Owner must remain untouched");
  });

  test("removing a pending invitee revokes the invitation and blocks acceptance", async () => {
    const ownerToken = await createOwner("pending-remove");
    const me = await request("/users/me", { token: ownerToken });
    const ownerId = (await me.json()).data.id;
    const inviteeEmail = `pending-remove-${Date.now()}@pharmahub.demo`;
    const rawToken = crypto.randomBytes(32).toString("hex");
    const inv = await Invitation.create({
      email: inviteeEmail,
      role: "Store Keeper",
      name: "Harsha Vardhan Rapaka",
      invitedBy: ownerId,
      orgName: "PharmaHub",
      tokenHash: hashToken(rawToken),
      expiresAt: future(),
      status: "pending",
    });

    const del = await request(`/users/${inv._id}`, { method: "DELETE", token: ownerToken });
    assert.equal(del.status, 200, "removing a pending invitee must succeed");

    const dbInv = await Invitation.findById(inv._id).lean();
    assert.equal(dbInv.status, "revoked", "the pending invitation must be revoked");

    const accept = await request("/users/invitations/accept", {
      method: "POST",
      body: { token: rawToken, name: "Harsha", password: "password123" },
    });
    assert.equal(accept.status, 400, "the revoked invitation link must be rejected");

    const invs = await request("/users/invitations", { token: ownerToken });
    const rows = (await invs.json()).data ?? [];
    assert.equal(
      rows.some((i) => i.email === inviteeEmail && i.status === "pending"),
      false,
      "the removed invitee must not appear as a pending invitation row",
    );
  });

  test("re-inviting a removed user works and acceptance reactivates the same account", async () => {
    const ownerToken = await createOwner("reinvite-owner");
    const memberEmail = `reinv-${Date.now()}@pharmahub.demo`;
    const member = await User.create({
      name: "Reinvite Target",
      email: memberEmail,
      passwordHash: await import("bcryptjs").then(({ default: bcrypt }) =>
        bcrypt.hash("password123", 10),
      ),
      role: "Pharmacist",
      orgName: "PharmaHub",
      active: true,
      status: "active",
    });

    const del = await request(`/users/${member._id}`, { method: "DELETE", token: ownerToken });
    assert.equal(del.status, 200);

    const invite = await request("/users/invite", {
      method: "POST",
      token: ownerToken,
      body: { name: "Reinvited", email: memberEmail, role: "Pharmacist" },
    });
    assert.equal(invite.status, 201, "a removed user must be re-invitable instead of conflicting");

    const dbInv = await Invitation.findOne({ email: memberEmail, status: "pending" })
      .select("+tokenHash")
      .lean();
    assert.ok(dbInv, "re-invite must create a fresh pending invitation");

    const rawToken = crypto.randomBytes(32).toString("hex");
    await Invitation.updateOne({ _id: dbInv._id }, { tokenHash: hashToken(rawToken) });

    const accept = await request("/users/invitations/accept", {
      method: "POST",
      body: { token: rawToken, name: "Reinvited", password: "newpassword123" },
    });
    assert.equal(accept.status, 201);

    const users = await User.find({ email: memberEmail });
    assert.equal(users.length, 1, "re-acceptance must not create a duplicate account");
    assert.equal(users[0].status, "active");
    assert.equal(users[0].active, true);

    const login = await request("/auth/login", {
      method: "POST",
      body: { email: memberEmail, password: "newpassword123" },
    });
    assert.equal(login.status, 200, "a reactivated user must be able to sign in");
  });

  // ── Profile image (persistent storage) ──────────────────────────────────────
  const PNG_1x1 = Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489" +
      "0000000d49444154789c6360000002000154a24f770000000049454e44ae426082",
    "hex",
  );
  const avatarForm = (blob, name) => {
    const form = new FormData();
    form.append("file", blob, name);
    return form;
  };
  const avatarUrlFrom = async (token) => {
    const me = await request("/users/me", { token });
    return (await me.json()).data.avatarUrl;
  };
  const localPath = (avatarUrl) =>
    path.join(uploadsDir, avatarUrl.replace(/^\/uploads\//, ""));

  test("profile image upload persists a file + permanent URL and /users/me returns it", async () => {
    const ownerToken = await createOwner("avatar-owner");
    const res = await request("/users/me/avatar", {
      method: "PUT",
      token: ownerToken,
      body: avatarForm(new Blob([PNG_1x1], { type: "image/png" }), "avatar.png"),
    });
    assert.equal(res.status, 200, "valid PNG upload must succeed");
    const avatarUrl = (await res.json()).data.user.avatarUrl;
    assert.match(avatarUrl, /^\/uploads\/profile\/[0-9a-f-]+\.png$/, "permanent relative URL");

    const file = localPath(avatarUrl);
    assert.equal(fs.existsSync(file), true, "file must exist on disk");
    assert.equal(fs.readFileSync(file).length, PNG_1x1.length);

    const served = await fetch(`${base}${avatarUrl}`);
    assert.equal(served.status, 200, "stored file must be served over /uploads");

    assert.equal(await avatarUrlFrom(ownerToken), avatarUrl, "GET /users/me must return the URL");

    fs.rmSync(file, { force: true });
  });

  test("re-uploading a profile image replaces the previous stored file", async () => {
    const ownerToken = await createOwner("avatar-owner2");
    const first = await request("/users/me/avatar", {
      method: "PUT",
      token: ownerToken,
      body: avatarForm(new Blob([PNG_1x1], { type: "image/png" }), "one.png"),
    });
    const firstUrl = (await first.json()).data.user.avatarUrl;

    const second = await request("/users/me/avatar", {
      method: "PUT",
      token: ownerToken,
      body: avatarForm(new Blob([PNG_1x1], { type: "image/png" }), "two.png"),
    });
    const secondUrl = (await second.json()).data.user.avatarUrl;
    assert.notEqual(secondUrl, firstUrl, "each upload must produce a new file");
    assert.equal(fs.existsSync(localPath(firstUrl)), false, "previous file must be deleted");
    assert.equal(fs.existsSync(localPath(secondUrl)), true, "new file must exist");

    fs.rmSync(localPath(secondUrl), { force: true });
  });

  test("removing the profile image clears the reference and deletes the file", async () => {
    const ownerToken = await createOwner("avatar-owner3");
    const up = await request("/users/me/avatar", {
      method: "PUT",
      token: ownerToken,
      body: avatarForm(new Blob([PNG_1x1], { type: "image/png" }), "avatar.png"),
    });
    const avatarUrl = (await up.json()).data.user.avatarUrl;

    const del = await request("/users/me/avatar", { method: "DELETE", token: ownerToken });
    assert.equal(del.status, 200);
    assert.equal((await del.json()).data.user.avatarUrl, null);
    assert.equal(fs.existsSync(localPath(avatarUrl)), false, "stored file must be deleted");
    assert.equal(await avatarUrlFrom(ownerToken), null, "/users/me must show the default");
  });

  test("avatar upload rejects unsupported types and oversized files", async () => {
    const ownerToken = await createOwner("avatar-owner4");
    const bad = await request("/users/me/avatar", {
      method: "PUT",
      token: ownerToken,
      body: avatarForm(new Blob(["not an image"], { type: "text/plain" }), "notes.txt"),
    });
    assert.equal(bad.status, 400, "non-image MIME must be rejected");

    const oversized = await request("/users/me/avatar", {
      method: "PUT",
      token: ownerToken,
      body: avatarForm(
        new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: "image/png" }),
        "big.png",
      ),
    });
    assert.equal(oversized.status, 400, ">5 MB file must be rejected");
    assert.equal(await avatarUrlFrom(ownerToken), null, "no avatar may be stored");
  });

  test("profile JSON updates can never set an avatar URL directly", async () => {
    const ownerToken = await createOwner("avatar-owner5");
    const res = await request("/users/me/profile", {
      method: "PUT",
      token: ownerToken,
      body: { name: "No Avatar via JSON", avatarUrl: "http://evil.example/x.png" },
    });
    assert.equal(res.status, 200);
    assert.equal(await avatarUrlFrom(ownerToken), null, "avatarUrl must be ignored in JSON");
  });
});
