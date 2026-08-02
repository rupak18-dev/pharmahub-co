import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useDb } from "@/hooks/useDb";
import { useWishlist } from "@/hooks/useWishlist";
import { useMemo, useState } from "react";
import { 
  Heart,
  Share2,
  ChevronRight,
  Star,
  Minus,
  Plus,
  Building2,
  ThermometerSnowflake,
  Activity,
  Package,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getImageForMedicine } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/medicines/$medicineId")({
  head: ({ params }) => ({ meta: [{ title: `Details - ${params.medicineId} Â· PharmaHub` }] }),
  component: MedicineDetailsPage,
});

function MedicineDetailsPage() {
  const { medicineId } = Route.useParams();
  const data = useDb((d) => d);
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const { wishlist: globalWishlist, toggleWishlist } = useWishlist();

  const med = useMemo(() => {
    return data.medicines.find((m) => m.id === medicineId);
  }, [data.medicines, medicineId]);

  if (!med) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-xl font-bold">Medicine Not Found</h2>
        <p className="text-muted-foreground">The requested product does not exist.</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link to="/dashboard/medicines">Back to Store</Link>
        </Button>
      </div>
    );
  }

  // Calculate pricing
  const medBatches = useMemo(() => {
    return data.batches.filter((b) => b.medicineId === med.id);
  }, [data.batches, med.id]);
  
  const price = medBatches[0]?.sellingPrice || medBatches[0]?.mrp || med.ptr || 120;
  const currency = data.settings.currency;

  const genericAlternatives = useMemo(() => {
    let alts = [];
    if (med.genericName) {
      alts = data.medicines.filter(
        (m) => m.id !== med.id && m.isActive && m.genericName?.toLowerCase() === med.genericName?.toLowerCase()
      );
    }
    // Fallback to random medicines if no direct generics found (for demonstration)
    if (alts.length === 0) {
      alts = [...data.medicines].filter(m => m.id !== med.id && m.isActive).sort(() => 0.5 - Math.random()).slice(0, 6);
    }
    return alts;
  }, [data.medicines, med]);

  const manufacturer = data.manufacturers.find(m => m.id === med.manufacturerId)?.name || "Premium Labs";
  const category = data.categories.find(c => c.id === med.categoryId)?.name || "Healthcare";
  const isWishlisted = globalWishlist.includes(med.id);

  return (
    <div className="bg-white min-h-screen p-4 md:p-8 rounded-2xl shadow-sm border border-border/40 max-w-6xl mx-auto">
      {/* Breadcrumbs & Back Button */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="sm" className="gap-1 pl-2 -ml-2 text-slate-500 hover:text-slate-900">
           <Link to="/dashboard/medicines"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <div className="flex flex-wrap items-center text-xs md:text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 mx-1 md:mx-2" />
          <Link to="/dashboard/medicines" className="hover:text-blue-600 transition-colors">{category}</Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 mx-1 md:mx-2" />
          <span className="text-slate-900 font-medium truncate max-w-[150px] sm:max-w-none">{med.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
        {/* Left Side: Image */}
        <div className="flex flex-col items-center">
          <div className="w-full relative aspect-square rounded-2xl bg-white border border-slate-100 p-8 flex items-center justify-center mb-6 shadow-sm overflow-hidden group">
             <div className="absolute top-4 right-4 flex gap-3 z-10">
               <button className="text-slate-300 hover:text-slate-600 transition-colors bg-white/80 p-2 rounded-full backdrop-blur-sm shadow-sm">
                 <Share2 className="w-4 h-4 md:w-5 md:h-5" />
               </button>
               <button 
                onClick={() => toggleWishlist(med.id)} 
                className={`${isWishlisted ? 'text-red-500' : 'text-slate-300 hover:text-slate-600'} transition-colors bg-white/80 p-2 rounded-full backdrop-blur-sm shadow-sm`}
               >
                 <Heart className="w-4 h-4 md:w-5 md:h-5" fill={isWishlisted ? "currentColor" : "none"} />
               </button>
             </div>
             <img src={getImageForMedicine(med.id, med.dosageForm)} alt={med.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          </div>
          {/* Carousel dots */}
          <div className="flex gap-2">
            <div className="w-6 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">{med.name}</h1>
          <p className="text-slate-500 mb-6">By {manufacturer}</p>

          <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8">
            {currency}{(price * quantity).toFixed(0)}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
             <span className="text-sm font-medium text-slate-700 w-24">Quantity</span>
             <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-white shadow-sm self-start">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 md:p-3 text-slate-400 hover:text-blue-600 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold text-blue-600">
                  {quantity.toString().padStart(2, '0')}
                </span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 md:p-3 text-slate-400 hover:text-blue-600 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
             </div>
          </div>

          <div className="mb-8">
            <h3 className="text-base font-bold text-slate-900 mb-3">Description</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
              {med.usageInstructions || med.dosageInfo || "The medicine is developed using carefully monitored chemical formulations. Inactivated components and specific excipients ensure therapeutic reliability. Efficacy levels have been clinically established without significant risks for indicated pathologies."}
            </p>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-slate-50/50 p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-full shrink-0">
                 <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Manufacturer</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{manufacturer}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-full shrink-0">
                 <ThermometerSnowflake className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Storage</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{med.storageRequirements || "Store at room temp"}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-full shrink-0">
                 <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Form</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{med.dosageForm || "Tablets"}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-full shrink-0">
                 <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Packaging Size</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{med.packSize || "Standard"}</p>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-14 text-blue-600 border-blue-600 hover:bg-blue-50 font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm group"
            onClick={() => {
              toggleWishlist(med.id);
              if (!isWishlisted) toast.success("Added to Wishlist");
            }}
          >
            <Heart className={`w-5 h-5 group-hover:scale-110 transition-transform ${isWishlisted ? 'text-red-500' : ''}`} fill={isWishlisted ? "currentColor" : "none"} />
            {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          </Button>
        </div>
      </div>

      {/* Alternate Medicine Section */}
      {genericAlternatives.length > 0 && (
        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-slate-900">Alternate Medicine</h2>
             <button className="text-blue-600 text-sm font-semibold hover:underline">View all</button>
          </div>
          
          {/* Horizontally scrollable container */}
          <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x">
             {genericAlternatives.map(alt => {
               const altPrice = data.batches.find(b => b.medicineId === alt.id)?.sellingPrice || 110;
               return (
                 <div key={alt.id} className="min-w-[200px] max-w-[200px] md:min-w-[240px] md:max-w-[240px] border border-slate-200 rounded-2xl p-4 bg-white flex flex-col snap-start shrink-0 group hover:shadow-lg transition-all relative">
                   <button 
                     className={`absolute top-4 right-4 ${globalWishlist.includes(alt.id) ? 'text-red-500' : 'text-slate-300 hover:text-red-500'} transition-colors z-10 bg-white/50 rounded-full p-1.5`}
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       toggleWishlist(alt.id);
                       if (!globalWishlist.includes(alt.id)) toast.success("Saved to favorites!");
                     }}
                   >
                     <Heart className="w-4 h-4" fill={globalWishlist.includes(alt.id) ? "currentColor" : "none"} />
                   </button>
                   <Link to={`/dashboard/medicines/${alt.id}`} className="flex flex-col h-full">
                     <div className="w-full h-32 md:h-40 bg-slate-50 rounded-xl mb-4 p-4 flex items-center justify-center overflow-hidden border border-slate-100">
                       <img 
                         src={getImageForMedicine(alt.id, alt.dosageForm)} 
                         alt={alt.name} 
                         className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                       />
                     </div>
                     <h3 className="font-bold text-slate-900 text-sm md:text-base truncate mb-1">{alt.name}</h3>
                     <p className="text-xs text-slate-500 truncate mb-3">{alt.genericName || "Generic Equivalent"}</p>
                     
                     <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-100">
                       <span className="font-extrabold text-slate-900 text-lg">{currency}{altPrice.toFixed(0)}</span>
                     </div>
                   </Link>
                 </div>
               );
             })}
          </div>
        </div>
      )}
    </div>
  );
}
