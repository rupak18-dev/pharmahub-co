import { useSyncExternalStore } from "react";
import { db } from "@/lib/db";
import type { DB } from "@/lib/types";

export function useDb<T>(selector: (db: DB) => T): T {
  return useSyncExternalStore(
    (l) => db.subscribe(l),
    () => selector(db.get()),
    () => selector(db.get()),
  );
}
