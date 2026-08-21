export function mapJobTitleToRole(jobTitle) {
  if (!jobTitle) return "Pharmacist";
  const t = jobTitle.trim().toLowerCase();
  if (t === "owner") return "Owner";
  if (t === "pharmacist") return "Pharmacist";
  if (t === "cashier") return "Cashier";
  if (t === "inventory manager" || t === "inventory officer") return "Inventory Manager";
  if (/admin|manager|head|chief|officer|executive|supervisor|operations/.test(t)) return "Admin";
  return "Pharmacist";
}
