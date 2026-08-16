import { getDb, toClientDoc } from "./_lib/mongo.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(dateIso, now = Date.now()) {
  const t = new Date(dateIso).getTime();
  return Math.round((t - now) / DAY_MS);
}

function expiryBucket(days) {
  if (days < 0) return "expired";
  if (days === 0) return "today";
  if (days <= 3) return "critical";
  if (days <= 30) return "warning";
  return "healthy";
}

export default async function handler(req, res) {
  console.log(`[Expiry API] ${req.method} /api/expiry`);

  try {
    const db = await getDb();
    console.log("[Expiry API] Connected to MongoDB ✓");

    const batchCol = db.collection("batches");
    const medCol = db.collection("medicines");
    const catCol = db.collection("categories");
    const mfrCol = db.collection("manufacturers");
    const supCol = db.collection("suppliers");

    if (req.method === "GET") {
      const { window: winPreset, from, to, status, category, manufacturer, search } = req.query ?? {};
      const now = Date.now();

      console.log("[Expiry API] Query params:", { winPreset, from, to, status, category, manufacturer, search });

      // Build batch filter — exclude disposed batches, require stock > 0
      const batchFilter = {
        $or: [
          { status: { $ne: "disposed" } },
          { "status.state": { $ne: "DISPOSED" } },
        ],
        $and: [
          {
            $or: [
              { currentStock: { $gt: 0 } },
              { "stock.quantityOnHand": { $gt: 0 } },
            ],
          },
        ],
      };

      if (category) {
        console.log(`[Expiry API] Filtering by category: ${category}`);
        batchFilter.categoryId = category;
      }
      if (manufacturer) {
        console.log(`[Expiry API] Filtering by manufacturer: ${manufacturer}`);
        batchFilter.manufacturerId = manufacturer;
      }

      // Fetch all supporting lookup data in parallel
      console.log("[Expiry API] Fetching batches, medicines, categories, manufacturers, suppliers in parallel...");
      const [batchDocs, medDocs, catDocs, mfrDocs, supDocs] = await Promise.all([
        batchCol.find(batchFilter).sort({ expiryDate: 1 }).toArray(),
        medCol.find({}).toArray(),
        catCol.find({}).toArray(),
        mfrCol.find({}).toArray(),
        supCol.find({}).toArray(),
      ]);

      console.log(`[Expiry API] Fetched: ${batchDocs.length} batches, ${medDocs.length} medicines, ${catDocs.length} categories, ${mfrDocs.length} manufacturers, ${supDocs.length} suppliers`);

      // Build lookup maps
      const medById = new Map(medDocs.map((m) => [String(m._id), m]));
      const catById = new Map(catDocs.map((c) => [String(c._id), c.name]));
      const mfrById = new Map(mfrDocs.map((m) => [String(m._id), m.name]));
      const supById = new Map(supDocs.map((s) => [String(s._id), s.name]));

      // Normalise batch documents — support both flat & nested Mongo schemas
      const batches = batchDocs.map((b) => {
        const expiryDate = b.expiryDate ?? b.dates?.expiryDate ?? null;
        const currentStock = b.currentStock ?? b.stock?.quantityOnHand ?? 0;
        const purchasePrice = b.purchasePrice ?? b.pricing?.purchasePrice ?? 0;
        const medicineId = b.medicineId ? String(b.medicineId) : null;
        const supplierId = b.supplierId ? String(b.supplierId) : null;
        const med = medById.get(medicineId);

        return {
          ...toClientDoc(b),
          expiryDate,
          currentStock,
          purchasePrice,
          medicineId,
          supplierId,
          medicineName: med?.name ?? "—",
          salt: med?.genericName ?? "—",
          manufacturer: mfrById.get(String(med?.manufacturerId ?? "")) ?? "—",
          category: catById.get(String(med?.categoryId ?? "")) ?? "—",
          supplier: supById.get(supplierId ?? "") ?? "—",
        };
      });

      // Filter by expiry window
      let rows = batches.filter((b) => {
        if (!b.expiryDate) return false;
        const d = daysUntil(b.expiryDate, now);
        if (from && to) {
          const t = new Date(b.expiryDate).getTime();
          return t >= new Date(from).getTime() && t <= new Date(to).getTime() + DAY_MS;
        }
        const days = parseInt(winPreset, 10);
        if (winPreset === "today") return d === 0;
        if (!isNaN(days)) return d > 0 && d <= days;
        // Default: show next 30 days + expired
        return d <= 30;
      });

      // Filter by status
      if (status && status !== "all") {
        const RETURN_WINDOW = 30;
        rows = rows.filter((b) => {
          const d = daysUntil(b.expiryDate, now);
          switch (status) {
            case "expired": return d < 0;
            case "today": return d === 0;
            case "critical": return d > 0 && d <= 3;
            case "warning": return d > 3 && d <= 30;
            case "return": return d >= -RETURN_WINDOW && d <= RETURN_WINDOW;
            default: return true;
          }
        });
      }

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter((b) =>
          [b.medicineName, b.salt, b.batchNumber, b.manufacturer, b.supplier].some(
            (s) => s && s.toLowerCase().includes(q)
          )
        );
        console.log(`[Expiry API] After search "${search}": ${rows.length} rows`);
      }

      // Annotate each row with days + bucket
      const enriched = rows.map((b) => {
        const days = daysUntil(b.expiryDate, now);
        return {
          ...b,
          days,
          bucket: expiryBucket(days),
          stockValue: b.currentStock * b.purchasePrice,
        };
      });

      // Compute aggregate metrics for the Overview tab
      const metrics = computeMetrics(batches, now);

      console.log(`[Expiry API] Returning ${enriched.length} enriched rows`);
      console.log("[Expiry API] Metrics summary:", {
        expiredCount: metrics.expiredCount,
        todayCount: metrics.todayCount,
        d30Count: metrics.d30Count,
        riskScore: metrics.riskScore,
      });

      return res.status(200).json({
        success: true,
        data: {
          rows: enriched,
          metrics,
          meta: {
            totalBatches: batchDocs.length,
            filteredRows: enriched.length,
            fetchedAt: new Date().toISOString(),
          },
        },
      });
    }

    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("[Expiry API] ❌ Error:", err.message, err.stack);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── Aggregate metrics (mirrors expiry.js computeMetrics) ────────────────────
function computeMetrics(batches, now) {
  const DAY = 24 * 60 * 60 * 1000;
  const RETURN_WINDOW = 30;

  let expiredCount = 0, expiredValue = 0;
  let todayCount = 0, todayValue = 0;
  let d3Count = 0, d3Value = 0;
  let d7Count = 0, d7Value = 0;
  let d30Count = 0, d30Value = 0;
  let returnEligibleCount = 0, returnEligibleValue = 0;
  let nearCount = 0, nearValue = 0;

  for (const b of batches) {
    const expiryDate = b.expiryDate;
    if (!expiryDate) continue;
    const currentStock = b.currentStock ?? 0;
    const purchasePrice = b.purchasePrice ?? 0;
    const v = currentStock * purchasePrice;
    const d = Math.round((new Date(expiryDate).getTime() - now) / DAY);

    if (d < 0) {
      expiredCount++;
      expiredValue += v;
      if (d >= -RETURN_WINDOW) { returnEligibleCount++; returnEligibleValue += v; }
      continue;
    }
    if (d === 0) { todayCount++; todayValue += v; returnEligibleCount++; returnEligibleValue += v; continue; }
    if (d <= 3) { d3Count++; d3Value += v; }
    if (d <= 7) { d7Count++; d7Value += v; }
    if (d <= 30) {
      d30Count++; d30Value += v;
      nearCount++; nearValue += v;
      if (d <= RETURN_WINDOW) { returnEligibleCount++; returnEligibleValue += v; }
    }
  }

  const LOSS_RATIO = 0.35;
  const lossProjection = Math.round(expiredValue + d30Value * LOSS_RATIO);
  const score =
    (expiredValue / 800) * 15 +
    (nearValue / 8000) * 30 +
    expiredCount * 1.5 +
    todayCount * 2 +
    Math.min(d30Count, 8) * 1;
  const riskScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    expiredCount, expiredValue: Math.round(expiredValue),
    todayCount, todayValue: Math.round(todayValue),
    d3Count, d3Value: Math.round(d3Value),
    d7Count, d7Value: Math.round(d7Value),
    d30Count, d30Value: Math.round(d30Value),
    nearCount, nearValue: Math.round(nearValue),
    returnEligibleCount, returnEligibleValue: Math.round(returnEligibleValue),
    lossProjection, riskScore,
  };
}
