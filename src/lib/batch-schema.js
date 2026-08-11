import { z } from "zod";
export const batchSchema = z
  .object({
    medicineId: z.string().min(1, "Select a medicine"),
    batchNumber: z.string().trim().min(1, "Batch number required").max(40),
    mfgDate: z.string().min(1, "Required"),
    expiryDate: z.string().min(1, "Required"),
    supplierId: z.string().optional().or(z.literal("")),
    quantityReceived: z.coerce.number().int().min(1, "At least 1"),
    locationType: z.enum(["Front Shelf", "Backroom", "Cold Storage", "Quarantine"]),
    rackCode: z.string().trim().min(1, "Required").max(20),
  })
  .refine((v) => new Date(v.expiryDate) > new Date(v.mfgDate), {
    message: "Expiry must be after manufacture date",
    path: ["expiryDate"],
  });
