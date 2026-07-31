import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/pharmacy/AppSidebar";
import { UserMenu } from "@/components/pharmacy/UserMenu";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { BrandMark } from "@/components/pharmacy/BrandMark";
import { 
  Bell, 
  Mail, 
  Search, 
  Store, 
  Mic, 
  QrCode, 
  Plus, 
  Upload, 
  Download,
  Barcode
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const searchParams = routerState.location.search as Record<string, string>;

  const [searchText, setSearchText] = useState(searchParams.q || "");
  const isMedicinesPage = pathname.startsWith("/dashboard/medicines");

  useEffect(() => {
    setSearchText(searchParams.q || "");
  }, [searchParams.q]);

  const handleSearchSubmit = (val: string) => {
    navigate({
      to: "/dashboard/medicines/catalog",
      search: (prev: any) => ({
        ...prev,
        q: val || undefined,
      })
    });
  };

  const [isFocused, setIsFocused] = useState(false);
  const data = useDb((d) => d);

  const searchResults = useMemo(() => {
    if (searchText.trim().length < 2) return null;
    const query = searchText.toLowerCase().trim();

    const matchedMeds = data.medicines.filter((m) =>
      m.name.toLowerCase().includes(query) ||
      (m.genericName ?? "").toLowerCase().includes(query) ||
      (m.brandName ?? "").toLowerCase().includes(query)
    ).slice(0, 3);

    const matchedBatches = data.batches.filter((b) =>
      b.batchNumber.toLowerCase().includes(query)
    ).slice(0, 3);

    const matchedSales = data.sales.filter((s) =>
      s.invoiceNo.toLowerCase().includes(query) ||
      (s.customerName ?? "").toLowerCase().includes(query)
    ).slice(0, 3);

    const hasResults = matchedMeds.length > 0 || matchedBatches.length > 0 || matchedSales.length > 0;

    return hasResults ? { meds: matchedMeds, batches: matchedBatches, sales: matchedSales } : null;
  }, [searchText, data]);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleVoiceSearch = () => {
    toast.info("Voice search listening... (Simulated)");
  };

  const handleBarcodeScan = () => {
    toast.info("Initializing Barcode Scanner camera... (Simulated)");
  };

  const handleQRScan = () => {
    toast.info("Initializing QR Scanner camera... (Simulated)");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 sm:px-6 shadow-sm">
            <SidebarTrigger />
            <div className="sm:hidden">
              <BrandMark size="sm" showText={false} />
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-9 w-9 text-muted-foreground hover:bg-muted/50 rounded-full ml-1"
              onClick={() => navigate({ to: "/dashboard/medicines/catalog", search: { focusSearch: "true" } })}
              title="Search Medicines"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Advanced Global Medicine Search */}
            <div className="hidden lg:flex flex-1 items-center max-w-xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={isMedicinesPage ? "Search medicines..." : "Search medicines, batches, customers..."}
                  className="w-full bg-muted/50 pl-9 pr-24 border-none focus-visible:ring-1 focus-visible:bg-background transition-colors h-9"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    if (isMedicinesPage && pathname === "/dashboard/medicines/catalog") {
                      handleSearchSubmit(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isMedicinesPage) {
                      handleSearchSubmit(searchText);
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                />
                {isMedicinesPage && (
                  <div className="absolute right-1 top-1 flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleVoiceSearch} title="Voice Search">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleBarcodeScan} title="Scan Barcode">
                      <Barcode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleQRScan} title="Scan QR Code">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {isFocused && searchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border shadow-xl rounded-xl p-4 z-50 max-h-[350px] overflow-y-auto space-y-4 min-w-[320px]">
                    {searchResults.meds.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Medicines</h4>
                        {searchResults.meds.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between text-xs p-2 hover:bg-muted/60 rounded-lg cursor-pointer transition-colors"
                            onClick={() => {
                              setSearchText("");
                              navigate({ to: `/dashboard/medicines/${m.id}` });
                            }}
                          >
                            <span className="font-semibold text-foreground">{m.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{m.dosageForm || "Tab"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.batches.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Batches</h4>
                        {searchResults.batches.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between text-xs p-2 hover:bg-muted/60 rounded-lg cursor-pointer transition-colors"
                            onClick={() => {
                              setSearchText("");
                              navigate({ to: "/dashboard/batches" });
                            }}
                          >
                            <span className="font-semibold text-foreground">Batch {b.batchNumber}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">Stock: {b.currentStock}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.sales.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invoices & Customers</h4>
                        {searchResults.sales.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between text-xs p-2 hover:bg-muted/60 rounded-lg cursor-pointer transition-colors"
                            onClick={() => {
                              setSearchText("");
                              navigate({ to: "/dashboard/sales" });
                            }}
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground block truncate">{s.invoiceNo}</span>
                              <span className="text-[10px] text-muted-foreground truncate block">{s.customerName || "Walk-in"}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-600 font-mono">₹{s.grandTotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">





              
              <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 rounded-full mr-1 h-9 w-9">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-600 border-2 border-background">
                  3
                </Badge>
              </Button>

              <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block"></div>

              <UserMenu />
            </div>
          </header>
          <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
