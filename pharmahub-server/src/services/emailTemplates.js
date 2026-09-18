// Pure email builders. Each returns { subject, html, text } so the mailer can
// send a rich HTML version with a plain-text fallback. Raw invitation/reset
// tokens are baked into the link here and never logged or stored.

function wrap({ subject, heading, htmlBody, textBody }) {
  const html = `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width:520px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e8eb;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:20px 28px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">PharmaHub</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    <h1 style="margin:0 0 10px;font-size:20px;color:#111827;line-height:1.3;">${heading}</h1>
                    ${htmlBody}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 28px 22px;border-top:1px solid #eef0f2;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                      You received this email because you were invited to or registered with PharmaHub.
                      If this wasn't you, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`;

  return {
    subject,
    html,
    text: `PharmaHub\n\n${heading}\n\n${textBody}`,
  };
}

function actionButton(label, link) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;">
      <tr>
        <td>
          <a href="${link}" style="display:inline-block;padding:12px 26px;background:#2563eb;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

export function buildInvitationEmail({ name, orgName, role, link, expiresInHours, message, email }) {
  const greeting = name?.trim() ? `Hello ${name.trim()},` : "Hello,";
  const org = orgName?.trim() || "your organization";
  const invitee = email?.trim() || "";
  const personalMessage = message?.trim()
    ? `<p style="margin:14px 0 0;padding:12px 14px;border-left:3px solid #2563eb;background:#f5f8ff;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">"${escapeHtml(message.trim())}"</p>`
    : "";

  return wrap({
    subject: `${org} added you as ${role} on PharmaHub`,
    heading: `You've been added to ${org}`,
    htmlBody: `
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        <strong>${escapeHtml(org)}</strong> has added you to PharmaHub with the role of <strong>${role}</strong>.
      </p>
      ${personalMessage}
      <p style="margin:16px 0 4px;font-size:15px;color:#374151;line-height:1.6;">
        Click the button below to set up your account and get started.
      </p>
      ${actionButton("Set Up My Account", link)}
      <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;line-height:1.6;">
        This link was sent to:<br/>
        ${escapeHtml(invitee)}
      </p>
      <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;line-height:1.6;">
        This link expires in ${expiresInHours} hours and can only be used once.
      </p>
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
        If you were not expecting this, you can safely ignore this email.
      </p>`,
    textBody: `${greeting}

${org} has added you to PharmaHub with the role of ${role}.
${message?.trim() ? `\nMessage from your team:\n"${message.trim()}"\n` : ""}
Set up your account using the link below:
${link}

This link was sent to:
${invitee}

This link expires in ${expiresInHours} hours and can only be used once.

If you were not expecting this, you can safely ignore this email.

Regards,
${org} via PharmaHub`,
  });
}

const ROLE_CHANGE_MODULE_LABELS = {
  dashboard: "Dashboard",
  medicines: "Medicines",
  batches: "Batches",
  inventory: "Inventory",
  purchases: "Purchases",
  sales: "Sales & POS",
  expiry: "Expiry",
  audit: "Stock Audit",
  users: "Users & Roles",
  reports: "Reports",
  notifications: "Notifications",
  ai: "AI Insights",
  admin: "System Admin",
  integrations: "Integrations",
};

const ROLE_CHANGE_ACTION_LABELS = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  approve: "Approve",
  export: "Export",
};

// Reduce an effective permission matrix (module -> { action: boolean }) to a
// readable, sorted list of module rows with their enabled capabilities. Rows
// with no enabled action are omitted so the email only shows real access.
function formatEffectivePermissions(permissions) {
  const rows = [];
  for (const [mod, actions] of Object.entries(permissions ?? {})) {
    if (!actions || typeof actions !== "object") continue;
    const enabled = Object.entries(actions)
      .filter(([, value]) => value === true)
      .map(([action]) => ROLE_CHANGE_ACTION_LABELS[action] ?? action);
    if (enabled.length === 0) continue;
    rows.push({ module: ROLE_CHANGE_MODULE_LABELS[mod] ?? mod, actions: enabled });
  }
  rows.sort((a, b) => a.module.localeCompare(b.module));
  return rows;
}

