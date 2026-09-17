import { useSyncExternalStore } from "react";
import { db } from "@/lib/db";
export function useDb(selector) {
  return useSyncExternalStore(
    (l) => db.subscribe(l),
    () => selector(db.get()),
    () => selector(db.get()),
  );
}
