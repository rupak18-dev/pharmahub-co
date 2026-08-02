import { Link } from "@tanstack/react-router";
import { PlusCircle, ShoppingCart, Truck, FileText, UserPlus, BarChart2 } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Add Medicine",
      description: "Register new drug",
      icon: PlusCircle,
      href: "/dashboard/medicines",
      iconColor: "text-blue-500 bg-blue-50",
    },
    {
      title: "New Sale",
      description: "Create POS invoice",
      icon: ShoppingCart,
      href: "/dashboard/sales",
      iconColor: "text-emerald-500 bg-emerald-50",
    },
    {
      title: "New Purchase",
      description: "Add PO or GRN",
      icon: Truck,
      href: "/dashboard/purchases",
      iconColor: "text-violet-500 bg-violet-50",
    },
    {
      title: "Create Invoice",
      description: "Custom billing",
      icon: FileText,
      href: "/dashboard/sales",
      iconColor: "text-amber-500 bg-amber-50",
    },
    {
      title: "Add Customer",
      description: "New CRM entry",
      icon: UserPlus,
      href: "/dashboard",
      iconColor: "text-rose-500 bg-rose-50",
    },
    {
      title: "Generate Report",
      description: "Export analytics",
      icon: BarChart2,
      href: "/dashboard/reports",
      iconColor: "text-indigo-500 bg-indigo-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <Link
            key={idx}
            to={action.href}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
          >
            <div className={`p-3 rounded-xl shadow-sm border border-border/40 group-hover:scale-110 transition-transform duration-300 mb-3 ${action.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground text-center mb-1">{action.title}</h4>
            <p className="text-[10px] text-muted-foreground text-center font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">{action.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
