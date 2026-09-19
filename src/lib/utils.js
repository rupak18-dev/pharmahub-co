import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const CATEGORY_PALETTES = [
  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  { bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-200" },
  { bg: "bg-lime-50", text: "text-lime-700", border: "border-lime-200" },
];

export function getCategoryBadgeClasses(name) {
  if (!name || name === "—" || name === "Uncategorized") {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }
  const lower = name.toLowerCase();
  if (lower.includes("antibiotic")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (lower.includes("pain") || lower.includes("analgesic") || lower.includes("relief") || lower.includes("nsaid")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (lower.includes("cardio") || lower.includes("heart") || lower.includes("cardiac") || lower.includes("hyper")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (lower.includes("vitamin") || lower.includes("supplement") || lower.includes("mineral") || lower.includes("nutrition")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (lower.includes("respirat") || lower.includes("cough") || lower.includes("cold") || lower.includes("asthma") || lower.includes("bronch")) {
    return "bg-sky-50 text-sky-700 border-sky-200";
  }
  if (lower.includes("gastro") || lower.includes("antacid") || lower.includes("digest") || lower.includes("ulcer")) {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }
  if (lower.includes("diabet") || lower.includes("insulin") || lower.includes("glyc")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (lower.includes("derma") || lower.includes("skin") || lower.includes("topical")) {
    return "bg-pink-50 text-pink-700 border-pink-200";
  }
  if (lower.includes("neuro") || lower.includes("cns") || lower.includes("psych") || lower.includes("brain")) {
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
  if (lower.includes("otc") || lower.includes("fmcg") || lower.includes("general")) {
    return "bg-teal-50 text-teal-700 border-teal-200";
  }
  if (lower.includes("allerg") || lower.includes("antihistamine") || lower.includes("sinus")) {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }
  if (lower.includes("fungal") || lower.includes("viral") || lower.includes("infect")) {
    return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
  }
  if (lower.includes("eye") || lower.includes("ophthalmic") || lower.includes("ear") || lower.includes("ent")) {
    return "bg-cyan-50 text-cyan-700 border-cyan-200";
  }

  // Deterministic fallback for custom categories:
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CATEGORY_PALETTES.length;
  const p = CATEGORY_PALETTES[index];
  return `${p.bg} ${p.text} ${p.border}`;
}

export const getImageForMedicine = (id = "", form = "", name = "") => {
  const lowerName = (name || "").toLowerCase();
  const lowerId = (id || "").toLowerCase();
  
  if (lowerName.includes("dolo") || lowerId.includes("dolo")) return "/medicines/dolo_500.jpg";
  if (lowerName.includes("crocin") || lowerId.includes("crocin")) return "/medicines/crocin_500.jpg";
  if (lowerName.includes("calpol") || lowerId.includes("calpol")) return "/medicines/calpol_500.jpg";
  if (lowerName.includes("650") || lowerId.includes("p650") || lowerId.includes("p-650")) return "/medicines/p650.jpg";
  if (lowerName.includes("paracip") || lowerId.includes("paracip")) return "/medicines/paracip_500.jpg";
  if (lowerName.includes("paracetamol") || lowerId.includes("paracetamol")) return "/medicines/paracetamol_main.jpg";

  const localMeds = [
    "/medicines/paracetamol_main.jpg",
    "/medicines/dolo_500.jpg",
    "/medicines/crocin_500.jpg",
    "/medicines/calpol_500.jpg",
    "/medicines/p650.jpg",
    "/medicines/paracip_500.jpg",
    "/medicines/paracetamol_blister.jpg",
  ];

  const hash = String(id).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  if (form?.toLowerCase().includes("syrup") || form?.toLowerCase().includes("suspension")) {
    const syrupImages = [
      "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1512069772995-36be0b57e0e7?auto=format&fit=crop&w=400&q=80",
    ];
    return syrupImages[hash % syrupImages.length];
  }

  return localMeds[hash % localMeds.length];
};

