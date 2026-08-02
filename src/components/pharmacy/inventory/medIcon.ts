import { HeartPulse, Pill, Sparkles, Tablet, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Medicine } from "@/lib/types";

export function medIcon(m: Medicine): LucideIcon {
  const s = `${m.name} ${m.genericName ?? ""} ${m.brandName ?? ""}`.toLowerCase();
  if (/(vitamin|d3|supplement|multivit|calcium|cholecalciferol|zinc)/.test(s)) return Sparkles;
  if (
    /(atorvastatin|metformin|cardio|amlodipine|heart|losartan|atorlip|glycomet|insulin|glimepiride|telmisartan|clopidogrel)/.test(
      s,
    )
  )
    return HeartPulse;
  if (/(ibuprofen|paracetamol|analgesic|brufen|crocin|dolo|diclofenac)/.test(s)) return Tablet;
  if (
    /(syrup|diphenhydramine|benadryl|montelukast|salbutamol|cetirizine|inhaler|respir|cough)/.test(
      s,
    )
  )
    return Wind;
  return Pill;
}
