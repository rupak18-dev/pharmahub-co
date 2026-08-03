import { useState, useEffect, useCallback } from "react";

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("medicine_wishlist_v2");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = useCallback((id: string) => {
    try {
      const stored = localStorage.getItem("medicine_wishlist_v2");
      const current: string[] = stored ? JSON.parse(stored) : [];
      const isWishlisted = current.includes(id);
      const next = isWishlisted ? current.filter((x) => x !== id) : [...current, id];

      localStorage.setItem("medicine_wishlist_v2", JSON.stringify(next));
      window.dispatchEvent(new Event("wishlist_updated"));
    } catch (e) {
      console.error("Failed to update wishlist", e);
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("medicine_wishlist_v2");
        if (stored) setWishlist(JSON.parse(stored));
      } catch {
        return;
      }
    };
    window.addEventListener("wishlist_updated", handleStorage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("wishlist_updated", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return { wishlist, toggleWishlist };
}