// Render an access section (caption + module/capability table) in HTML.
function accessSectionHtml(caption, rows) {
  return `
      <p style="margin:16px 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">${caption}</p>
      ${
        rows.length > 0
          ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #e6e8eb;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:10px 14px;background:#f9fafb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Module</td>
          <td style="padding:10px 14px;background:#f9fafb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Capabilities</td>
        </tr>
        ${rows
          .map(
            (r) => `
        <tr>
          <td style="padding:10px 14px;border-top:1px solid #eef0f2;font-size:14px;color:#111827;">${escapeHtml(r.module)}</td>
          <td style="padding:10px 14px;border-top:1px solid #eef0f2;font-size:13px;color:#374151;">${escapeHtml(r.actions.join(", "))}</td>
        </tr>`,
          )
          .join("")}
      </table>`
          : `<p style="margin:0 0 14px;font-size:14px;color:#9ca3af;">No modules granted.</p>`
      }`;
}

function accessSectionText(caption, rows) {
  return `${caption}:\n${
    rows.length > 0 ? rows.map((r) => `- ${r.module}: ${r.actions.join(", ")}`).join("\n") : "- No modules granted."
  }`;
}

// Sent to the affected user whenever an Owner/Admin changes their role and/or
// access (modules/permissions/features/department). Built from the real
// previous/new role (when a role change is the trigger) and the user's
// effective permission matrix AFTER the change, so the notification always
// matches what the backend enforces.
//
// `kind` selects the wording and subject:
//   "role"   → role-only change        → "Your PharmaHub role has been updated"
//   "access" → access-only change      → "Your PharmaHub access has been updated"
//   "both"   → role + access together  → "Your PharmaHub role and access have been updated"
// When omitted it is inferred from whether previousRole/newRole are supplied
// and differ. previousRole/newRole are only rendered for role/both emails;
// newRole is also shown in access emails so the member knows what role the
// new permissions apply to. previousPermissions is only rendered for "both".
export function buildRoleChangeEmail({
  name,
  orgName,
  previousRole,
  newRole,
  permissions,
  previousPermissions,
  changedBy,
  kind,
}) {
  const greeting = name?.trim() ? `Hello ${name.trim()},` : "Hello,";
  const org = orgName?.trim() || "PharmaHub";
  const roleChanged = Boolean(previousRole && newRole && previousRole !== newRole);
  const effectiveKind = kind ?? (roleChanged ? "role" : "access");

  const subject =
    effectiveKind === "both"
      ? "Your PharmaHub role and access have been updated"
      : effectiveKind === "role"
        ? "Your PharmaHub role has been updated"
        : "Your PharmaHub access has been updated";
  const heading =
    effectiveKind === "both"
      ? "Your role and access have been updated"
      : effectiveKind === "role"
        ? "Your role has been updated"
        : "Your access has been updated";

  const rows = formatEffectivePermissions(permissions);
  const prevRows = formatEffectivePermissions(previousPermissions);

  const changedByName = changedBy?.trim() ? ` by <strong>${escapeHtml(changedBy.trim())}</strong>` : " by an administrator";
  const changedByNameText = changedBy?.trim() ? ` by ${changedBy.trim()}` : " by an administrator";

  const p = (inner) => `    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${inner}</p>\n`;
  let leadHtml;
  let leadText;
  if (effectiveKind === "role") {
    leadHtml = `${p(`Your role in <strong>${escapeHtml(org)}</strong> has been updated${changedByName}.`)}
      ${p(`Previous role: <strong>${escapeHtml(previousRole)}</strong><br/>
        New role: <strong>${escapeHtml(newRole)}</strong>`)}
      ${p("Your access permissions may also have been updated.")}`;
    leadText = `Your role in ${org} has been updated${changedByNameText}.

Previous role: ${previousRole}
New role: ${newRole}

Your access permissions may also have been updated.`;
  } else if (effectiveKind === "both") {
    leadHtml = `${p(`Your PharmaHub role and access have been updated${changedByName}.`)}
      ${p(`Previous role: <strong>${escapeHtml(previousRole)}</strong><br/>
        New role: <strong>${escapeHtml(newRole)}</strong>`)}`;
    leadText = `Your PharmaHub role and access have been updated${changedByNameText}.

Previous role: ${previousRole}
New role: ${newRole}`;
  } else {
    leadHtml = `${p(`Your access settings in <strong>${escapeHtml(org)}</strong> have been updated${changedByName}.`)}
      ${newRole ? p(`Your role: <strong>${escapeHtml(newRole)}</strong>`) : ""}
      ${p("Your assigned modules and permissions have been changed.")}`;
    leadText = `Your access settings in ${org} have been updated${changedByNameText}.
