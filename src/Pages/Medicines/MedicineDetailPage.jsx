import React, { useState, useMemo } from "react";
import { Link, useParams } from "react-router";
import { useDb } from "@/hooks/useDb";
import { useWishlist } from "@/hooks/useWishlist";
import {
  ChevronRight,
  Thermometer,
  Zap,
  Leaf,
  ShieldCheck,
  FlaskConical,
  Pill,
  Package,
  Grid2X2,
  Building2,
  ShoppingCart,
  Heart,
  FileText,
  Info,
  Archive,
  ArrowRight,
  Minus,
  Plus,
  History,
  Clock,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Stethoscope,
  AlertCircle,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/Components/ui/sheet";

/* ─── Real Product Image Assets ────────────────────────────── */
const PRODUCT_IMAGES = [
  {
    id: 0,
    title: "Main Pack & Blister",
    src: "/medicines/paracetamol_main.jpg",
  },
  {
    id: 1,
    title: "Tablet Blister Strip",
    src: "/medicines/paracetamol_blister.jpg",
  },
  {
    id: 2,
    title: "Back Packaging Specs",
    src: "/medicines/paracetamol_back.jpg",
  },
  {
    id: 3,
    title: "Side View Details",
    src: "/medicines/paracetamol_side.jpg",
  },
];

/* ─── Similar Medicines Data with Real Photos ──────────────── */
const SIMILAR_MEDICINES = [
  {
    id: "dolo-500",
    name: "Dolo 500",
    composition: "Paracetamol 500 mg",
    price: "11.50",
    image: "/medicines/dolo_500.jpg",
  },
  {
    id: "crocin-500",
    name: "Crocin 500",
    composition: "Paracetamol 500 mg",
    price: "12.00",
    image: "/medicines/crocin_500.jpg",
  },
  {
    id: "calpol-500",
    name: "Calpol 500",
    composition: "Paracetamol 500 mg",
    price: "13.00",
    image: "/medicines/calpol_500.jpg",
  },
  {
    id: "p-650",
    name: "P-650",
    composition: "Paracetamol 650 mg",
    price: "18.00",
    image: "/medicines/p650.jpg",
  },
  {
    id: "paracip-500",
    name: "Paracip 500",
    composition: "Paracetamol 500 mg",
    price: "11.00",
    image: "/medicines/paracip_500.jpg",
  },
];

/* ─── History Drawer Helpers ───────────────────────────────── */
function getHistoryEventIcon(event) {
  if (event._source === "movement") {
    if (event._movementType === "in") return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (event._movementType === "out") return <TrendingDown className="w-4 h-4 text-rose-500" />;
    return <RotateCcw className="w-4 h-4 text-amber-500" />;
  }
  const action = (event.action || "").toLowerCase();
  if (action.includes("add") || action.includes("creat")) return <Package className="w-4 h-4 text-blue-500" />;
  if (action.includes("updat") || action.includes("edit")) return <Pill className="w-4 h-4 text-indigo-500" />;
  if (action.includes("stock") || action.includes("batch")) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  return <Clock className="w-4 h-4 text-slate-400" />;
}

function getEventAccent(event) {
  if (event._source === "movement") {
    if (event._movementType === "in") return "border-l-4 border-emerald-500 bg-emerald-50/50";
    if (event._movementType === "out") return "border-l-4 border-rose-500 bg-rose-50/50";
    return "border-l-4 border-amber-500 bg-amber-50/50";
  }
  return "border-l-4 border-blue-500 bg-blue-50/50";
}

function formatHistoryDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MedicineDetailPage() {
  const { medicineId } = useParams();
  const data = useDb((d) => d);

  // States
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [selectedPackSize, setSelectedPackSize] = useState("10 Tablets");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [historyOpen, setHistoryOpen] = useState(false);
  const { wishlist: globalWishlist, toggleWishlist } = useWishlist();

  // Find medicine data
  const med = useMemo(() => {
    const found = (data.medicines || []).find((m) => m.id === medicineId);
    return (
      found || {
        id: "med-paracetamol-500",
        name: "Paracetamol 500 mg Tablet",
        genericName: "Paracetamol",
        saltComposition: "Paracetamol 500 mg",
        strength: "500 mg",
        dosageForm: "Tablet",
        packSize: "10 Tablets",
        brandName: "Paracetamol (Cipla)",
        category: "Analgesics",
        manufacturer: "Cipla Ltd.",
        drugSchedule: "OTC (No prescription required)",
        usageInstructions: "For relief from fever, headache, body pain and mild to moderate pain.",
        ptr: 12.0,
      }
    );
  }, [data.medicines, medicineId]);

  const manufacturer =
    (data.manufacturers || []).find((m) => m.id === med.manufacturerId)?.name ||
    med.brandName ||
    "Cipla Ltd.";

  const categoryName =
    (data.categories || []).find((c) => c.id === med.categoryId)?.name ||
    med.category ||
    "Analgesics";

  const isWishlisted = globalWishlist.includes(med.id);

  // History timeline calculations
  const medicineHistory = useMemo(() => {
    if (!med) return [];
    const medBatchIds = new Set(
      (data.batches || []).filter((b) => b.medicineId === med.id).map((b) => b.id)
    );
    const logs = (data.activityLogs || []).filter(
      (log) =>
        log.entityId === med.id ||
        medBatchIds.has(log.entityId) ||
        (log.entityType === "medicine" &&
          log.action?.toLowerCase().includes(med.name?.toLowerCase()))
    );
    const movements = (data.stockMovements || []).filter(
      (mv) => mv.medicineId === med.id || medBatchIds.has(mv.batchId)
    );
    const loggedIds = new Set(logs.map((l) => l.id));
    return [
      ...logs.map((l) => ({ ...l, _source: "activity", _time: l.createdAt })),
      ...movements
        .filter((mv) => !loggedIds.has(mv.id))
        .map((mv) => ({
          id: mv.id,
          action: `${mv.movementType === "in" ? "Stock In" : mv.movementType === "out" ? "Stock Out" : "Stock Adjustment"} · ${Math.abs(mv.quantity)} units${mv.reason ? ` (${mv.reason})` : ""}`,
          entityType: "batch",
          entityId: mv.batchId,
          userName: mv.createdBy,
          _source: "movement",
          _time: mv.createdAt,
          _movementType: mv.movementType,
          _quantity: mv.quantity,
        })),
    ].sort((a, b) => new Date(b._time) - new Date(a._time));
  }, [med, data.activityLogs, data.stockMovements, data.batches]);

  const handleAddToCart = () => {
    toast.success(`Added ${quantity} pack(s) of ${med.name} to cart!`, {
      description: `Pack Size: ${selectedPackSize} · ₹${(12.0 * quantity).toFixed(2)}`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F6FAFD] text-[#0D1835] font-sans antialiased py-5 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1460px] mx-auto space-y-4 sm:space-y-5">

        {/* ── 1. BREADCRUMB ────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-xs md:text-sm text-slate-500 font-medium">
            <Link to="/" className="hover:text-[#006BFF] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/medicines" className="hover:text-[#006BFF] transition-colors">
              Medicines
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="hover:text-[#006BFF] transition-colors cursor-pointer">
              {categoryName}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#0D1835] font-semibold">
              {med.name}
            </span>
          </nav>

          {/* History Button */}
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5EDF7] bg-white hover:bg-[#EEF7FF] text-[#0D1835] text-xs font-semibold shadow-[0_1px_3px_rgba(13,24,53,0.04)] transition-all hover:border-[#006BFF]"
          >
            <History className="w-3.5 h-3.5 text-[#006BFF]" />
            <span className="hidden sm:inline">History</span>
            {medicineHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#EEF7FF] text-[#006BFF] text-[10px] font-bold rounded-full border border-[#D0E4FE]">
                {medicineHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* ── 2. MAIN PRODUCT SECTION (3-COLUMN LAYOUT) ─────────── */}
        <div className="bg-white rounded-[18px] border border-[#E5EDF7] p-5 lg:p-7 shadow-[0_2px_12px_rgba(13,24,53,0.03)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">

            {/* ════ LEFT COLUMN (≈42% -> 5 cols): Thumbnail Gallery + Showcase ════ */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3.5 items-stretch">
              
              {/* Vertical Image-Thumbnail Gallery */}
              <div className="flex sm:flex-col gap-2.5 order-2 sm:order-1 shrink-0 overflow-x-auto sm:overflow-visible">
                {PRODUCT_IMAGES.map((thumb) => (
                  <button
                    key={thumb.id}
                    onClick={() => setSelectedThumb(thumb.id)}
                    className={`w-14 h-14 sm:w-[62px] sm:h-[62px] rounded-[14px] border p-0.5 transition-all overflow-hidden bg-[#F9FBFE] shrink-0 ${
                      selectedThumb === thumb.id
                        ? "border-[#006BFF] ring-2 ring-[#006BFF]/20 shadow-xs"
                        : "border-[#E5EDF7] hover:border-slate-300 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={thumb.src}
                      alt={thumb.title}
                      className="w-full h-full object-cover rounded-[11px]"
                    />
                  </button>
                ))}
              </div>

              {/* Large Product Image Card with Real Product Photo */}
              <div className="flex-1 relative rounded-[16px] bg-[#F4F9FC] border border-[#D5E7F0] overflow-hidden min-h-[360px] sm:min-h-[410px] order-1 sm:order-2 flex flex-col justify-between shadow-inner">
                
                {/* Real High-Resolution Showcase Photo */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={PRODUCT_IMAGES[selectedThumb].src}
                    alt={med.name}
                    className="w-full h-full object-cover object-center transition-all duration-300"
                  />
                  {/* Subtle Gradient Overlays for Brand Badges & Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
                </div>

                {/* Cipla Badge in Upper-Right */}
                <div className="relative z-10 flex justify-end p-4">
                  <div className="bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/60 shadow-sm text-right">
                    <div className="text-xs font-extrabold text-[#004A99] tracking-tight">
                      Cipla
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium">
                      Trusted for a Healthier Tomorrow
                    </div>
                  </div>
                </div>

                {/* Bottom Left Slogan Overlay */}
                <div className="relative z-10 p-4">
                  <span className="inline-block bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg text-sm sm:text-base font-serif italic text-[#004A99] font-semibold tracking-wide shadow-xs border border-white/50">
                    Care Beyond Symptoms
                  </span>
                </div>

              </div>

            </div>

            {/* ════ CENTER COLUMN (≈32% -> 4 cols): Medicine Details ════════════ */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Badges: Prescription Not Required + OTC */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#EAF7EE] text-[#16A34A] border border-[#C6EBD0]">
                  <FileText className="w-3.5 h-3.5 text-[#16A34A]" />
                  Prescription Not Required
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-[#EEF7FF] text-[#006BFF] border border-[#D0E4FE]">
                  OTC
                </span>
              </div>

              {/* Main Heading & Subtitles */}
              <div>
                <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0D1835] tracking-tight leading-tight">
                  Paracetamol 500 mg Tablet
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-1">
                  Cipla Ltd.
                </p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  For relief from fever, headache, body pain and mild to moderate pain.
                </p>
              </div>

              {/* Four Benefit Icons Horizontally */}
              <div className="grid grid-cols-4 gap-2 pt-1 pb-1">
                
                {/* 1. Relieves Fever */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full bg-[#EEF7FF] border border-[#D9ECFF] flex items-center justify-center text-[#006BFF] mb-1.5">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#0D1835] leading-tight">
                    Relieves<br />Fever
                  </span>
                </div>

                {/* 2. Relieves Pain */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full bg-[#FFF4EA] border border-[#FFE3CC] flex items-center justify-center text-[#F97316] mb-1.5">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#0D1835] leading-tight">
                    Relieves<br />Pain
                  </span>
                </div>

                {/* 3. Gentle on Stomach */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full bg-[#EAF7EE] border border-[#C6EBD0] flex items-center justify-center text-[#16A34A] mb-1.5">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#0D1835] leading-tight">
                    Gentle on<br />Stomach
                  </span>
                </div>

                {/* 4. Trusted Brand */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full bg-[#EEF7FF] border border-[#D9ECFF] flex items-center justify-center text-[#006BFF] mb-1.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#0D1835] leading-tight">
                    Trusted<br />Brand
                  </span>
                </div>

              </div>

              {/* Composition Card */}
              <div className="bg-gradient-to-r from-[#EEF6FF] to-[#F4F9FF] border border-[#D8E9FE] rounded-[14px] p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#006BFF]">
                  <FlaskConical className="w-4 h-4" />
                  <span>Composition</span>
                </div>
                <p className="text-[11px] text-slate-500">Each uncoated tablet contains:</p>
                <div className="flex items-center justify-between text-xs font-medium text-[#0D1835] pt-0.5">
                  <span className="font-semibold">Paracetamol</span>
                  <span className="text-slate-400 font-mono text-[11px]">IP</span>
                  <span className="font-bold text-[#0D1835]">500 mg</span>
                </div>
              </div>

              {/* Four Product Metadata Columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                
                <div className="flex flex-col p-2.5 rounded-[12px] bg-[#F8FBFE] border border-[#E5EDF7]">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <Pill className="w-3.5 h-3.5 text-[#006BFF]" />
                    <span>Form</span>
                  </div>
                  <p className="text-xs font-bold text-[#0D1835] mt-1">Tablet</p>
                </div>

                <div className="flex flex-col p-2.5 rounded-[12px] bg-[#F8FBFE] border border-[#E5EDF7]">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <Package className="w-3.5 h-3.5 text-[#006BFF]" />
                    <span>Pack Size</span>
                  </div>
                  <p className="text-xs font-bold text-[#0D1835] mt-1">10 Tablets</p>
                </div>

                <div className="flex flex-col p-2.5 rounded-[12px] bg-[#F8FBFE] border border-[#E5EDF7]">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <Grid2X2 className="w-3.5 h-3.5 text-[#006BFF]" />
                    <span>Category</span>
                  </div>
                  <p className="text-xs font-bold text-[#0D1835] mt-1">Analgesic</p>
                </div>

                <div className="flex flex-col p-2.5 rounded-[12px] bg-[#F8FBFE] border border-[#E5EDF7]">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-[#006BFF]" />
                    <span>Manufacturer</span>
                  </div>
                  <p className="text-xs font-bold text-[#0D1835] mt-1 truncate">Cipla Ltd.</p>
                </div>

              </div>

            </div>

            {/* ════ RIGHT COLUMN (≈26% -> 3 cols): Sticky Purchase Card ═════════ */}
            <div className="lg:col-span-3 bg-white rounded-[16px] border border-[#E5EDF7] p-5 space-y-4 shadow-[0_4px_20px_rgba(13,24,53,0.04)]">
              
              {/* MRP & Discounted Price */}
              <div>
                <div className="flex items-baseline gap-2 text-xs text-slate-400">
                  <span className="font-medium">MRP</span>
                  <span className="line-through">₹15.00</span>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span className="text-3xl font-extrabold text-[#0D1835] tracking-tight">
                    ₹12.00
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#16A34A] border border-[#C6EBD0] text-xs font-extrabold">
                    20% OFF
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Inclusive of all taxes</p>
              </div>

              {/* Pack Size Selector */}
              <div>
                <label className="text-xs font-bold text-[#0D1835] block mb-2">
                  Pack Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["10 Tablets", "15 Tablets", "30 Tablets"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedPackSize(size)}
                      className={`py-2 px-1 text-center rounded-[10px] text-xs font-bold border transition-all ${
                        selectedPackSize === size
                          ? "border-[#006BFF] bg-[#EEF7FF] text-[#006BFF]"
                          : "border-[#E5EDF7] text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper & In Stock */}
              <div>
                <label className="text-xs font-bold text-[#0D1835] block mb-2">
                  Quantity
                </label>
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-xl border border-[#E5EDF7] bg-[#F8FBFE] p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center font-bold text-sm text-[#0D1835]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-[#16A34A]">
                      In Stock
                    </div>
                    <p className="text-[10px] text-slate-400">
                      100+ packs available
                    </p>
                  </div>
                </div>
              </div>

              {/* Large Full-Width Buttons */}
              <div className="space-y-2.5 pt-2">
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-[52px] bg-[#006BFF] hover:bg-[#0058D6] text-white font-bold rounded-[14px] shadow-[0_4px_14px_rgba(0,107,255,0.3)] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    toggleWishlist(med.id);
                    if (!isWishlisted) toast.success("Saved to wishlist!");
                  }}
                  className={`w-full h-[46px] rounded-[14px] text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isWishlisted
                      ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      : "border-[#E5EDF7] bg-white text-[#0D1835] hover:bg-slate-50"
                  }`}
                >
                  <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
                  {isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
                </Button>
              </div>

            </div>

          </div>
        </div>

        {/* ── 3. MEDICINE INFORMATION TABS ───────────────────────── */}
        <div className="bg-white rounded-[18px] border border-[#E5EDF7] shadow-[0_2px_12px_rgba(13,24,53,0.03)] overflow-hidden">
          
          {/* Horizontal Tabs Bar */}
          <div className="border-b border-[#E5EDF7] px-4 sm:px-6 flex gap-3 overflow-x-auto scrollbar-none bg-white">
            {[
              { id: "overview", label: "Overview", icon: FileText },
              { id: "uses", label: "Uses", icon: Stethoscope },
              { id: "dosage", label: "Dosage", icon: Pill },
              { id: "sideEffects", label: "Side Effects", icon: AlertCircle },
              { id: "precautions", label: "Precautions", icon: Shield },
              { id: "interactions", label: "Interactions", icon: Sparkles },
              { id: "alternatives", label: "Alternatives", icon: RotateCcw },
              { id: "storage", label: "Storage", icon: Package },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "border-[#006BFF] text-[#006BFF]"
                      : "border-transparent text-[#0D1835]/70 hover:text-[#0D1835]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#006BFF]" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── 4. OVERVIEW CONTENT CARD (3 COLUMNS) ──────────────── */}
          <div className="p-6 sm:p-8">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
                
                {/* Column 1: About This Medicine */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0D1835]">
                    <FileText className="w-4 h-4 text-[#006BFF]" />
                    <span>About This Medicine</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Paracetamol 500 mg is a commonly used medicine for the relief of fever, headache, body pain, toothache and other mild to moderate pains. It works by reducing the production of certain chemicals in the brain that cause pain and fever.
                  </p>
                </div>

                {/* Column 2: Key Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0D1835]">
                    <Info className="w-4 h-4 text-[#006BFF]" />
                    <span>Key Information</span>
                  </div>
                  <div className="text-xs space-y-2.5">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Salt / Composition</span>
                      <span className="font-semibold text-[#0D1835]">Paracetamol 500 mg</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Brand</span>
                      <span className="font-semibold text-[#0D1835]">Paracetamol (Cipla)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Manufacturer</span>
                      <span className="font-semibold text-[#0D1835]">Cipla Ltd.</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Form</span>
                      <span className="font-semibold text-[#0D1835]">Tablet</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Pack Size</span>
                      <span className="font-semibold text-[#0D1835]">10 Tablets</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Category</span>
                      <span className="font-semibold text-[#0D1835]">Analgesic / Antipyretic</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Schedule</span>
                      <span className="font-semibold text-[#0D1835]">OTC (No prescription required)</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Storage Instructions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0D1835]">
                    <Archive className="w-4 h-4 text-[#006BFF]" />
                    <span>Storage Instructions</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed font-normal">
                    <p>Store in a cool, dry place below 30°C.</p>
                    <p>Keep away from direct sunlight and moisture.</p>
                    <p>Keep out of reach of children.</p>
                  </div>
                </div>

              </div>
            )}

            {activeTab === "uses" && (
              <div className="space-y-3 max-w-3xl">
                <h4 className="text-sm font-bold text-[#0D1835]">Primary Uses & Indications</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Recommended for fever reduction and temporary relief of mild-to-moderate pain conditions including headaches, migraine, toothaches, musculoskeletal aches, and symptoms associated with colds.
                </p>
              </div>
            )}

            {activeTab === "dosage" && (
              <div className="space-y-3 max-w-3xl">
                <h4 className="text-sm font-bold text-[#0D1835]">Dosage Guidelines</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Adults and children over 12 years: 1 to 2 tablets every 4 to 6 hours as required. Do not exceed 4000 mg (8 tablets) in any 24-hour period.
                </p>
              </div>
            )}

            {activeTab === "sideEffects" && (
              <div className="space-y-3 max-w-3xl">
                <h4 className="text-sm font-bold text-[#0D1835]">Side Effects</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Paracetamol is generally well tolerated when taken at recommended doses. Rare side effects may include skin rash, itching, or allergic reactions.
                </p>
              </div>
            )}

            {activeTab === "precautions" && (
              <div className="space-y-3 max-w-3xl">
                <h4 className="text-sm font-bold text-[#0D1835]">Precautions</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Exercise caution if you suffer from pre-existing liver conditions, severe renal impairment, or chronic alcohol dependency. Do not combine with other paracetamol-containing medications.
                </p>
              </div>
            )}

            {activeTab === "interactions" && (
              <div className="space-y-3 max-w-3xl">
                <h4 className="text-sm font-bold text-[#0D1835]">Drug Interactions</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Inform your doctor if taking anticoagulants (such as warfarin) or anticonvulsants (such as carbamazepine).
                </p>
              </div>
            )}

            {activeTab === "alternatives" && (
              <div className="space-y-3 max-w-3xl">
                <h4 className="text-sm font-bold text-[#0D1835]">Generic Alternatives</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Equivalents containing 500mg paracetamol include Dolo 500, Crocin 500, Calpol 500, and Paracip 500.
                </p>
              </div>
            )}

            {activeTab === "storage" && (
              <div className="space-y-3 max-w-3xl">
                <h4 className="text-sm font-bold text-[#0D1835]">Storage Specifications</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Keep in original packaging below 30°C. Protect from excess heat and damp environments.
                </p>
              </div>
            )}

          </div>

        </div>

        {/* ── 5. SIMILAR MEDICINES ───────────────────────────────── */}
        <div className="space-y-3.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0D1835] tracking-tight">
              Similar Medicines
            </h3>
            <Link
              to="/medicines"
              className="text-xs sm:text-sm font-bold text-[#006BFF] hover:underline flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {SIMILAR_MEDICINES.map((alt) => (
              <div
                key={alt.id}
                className="bg-white rounded-[16px] border border-[#E5EDF7] p-3.5 hover:shadow-[0_4px_16px_rgba(13,24,53,0.06)] hover:border-[#006BFF]/40 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center gap-3">
                  
                  {/* Real Product Photo on Left */}
                  <div className="w-12 h-12 rounded-[12px] bg-[#EEF7FF] border border-[#D0E4FE] overflow-hidden shrink-0">
                    <img
                      src={alt.image}
                      alt={alt.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* Name & Composition */}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#0D1835] truncate group-hover:text-[#006BFF] transition-colors">
                      {alt.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {alt.composition}
                    </p>
                  </div>
                </div>

                {/* Price & Circular Cart Button */}
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100">
                  <span className="text-xs sm:text-sm font-extrabold text-[#0D1835]">
                    ₹{alt.price}
                  </span>
                  
                  <button
                    onClick={() => {
                      toast.success(`Added ${alt.name} to cart!`);
                    }}
                    className="w-7 h-7 rounded-full bg-[#EEF7FF] hover:bg-[#006BFF] text-[#006BFF] hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                    title="Add to cart"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Slide-Out History Drawer ───────────────────────────── */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white">
          <SheetHeader className="px-6 py-5 border-b border-[#E5EDF7] bg-[#F8FBFE] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF7FF] flex items-center justify-center text-[#006BFF]">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold text-[#0D1835]">
                    Medicine History
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-500">
                    Audit log & stock tracking for {med.name}
                  </SheetDescription>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF7FF] text-[#006BFF]">
                {medicineHistory.length} events
              </span>
            </div>
          </SheetHeader>

          {/* Timeline Events */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {medicineHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-2">
                <History className="w-10 h-10 text-slate-200" />
                <p className="text-xs font-semibold text-slate-600">No history events yet</p>
                <p className="text-[11px] text-slate-400 max-w-[220px]">
                  Activities, stock movements, and batch adjustments will automatically record here.
                </p>
              </div>
            ) : (
              medicineHistory.map((event, idx) => (
                <div
                  key={event.id || idx}
                  className={`rounded-xl px-3.5 py-3 ${getEventAccent(event)} flex gap-3 items-start shadow-xs`}
                >
                  <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-xs">
                    {getHistoryEventIcon(event)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {event.action || "Activity recorded"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 mt-1">
                      {event.userName && (
                        <span className="text-[10px] text-slate-500">
                          by <strong className="text-slate-700">{event.userName}</strong>
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                        <Clock className="w-2.5 h-2.5" />
                        {formatHistoryDate(event._time)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
