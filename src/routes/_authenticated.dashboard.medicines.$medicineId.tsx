import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useDb } from "@/hooks/useDb";
import { useMemo, useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Pill, 
  Layers, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Printer, 
  FileText, 
  DollarSign, 
  Compass, 
  Barcode, 
  QrCode, 
  Clock, 
  Truck, 
  RefreshCw, 
  Percent, 
  ShoppingCart,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface MedicineIdSearch {
  activeTab?: string;
}

export const Route = createFileRoute("/_authenticated/dashboard/medicines/$medicineId")({
  validateSearch: (search: Record<string, unknown>): MedicineIdSearch => {
    return {
      activeTab: search.activeTab as string | undefined,
    };
  },
  head: ({ params }) => ({ meta: [{ title: `Details - ${params.medicineId} · PharmacyOS` }] }),
  component: MedicineDetailsPage,
});

function MedicineDetailsPage() {
  const { medicineId } = Route.useParams();
  const data = useDb((d) => d);
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [activeTab, setActiveTab] = useState(searchParams.activeTab || "profile");

  useEffect(() => {
    if (searchParams.activeTab) {
      setActiveTab(searchParams.activeTab);
    }
  }, [searchParams.activeTab]);

  const med = useMemo(() => {
    return data.medicines.find((m) => m.id === medicineId);
  }, [data.medicines, medicineId]);

  if (!med) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-xl font-bold">Medicine Profile Not Found</h2>
        <p className="text-muted-foreground">The requested configuration does not exist in the ERP master catalog.</p>
        <Button asChild className="bg-[#2563EB] hover:bg-blue-700">
          <Link to="/dashboard/medicines/catalog">Back to Catalog</Link>
        </Button>
      </div>
    );
  }

  // Calculate live inventory metrics
  const medBatches = useMemo(() => {
    return data.batches.filter((b) => b.medicineId === med.id);
  }, [data.batches, med.id]);

  const stockStats = useMemo(() => {
    let totalStock = 0;
    let expiredStock = 0;
    let nearExpiryStock = 0;
    let value = 0;
    const now = Date.now();
    const nearMs = data.settings.nearExpiryDays * 24 * 60 * 60 * 1000;

    medBatches.forEach((b) => {
      totalStock += b.currentStock;
      value += b.currentStock * b.purchasePrice;
      const expTime = new Date(b.expiryDate).getTime();
      if (expTime < now) {
        expiredStock += b.currentStock;
      } else if (expTime - now <= nearMs) {
        nearExpiryStock += b.currentStock;
      }
    });

    return {
      totalStock,
      expiredStock,
      nearExpiryStock,
      availableStock: totalStock - (med.reservedQuantity || 0),
      value,
    };
  }, [medBatches, med, data.settings.nearExpiryDays]);

  // Find generic alternatives (same generic name, active, different ID)
  const genericAlternatives = useMemo(() => {
    if (!med.genericName) return [];
    return data.medicines.filter(
      (m) => m.id !== med.id && m.isActive && m.genericName?.toLowerCase() === med.genericName?.toLowerCase()
    );
  }, [data.medicines, med]);

  // Sales history logs
  const salesHistory = useMemo(() => {
    const logs: any[] = [];
    data.sales.forEach(s => {
      s.items.forEach(item => {
        if (item.medicineId === med.id) {
          logs.push({
            id: s.id,
            invoiceNo: s.invoiceNo,
            customer: s.customerName || "Retail Walk-in",
            date: s.createdAt,
            qty: item.quantity,
            total: item.lineTotal,
            paymentMode: s.paymentMode
          });
        }
      });
    });
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.sales, med.id]);

  // Purchase order logs
  const poHistory = useMemo(() => {
    const logs: any[] = [];
    data.purchaseOrders.forEach(po => {
      po.items.forEach(item => {
        if (item.medicineId === med.id) {
          logs.push({
            poNumber: po.poNumber,
            supplier: data.suppliers.find(s => s.id === po.supplierId)?.name || "Unknown",
            date: po.createdAt,
            qty: item.quantity,
            price: item.expectedPrice,
            status: po.status
          });
        }
      });
    });
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.purchaseOrders, med.id, data.suppliers]);

  // Charts metrics
  const analyticsData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleDateString(undefined, { month: "short" }),
        salesVolume: 0,
        purchasesVolume: 0,
        cogs: 0
      };
    }).reverse();

    // Map sales
    data.sales.forEach(s => {
      const sDate = new Date(s.createdAt);
      s.items.forEach(item => {
        if (item.medicineId === med.id) {
          const mName = sDate.toLocaleDateString(undefined, { month: "short" });
          const slot = last6Months.find(l => l.month === mName);
          if (slot) {
            slot.salesVolume += item.lineTotal;
            const batch = data.batches.find(b => b.id === item.batchId);
            if (batch) slot.cogs += batch.purchasePrice * item.quantity;
          }
        }
      });
    });

    // Map purchases
    data.purchaseOrders.forEach(po => {
      if (po.status === "received") {
        const poDate = new Date(po.createdAt);
        po.items.forEach(item => {
          if (item.medicineId === med.id) {
            const mName = poDate.toLocaleDateString(undefined, { month: "short" });
            const slot = last6Months.find(l => l.month === mName);
            if (slot) {
              slot.purchasesVolume += item.quantity * item.expectedPrice;
            }
          }
        });
      }
    });

    return last6Months;
  }, [data.sales, data.purchaseOrders, data.batches, med.id]);

  const currency = data.settings.currency;

  const handlePrintLabel = () => {
    toast.success(`Printing barcode label for ${med.name}...`);
  };

  const handleBillQuick = () => {
    toast.success(`Redirecting to POS with ${med.name} loaded...`);
    navigate({ to: "/dashboard/sales" });
  };

  return (
    <div className="space-y-6 pb-12 bg-white min-h-screen p-6 rounded-2xl shadow-sm border border-border/40">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-full border">
            <Link to="/dashboard/medicines/catalog">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-foreground">{med.name}</span>
              {med.brandName && (
                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                  {med.brandName}
                </span>
              )}
              {med.drugSchedule && (
                <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded font-bold uppercase">
                  {med.drugSchedule}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-medium">Generic: <span className="font-semibold">{med.genericName || "None"}</span> • Category: {data.categories.find(c=>c.id === med.categoryId)?.name || "Uncategorized"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg gap-1.5" onClick={handleBillQuick}>
            <ShoppingCart className="h-4 w-4" /> Fast Bill
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={handlePrintLabel}>
            <Printer className="h-4 w-4" /> Print Label
          </Button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div className="p-4 bg-muted/20 border border-border/60 rounded-xl">
          <p className="text-[11px] font-bold text-muted-foreground">Live Physical Stock</p>
          <p className="text-xl font-extrabold mt-1">{stockStats.totalStock} Units</p>
        </div>
        <div className="p-4 bg-muted/20 border border-border/60 rounded-xl">
          <p className="text-[11px] font-bold text-muted-foreground">Reserved Stock</p>
          <p className="text-xl font-extrabold mt-1 text-indigo-600">{med.reservedQuantity || 0} Units</p>
        </div>
        <div className="p-4 bg-muted/20 border border-border/60 rounded-xl">
          <p className="text-[11px] font-bold text-muted-foreground">Available to Bill</p>
          <p className="text-xl font-extrabold mt-1 text-emerald-600">{stockStats.availableStock} Units</p>
        </div>
        <div className="p-4 bg-muted/20 border border-border/60 rounded-xl">
          <p className="text-[11px] font-bold text-muted-foreground">Live MRP Valuation</p>
          <p className="text-xl font-extrabold mt-1 text-slate-800">{currency}{(medBatches[0]?.mrp || 0).toFixed(2)}</p>
        </div>
        <div className="p-4 bg-muted/20 border border-border/60 rounded-xl">
          <p className="text-[11px] font-bold text-muted-foreground">Storage Condition</p>
          <p className="text-xs font-semibold mt-2 text-amber-700 truncate" title={med.storageRequirements}>{med.storageRequirements || "Store below 25°C"}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        navigate({ search: (prev) => ({ ...prev, activeTab: val }) });
      }} className="w-full">
        <TabsList className="flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-border/60 bg-muted/30 p-1 rounded-xl scrollbar-none select-none">
          <TabsTrigger value="profile" className="rounded-lg text-xs font-bold px-4 shrink-0">1. Clinical Profile</TabsTrigger>
          <TabsTrigger value="stock" className="rounded-lg text-xs font-bold px-4 shrink-0">2. Stock & Warehousing</TabsTrigger>
          <TabsTrigger value="alternatives" className="rounded-lg text-xs font-bold px-4 shrink-0">3. Alternatives Engine</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg text-xs font-bold px-4 shrink-0">4. Labeling & POS</TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg text-xs font-bold px-4 shrink-0">5. Customer History</TabsTrigger>
          <TabsTrigger value="purchases" className="rounded-lg text-xs font-bold px-4 shrink-0">6. Supply Chain</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg text-xs font-bold px-4 shrink-0">7. Analytics</TabsTrigger>
        </TabsList>

        {/* 1. CLINICAL PROFILE */}
        <TabsContent value="profile" className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-500" /> General Drug Monograph</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Chemical Salt Composition</span>
                    <span className="font-semibold text-foreground">{med.saltComposition || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Drug Legal Classification</span>
                    <span className="font-semibold text-foreground">{med.drugSchedule || "OTC"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Dosage Form</span>
                    <span className="font-semibold text-foreground">{med.dosageForm || "Tablet"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Packaging Dimension</span>
                    <span className="font-semibold text-foreground">{med.packSize || "10 Tablets"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Manufacturer / Lab</span>
                    <span className="font-semibold text-foreground">{data.manufacturers.find(m => m.id === med.manufacturerId)?.name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">GTIN Code</span>
                    <span className="font-mono text-foreground font-semibold">{med.gtin || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-rose-500" /> Prescribing Information & Safety Data</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Indications / Dosage Details</span>
                    <p className="text-foreground mt-0.5 leading-relaxed">{med.dosageInfo || "No indications configured."}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Safety Directions</span>
                    <p className="text-foreground mt-0.5 leading-relaxed">{med.usageInstructions || "None configured."}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Contraindications</span>
                    <p className="text-foreground mt-0.5 leading-relaxed text-rose-600">{med.contraindications || "No absolute contraindications configured."}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Adverse Drug Reactions</span>
                    <p className="text-foreground mt-0.5 leading-relaxed">{med.sideEffects || "None reported."}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Side metadata panel */}
            <div className="space-y-4">
              <div className="border border-border/80 rounded-2xl p-5 bg-white flex flex-col items-center text-center">
                <div className="w-36 h-36 bg-muted/30 rounded-xl flex items-center justify-center border border-dashed border-border mb-4">
                  <QrCode className="w-24 h-24 text-muted-foreground/80" />
                </div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Serialized QR Identification</h4>
                <p className="text-xs font-mono mt-1 text-foreground bg-muted/40 px-2 py-0.5 rounded">{med.barcode}</p>
              </div>

              <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase border-b pb-1">Catalog Pricing Rules</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PTR (Price to Retailer)</span>
                    <span className="font-mono font-semibold">{currency}{med.ptr?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HSN Code</span>
                    <span className="font-mono font-semibold">{med.hsnCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST Standard Rate</span>
                    <span className="font-mono font-semibold text-teal-600">{med.gstRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. STOCK & WAREHOUSING */}
        <TabsContent value="stock" className="pt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Batches Table */}
              <div className="border border-border/80 rounded-2xl p-5 bg-white">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-500" /> Batch-wise Physical Stock</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/40 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b">
                      <tr>
                        <th className="px-3 py-2">Batch No</th>
                        <th className="px-3 py-2">Mfg. Date</th>
                        <th className="px-3 py-2">Expiry Date</th>
                        <th className="px-3 py-2 text-right">MRP</th>
                        <th className="px-3 py-2 text-right">Cost</th>
                        <th className="px-3 py-2 text-right">Stock</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {medBatches.map((b) => {
                        const isExpired = new Date(b.expiryDate).getTime() < Date.now();
                        return (
                          <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-2.5 font-mono font-semibold text-foreground">{b.batchNumber}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{new Date(b.mfgDate).toLocaleDateString()}</td>
                            <td className={`px-3 py-2.5 font-medium ${isExpired ? 'text-destructive font-bold' : ''}`}>{new Date(b.expiryDate).toLocaleDateString()}</td>
                            <td className="px-3 py-2.5 text-right font-mono">{currency}{b.mrp.toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{currency}{b.purchasePrice.toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">{b.currentStock}</td>
                            <td className="px-3 py-2.5">
                              <StatusBadge status={isExpired ? "expired" : b.status === "near_expiry" ? "near_expiry" : "active"} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Warehouse Configuration */}
            <div className="space-y-4">
              <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-1.5"><Printer className="w-4 h-4 text-emerald-500" /> Storage Settings</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Warehouse Rack Designation</span>
                    <span className="font-mono text-foreground font-bold text-base bg-muted/40 px-2 py-0.5 rounded mt-1 inline-block">{med.rackLocation || "Not set"}</span>
                  </div>
                  <div className="border-t pt-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Min Stock threshold</span>
                      <span className="font-semibold">{med.reorderThreshold} units</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Max Stock threshold</span>
                      <span className="font-semibold">{med.maxStockLevel || 1000} units</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Alerts */}
              {stockStats.totalStock <= med.reorderThreshold && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                  <div className="text-xs">
                    <p className="font-bold">Low Stock Warning</p>
                    <p className="mt-0.5">Physical units ({stockStats.totalStock}) are below the safety threshold ({med.reorderThreshold}).</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 3. ALTERNATIVES ENGINE */}
        <TabsContent value="alternatives" className="pt-4 space-y-6">
          <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-1.5"><Compass className="w-4 h-4 text-[#2563EB]" /> Composition Alternative Recommendation Engine</h3>
            <p className="text-xs text-muted-foreground">The system maps equivalent formulations with identical chemical salts for Rx substitution.</p>

            {genericAlternatives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {genericAlternatives.map((alt) => (
                  <div key={alt.id} className="p-4 rounded-xl border border-border/60 hover:shadow-md transition-all">
                    <h4 className="text-sm font-bold text-foreground">{alt.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Generic: {alt.genericName}</p>
                    <p className="text-xs text-muted-foreground">Rack: {alt.rackLocation || "—"}</p>
                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">In stock</span>
                      <Button asChild size="sm" variant="ghost" className="text-[#2563EB] h-7 text-xs">
                        <Link to={`/dashboard/medicines/${alt.id}`}>View profile</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-muted/10 rounded-xl text-xs text-muted-foreground border border-dashed border-border/60">
                No active generic substitutes with identical chemical salts found in catalog.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 4. BILLING & LABEL WORKSPACE */}
        <TabsContent value="billing" className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-4">
              <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-1.5"><Printer className="w-4 h-4 text-teal-500" /> Barcode & Label Print Hub</h3>
              <div className="space-y-3">
                <div className="p-4 bg-muted/20 rounded-xl border flex flex-col items-center">
                  <Barcode className="w-40 h-12 text-foreground mb-2" />
                  <span className="text-[10px] font-mono text-muted-foreground">ID: {med.id}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => toast.success("Printed barcode label (2x1 in)")}>Print barcode</Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => toast.success("Printed shelf QR strip")}>Print QR Tag</Button>
                </div>
              </div>
            </div>

            <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-4">
              <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-1.5"><ShoppingCart className="w-4 h-4 text-emerald-500" /> Billing POS Integration</h3>
              <p className="text-xs text-muted-foreground">Fast actions to load this chemical configuration directly into active billing invoices.</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-800 text-xs">
                  <span>Standard selling price configured:</span>
                  <span className="font-mono font-bold text-sm">{currency}{(medBatches[0]?.sellingPrice || 0).toFixed(2)}</span>
                </div>
                <Button size="sm" className="w-full bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg gap-2" onClick={handleBillQuick}>
                  <ShoppingCart className="h-4 w-4" /> Load Medicine into Active POS Invoice
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 5. CUSTOMER HISTORY */}
        <TabsContent value="customers" className="pt-4 space-y-6">
          <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-1.5"><Users className="w-4 h-4 text-[#2563EB]" /> Live Dispensation & Refills Tracker</h3>
            <p className="text-xs text-muted-foreground">Log of patients dispensed this chemical batch. Set refill triggers or repeat suggestions.</p>

            {salesHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/40 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="px-3 py-2">Invoice No</th>
                      <th className="px-3 py-2">Customer / Patient</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 text-right">Dispensed Qty</th>
                      <th className="px-3 py-2 text-right">Amount Paid</th>
                      <th className="px-3 py-2">Refill Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {salesHistory.map((s, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-primary font-semibold hover:underline cursor-pointer">{s.invoiceNo}</td>
                        <td className="px-3 py-2.5 font-medium text-foreground">{s.customer}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{s.qty} units</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold">{currency}{s.total.toFixed(2)}</td>
                        <td className="px-3 py-2.5">
                          <button 
                            onClick={() => toast.success(`Refill reminder scheduled for ${s.customer}`)}
                            className="text-[10px] bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded font-semibold hover:bg-blue-100 transition-colors"
                          >
                            Set Reminder
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8 bg-muted/10 rounded-xl text-xs text-muted-foreground border border-dashed border-border/60">
                No customer dispensation history found for this drug.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 6. SUPPLY CHAIN */}
        <TabsContent value="purchases" className="pt-4 space-y-6">
          <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-1.5"><Truck className="w-4 h-4 text-amber-500" /> B2B Supplier Purchasing logs</h3>
            <p className="text-xs text-muted-foreground">Historical logs of procurement orders placed with suppliers for this formulation.</p>

            {poHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/40 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="px-3 py-2">PO Number</th>
                      <th className="px-3 py-2">Supplier</th>
                      <th className="px-3 py-2">Date Placed</th>
                      <th className="px-3 py-2 text-right">Ordered Qty</th>
                      <th className="px-3 py-2 text-right">Negotiated Cost</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {poHistory.map((po, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-primary font-semibold">{po.poNumber}</td>
                        <td className="px-3 py-2.5 text-foreground font-semibold">{po.supplier}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{new Date(po.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{po.qty} units</td>
                        <td className="px-3 py-2.5 text-right font-mono">{currency}{po.price.toFixed(2)}</td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={po.status === "received" ? "healthy" : "low"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8 bg-muted/10 rounded-xl text-xs text-muted-foreground border border-dashed border-border/60">
                No active B2B procurement history found.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 7. ANALYTICS */}
        <TabsContent value="analytics" className="pt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Volume chart */}
            <div className="lg:col-span-2 border border-border/80 rounded-2xl p-5 bg-white">
              <h3 className="text-sm font-bold text-foreground mb-4">Dispensation Volume (Last 6 Months)</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => [`${currency}${value.toLocaleString()}`, "Sales"]} />
                    <Area type="monotone" dataKey="salesVolume" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#volGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Turnovers card */}
            <div className="border border-border/80 rounded-2xl p-5 bg-white space-y-4">
              <h3 className="text-sm font-bold text-foreground border-b pb-2">ERP Turnover Metrics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Inventory Turnover Ratio</span>
                  <span className="font-bold text-emerald-600">8.2x</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Est. Profit Margin</span>
                  <span className="font-bold text-teal-600">32.4%</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">Gross Profit Contribution</span>
                  <span className="font-bold">4.8%</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