${newRole ? `\nYour role: ${newRole}\n` : ""}
Your assigned modules and permissions have been changed.`;
  }

  const reloginLine =
    effectiveKind === "access"
      ? "Please log in again to PharmaHub to apply your updated access."
      : "Please log in again to PharmaHub to apply your updated role and access.";

  const bothSections = `
      ${accessSectionHtml("Previous access", prevRows)}
      ${accessSectionHtml("New access", rows)}`;

  return wrap({
    subject,
    heading,
    htmlBody: `
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${greeting}</p>
      ${leadHtml}
      ${
        effectiveKind === "both"
          ? bothSections
          : `${accessSectionHtml("Your updated access", rows)}`
      }
      <p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.6;">
        ${reloginLine}
      </p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
        If you believe this was done in error, please contact your organization administrator.
      </p>`,
    textBody: `${greeting}

${leadText}

${
  effectiveKind === "both"
    ? `${accessSectionText("Previous access", prevRows)}

${accessSectionText("New access", rows)}`
    : accessSectionText("Your updated access", rows)
}

${reloginLine}
If you believe this was done in error, please contact your organization administrator.

Regards,
PharmaHub Team`,
  });
}

// Sent to the staff member AFTER a successful removal from the organization.
// Only ever triggered once the database removal has succeeded — a delivery
// failure never rolls back the removal.
export function buildStaffRemovalEmail({ name, orgName }) {
  const greeting = name?.trim() ? `Hello ${name.trim()},` : "Hello,";
  const org = orgName?.trim() || "your organization";

  return wrap({
    subject: "You are no longer a member of PharmaHub",
    heading: "Your staff access has been removed",
    htmlBody: `
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        Your access to <strong>${escapeHtml(org)}</strong> has been removed by an administrator.
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        You are no longer a member of this PharmaHub organization and can no longer access its staff account.
      </p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
        If you believe this was done by mistake, please contact your organization administrator.
      </p>`,
    textBody: `${greeting}

Your access to ${org} has been removed by an administrator.

You are no longer a member of this PharmaHub organization and can no longer access its staff account.

If you believe this was done by mistake, please contact your organization administrator.

Regards,
PharmaHub Team`,
  });
}

export function buildScheduledReportEmail({ reportName, orgName, periodLabel, generatedAt, rowCount }) {
  const org = orgName?.trim() || "your organization";
  const generated = generatedAt ? new Date(generatedAt).toLocaleString() : new Date().toLocaleString();
  const summaryLine =
    rowCount != null ? `${rowCount.toLocaleString()} row${rowCount === 1 ? "" : "s"} of data included.` : "";

  return wrap({
    subject: `PharmaHub — ${reportName || "Scheduled Report"}`,
    heading: "Your scheduled report is ready",
    htmlBody: `
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        The scheduled report <strong>${reportName || "Scheduled Report"}</strong> has been generated.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;border:1px solid #e6e8eb;border-radius:10px;overflow:hidden;">
        <tr><td style="padding:10px 14px;background:#f9fafb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Organization</td></tr>
        <tr><td style="padding:8px 14px;font-size:14px;color:#111827;">${org}</td></tr>
        <tr><td style="padding:10px 14px;background:#f9fafb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Report period</td></tr>
        <tr><td style="padding:8px 14px;font-size:14px;color:#111827;">${periodLabel || "—"}</td></tr>
        <tr><td style="padding:10px 14px;background:#f9fafb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Generated</td></tr>
        <tr><td style="padding:8px 14px;font-size:14px;color:#111827;">${generated}</td></tr>
      </table>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${summaryLine}</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
        The full report is attached to this email as a CSV file.
      </p>`,
    textBody: `Your scheduled report "${reportName || "Scheduled Report"}" has been generated.

Organization: ${org}
Report period: ${periodLabel || "—"}
Generated: ${generated}
${summaryLine ? `\n${summaryLine}\n` : ""}
The full report is attached to this email as a CSV file.`,
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildResetEmail({ name, link, expiresInMinutes }) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi,";

  return wrap({
    subject: "Reset your PharmaHub password",
    heading: "Reset your password",
    htmlBody: `
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${greeting}</p>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        We received a request to reset your PharmaHub password. If you made this request, use the
        button below to choose a new one:
      </p>
      ${actionButton("Reset Password", link)}
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
        This link expires in ${expiresInMinutes} minutes and can only be used once.
      </p>`,
    textBody: `${greeting}

We received a request to reset your PharmaHub password. Open this link within ${expiresInMinutes} minutes to choose a new one (one-time use):
${link}

If you didn't request a password reset, you can safely ignore this email — your password won't change.`,
  });
}
