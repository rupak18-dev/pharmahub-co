import { asyncHandler } from "../core/asyncHandler.js";
import { ApiError } from "../core/ApiError.js";
import { ok, created } from "../core/responses.js";
import { buildPagination, paginationMeta } from "../utils/pagination.js";
import { Ticket } from "../models/Ticket.js";
import { recordAudit } from "../services/audit.service.js";

function generateTicketId() {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `PH-TKT-${year}-${randomDigits}`;
}

export const createTicket = asyncHandler(async (req, res) => {
  const {
    title,
    issueType,
    description,
    severity = "medium",
    screenshot = null,
    userEmail,
    userName,
  } = req.body;

  if (!title || !title.trim()) {
    throw ApiError.badRequest("Issue title is required");
  }
  if (!issueType || !issueType.trim()) {
    throw ApiError.badRequest("Issue type is required");
  }
  if (!description || !description.trim()) {
    throw ApiError.badRequest("Issue description is required");
  }

  // Generate a unique ticket ID
  let ticketId = generateTicketId();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await Ticket.findOne({ ticketId });
    if (!existing) break;
    ticketId = generateTicketId();
    attempts++;
  }

  const reporterName =
    req.user?.name || userName?.trim() || "PharmaHub User";
  const reporterEmail =
    req.user?.email || userEmail?.trim() || "";
  const reporterRole = req.user?.role || "Staff";
  const orgName = req.user?.orgName || "PharmaHub Pharmacy";

  const ticket = await Ticket.create({
    ticketId,
    title: title.trim(),
    issueType: issueType.trim(),
    description: description.trim(),
    severity: ["low", "medium", "high", "critical"].includes(severity)
      ? severity
      : "medium",
    screenshot,
    status: "open",
    userId: req.user?._id ?? null,
    userName: reporterName,
    userEmail: reporterEmail,
    userRole: reporterRole,
    orgName,
  });

  recordAudit({
    userId: req.user?._id,
    userName: reporterName,
    action: `Support ticket raised: ${ticketId}`,
    entityType: "ticket",
    entityId: ticket._id,
    details: { ticketId, title: ticket.title, severity: ticket.severity },
    ip: req.ip,
  });

  return created(res, ticket, "Ticket has been raised successfully");
});

export const listTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { status, severity, issueType, search } = req.query;

  const filter = {};

  // If user is not admin/owner, filter by their userId or email if authenticated
  const isElevated =
    req.user?.role === "Owner" || req.user?.role === "Admin";
  if (!isElevated && req.user?._id) {
    filter.$or = [
      { userId: req.user._id },
      { userEmail: req.user.email },
    ];
  }

  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (issueType) filter.issueType = issueType;
  if (search) {
    filter.$or = [
      { ticketId: { $regex: search, $options: "i" } },
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  return ok(res, items, "Tickets list", paginationMeta(total, { page, limit }));
});

export const getTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await Ticket.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }],
  }).lean();

  if (!ticket) {
    throw ApiError.notFound("Ticket not found");
  }

  return ok(res, ticket);
});
