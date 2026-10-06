/**
 * useExpiryApi — MongoDB-backed Expiry data hook
 *
 * Fetches live expiry data from the /api/expiry endpoint (which reads from
 * MongoDB) and exposes action helpers for dispose, return, discount, and
 * transfer.  Falls back gracefully to the local mock-db when the API is not
 * reachable (e.g. MONGODB_URI not set locally).
 */
import { useCallback, useEffect, useRef, useState } from "react";

const BASE = "/api/expiry";

async function apiFetch(url, opts = {}) {
  console.log(`[useExpiryApi] → ${opts.method ?? "GET"} ${url}`);
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
    ...opts,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error ?? `Request failed (${res.status})`;
    console.error(`[useExpiryApi] ❌ ${res.status} ${msg}`);
    throw new Error(msg);
  }
  console.log(`[useExpiryApi] ← ${res.status} OK`, json?.data?.meta ?? "");
  return json;
}

/**
 * Fetches the full expiry dataset from MongoDB.
 *
 * @param {object} filters — { window, from, to, status, category, manufacturer, search }
 * @returns {{ rows, metrics, meta, loading, error, refresh }}
 */
export function useExpiryApi(filters = {}) {
  const [state, setState] = useState({ rows: null, metrics: null, meta: null, loading: false, error: null });
  const abortRef = useRef(null);

  const fetch = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (filters.window) params.set("window", filters.window);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      if (filters.category && filters.category !== "all") params.set("category", filters.category);
      if (filters.manufacturer && filters.manufacturer !== "all") params.set("manufacturer", filters.manufacturer);
      if (filters.search) params.set("search", filters.search);

      const url = `${BASE}?${params.toString()}`;
      console.log("[useExpiryApi] Fetching expiry data from MongoDB:", url);

      const json = await apiFetch(url, { signal: ctrl.signal });

      if (ctrl.signal.aborted) return;

      console.log("[useExpiryApi] ✅ Data received:", {
        rows: json.data?.rows?.length,
        riskScore: json.data?.metrics?.riskScore,
        fetchedAt: json.data?.meta?.fetchedAt,
      });

      setState({ rows: json.data.rows, metrics: json.data.metrics, meta: json.data.meta, loading: false, error: null });
    } catch (err) {
      if (err.name === "AbortError") return;
      console.warn("[useExpiryApi] API unreachable — falling back to mock-db", err.message);
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, [
    filters.window,
    filters.from,
    filters.to,
    filters.status,
    filters.category,
    filters.manufacturer,
    filters.search,
  ]);

  useEffect(() => {
    fetch();
    return () => abortRef.current?.abort();
  }, [fetch]);

  return { ...state, refresh: fetch };
}

/**
 * Perform a batch-level expiry action against MongoDB.
 *
 * @param {string} batchId
 * @param {{ action, qty, reason, creditNoteNo, discountPct, targetBranch, targetBatchId, notes, userId }} payload
 */
export async function expiryAction(batchId, payload) {
  console.log(`[useExpiryApi] expiryAction → batchId=${batchId}`, payload);
  const json = await apiFetch(`${BASE}/${batchId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  console.log(`[useExpiryApi] expiryAction ✅ action="${payload.action}" completed`);
  return json;
}

/**
 * Dispose (write-off) a batch.
 */
export async function disposeExpiredBatch({ batchId, qty, reason, userId }) {
  console.log(`[useExpiryApi] dispose batchId=${batchId} qty=${qty}`);
  return expiryAction(batchId, { action: "dispose", qty, reason, userId });
}

/**
 * Return a batch to the supplier.
 */
export async function returnExpiredBatch({ batchId, qty, reason, creditNoteNo, userId }) {
  console.log(`[useExpiryApi] return batchId=${batchId} qty=${qty} creditNote=${creditNoteNo}`);
  return expiryAction(batchId, { action: "return", qty, reason, creditNoteNo, userId });
}

/**
 * Apply a percentage discount to a near-expiry batch.
 */
export async function applyExpiryDiscount({ batchId, discountPct, notes, userId }) {
  console.log(`[useExpiryApi] discount batchId=${batchId} pct=${discountPct}%`);
  return expiryAction(batchId, { action: "discount", discountPct, notes, userId });
}

/**
 * Transfer stock from one batch / branch to another.
 */
export async function transferExpiredBatch({ batchId, qty, targetBranch, targetBatchId, notes, userId }) {
  console.log(`[useExpiryApi] transfer batchId=${batchId} qty=${qty} → ${targetBranch}`);
  return expiryAction(batchId, { action: "transfer", qty, targetBranch, targetBatchId, notes, userId });
}
