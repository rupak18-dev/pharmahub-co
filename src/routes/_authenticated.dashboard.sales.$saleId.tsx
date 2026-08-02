import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { useDb } from "@/hooks/useDb";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard/sales/$saleId")({
  head: () => ({ meta: [{ title: "Invoice Â· PharmaHub" }] }),
  component: ReceiptPage,
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">Sale not found.</div>
  ),
});

function ReceiptPage() {
  const { saleId } = Route.useParams();
  const sale = useDb((d) => d.sales.find((s) => s.id === saleId));
  const currency = useDb((d) => d.settings.currency);
  const orgName = useDb((d) => d.profiles.find((p) => p.role === "Owner")?.orgName ?? "PharmaHub");

  if (!sale) throw notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/sales"><ArrowLeft className="mr-1 h-4 w-4" /> Back to sales</Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> Print
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 print:border-0 print:shadow-none">
        <div className="mb-4 flex items-start justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold">{orgName}</h2>
            <p className="text-xs text-muted-foreground">Tax invoice</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold">{sale.invoiceNo}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(sale.createdAt), "PPp")}</p>
            {sale.status === "voided" && (
              <p className="mt-1 rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">VOIDED</p>
            )}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p>{sale.customerName ?? "Walk-in"}</p>
            {sale.customerPhone && <p className="text-xs text-muted-foreground">{sale.customerPhone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Cashier</p>
            <p>{sale.createdByName}</p>
            <p className="text-xs capitalize text-muted-foreground">Paid via {sale.paymentMode}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium">Batch</th>
              <th className="py-2 font-medium text-right">Qty</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">GST</th>
              <th className="py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sale.items.map((it, i) => (
              <tr key={i}>
                <td className="py-2">{it.medicineName}</td>
                <td className="py-2 font-mono text-xs text-muted-foreground">{it.batchNumber}</td>
                <td className="py-2 text-right font-mono">{it.quantity}</td>
                <td className="py-2 text-right font-mono">{currency}{it.unitPrice.toFixed(2)}</td>
                <td className="py-2 text-right font-mono">{it.gstRate}%</td>
                <td className="py-2 text-right font-mono font-semibold">{currency}{it.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-mono">{currency}{sale.subtotal.toFixed(2)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="font-mono">-{currency}{sale.discountTotal.toFixed(2)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">GST</dt><dd className="font-mono">{currency}{sale.gstTotal.toFixed(2)}</dd></div>
          <div className="flex justify-between text-xs"><dt className="text-muted-foreground">Round off</dt><dd className="font-mono">{currency}{sale.roundOff.toFixed(2)}</dd></div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold"><dt>Grand total</dt><dd className="font-mono">{currency}{sale.grandTotal.toFixed(2)}</dd></div>
          <div className="flex justify-between text-xs text-muted-foreground"><dt>Tendered</dt><dd className="font-mono">{currency}{sale.tender.toFixed(2)}</dd></div>
          <div className="flex justify-between text-xs text-muted-foreground"><dt>Change</dt><dd className="font-mono">{currency}{sale.change.toFixed(2)}</dd></div>
        </dl>

        <p className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Thank you for your purchase.
        </p>
      </div>
    </div>
  );
}
