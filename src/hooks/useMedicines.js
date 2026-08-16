import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function useMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/medicines?limit=1000"); // Fetch all for catalog
      console.log("Medicines API Response ->", res);
      if (res && res.success) {
        // Backend returns `{ success: true, data: [...], meta: ... }`
        // We map `_id` to `id` for frontend compatibility
        const mapped = (res.data || []).map((m) => ({
          ...m,
          id: m._id,
          categoryId: m.categoryId?._id || m.categoryId,
          manufacturerId: m.manufacturerId?._id || m.manufacturerId,
        }));
        setMedicines(mapped);
      }
    } catch (err) {
      console.error("Medicines fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const addMedicine = async (medicineData) => {
    const res = await api.post("/medicines", medicineData);
    if (res && res.success) {
      await fetchMedicines();
      return { ...res.data, id: res.data._id };
    }
  };

  const updateMedicine = async (id, updateData) => {
    const res = await api.patch(`/medicines/${id}`, updateData);
    if (res && res.success) {
      await fetchMedicines();
      return { ...res.data, id: res.data._id };
    }
  };

  const deactivateMedicine = async (id) => {
    const res = await api.delete(`/medicines/${id}`);
    await fetchMedicines();
    return res;
  };

  return {
    medicines,
    loading,
    error,
    refetch: fetchMedicines,
    addMedicine,
    updateMedicine,
    deactivateMedicine,
  };
}
