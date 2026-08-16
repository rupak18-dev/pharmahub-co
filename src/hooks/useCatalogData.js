import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function useCatalogData() {
  const [data, setData] = useState({
    medicines: [],
    categories: [],
    manufacturers: [],
    suppliers: [],
    batches: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [medRes, catRes, mfrRes, supRes, batchRes] = await Promise.all([
        api.get("/medicines?limit=1000").catch((err) => {
          console.error("Med error:", err);
          return { data: [] };
        }),
        api.get("/categories?limit=100").catch((err) => {
          console.error("Cat error:", err);
          return { data: [] };
        }),
        api.get("/manufacturers?limit=100").catch((err) => {
          console.error("Mfr error:", err);
          return { data: [] };
        }),
        api.get("/suppliers?limit=100").catch((err) => {
          console.error("Sup error:", err);
          return { data: [] };
        }),
        api.get("/batches?limit=1000").catch((err) => {
          console.error("Batch error:", err);
          return { data: [] };
        }),
      ]);

      console.log("API Responses ->", { medRes, catRes, mfrRes, supRes, batchRes });

      const mapId = (item) => ({ ...item, id: item._id });

      setData({
        medicines: (medRes.data || []).map(mapId),
        categories: (catRes.data || []).map(mapId),
        manufacturers: (mfrRes.data || []).map(mapId),
        suppliers: (supRes.data || []).map(mapId),
        batches: (batchRes.data || []).map(mapId),
      });
    } catch (err) {
      console.error("Failed to fetch catalog data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addMedicine = async (medicineData) => {
    const res = await api.post("/medicines", medicineData);
    if (res && res.success) {
      await fetchAll();
      return res.data;
    }
  };

  const updateMedicine = async (id, updateData) => {
    const res = await api.patch(`/medicines/${id}`, updateData);
    if (res && res.success) {
      await fetchAll();
      return res.data;
    }
  };

  const deactivateMedicine = async (id) => {
    const res = await api.delete(`/medicines/${id}`);
    await fetchAll();
    return res;
  };

  return {
    ...data,
    loading,
    refetch: fetchAll,
    addMedicine,
    updateMedicine,
    deactivateMedicine,
  };
}
