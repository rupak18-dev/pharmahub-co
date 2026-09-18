import { Schema, model } from "mongoose";

const integrationSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    // Backend connection state. `connected` means the integration is active in
    // PharmaHub (e.g. a validated WhatsApp number is stored); `configured`
    // means safe settings were saved but the provider was not verified.
    connected: { type: Boolean, default: false },
    configured: { type: Boolean, default: false },
    // Safe, non-secret configuration only (e.g. `{ phone: "+919876543210" }`).
    // Secret/credential fields are stripped on write and never persisted.
    config: { type: Schema.Types.Mixed, default: {} },
    // OAuth credentials for providers that need them (Gmail).
    // `select: false` keeps them out of ordinary queries and lean docs, so
    // tokens can never leak through the API. Backend-only.
    // Shape: { accessToken, refreshToken, tokenExpiresAt, scope }.
    credentials: { type: Schema.Types.Mixed, default: null, select: false },
    // Connected provider account identity (non-secret — safe to display).
    accountEmail: { type: String, default: null, trim: true },
    providerAccountId: { type: String, default: null, trim: true },
    connectedAt: { type: Date, default: null },
    disconnectedAt: { type: Date, default: null },
    lastSync: { type: Date, default: null },
    lastError: { type: String, default: null },
    // Org isolation follows the existing app model (denormalized orgName).
    orgName: { type: String, trim: true, index: true },
    // The actual tenant scope for uniqueness/queries: orgName when the user
    // belongs to an organization, otherwise the user's own id so org-less
    // users never share records.
    tenantId: { type: String, trim: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true },
);

// One integration per provider per tenant.
integrationSchema.index({ tenantId: 1, key: 1 }, { unique: true });
integrationSchema.index({ orgName: 1, key: 1 });
integrationSchema.index({ createdBy: 1, key: 1 });

export const Integration = model("Integration", integrationSchema);
