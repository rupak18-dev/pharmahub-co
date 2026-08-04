import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Printer,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { EmptyState } from "@/Components/shared/EmptyState";
import { BRANCHES, BUCKET_META, isReturnable } from "@/lib/expiry";
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "return", label: "Returnable" },
  { value: "expired", label: "Expired" },
];
const SORTABLE = [
  { key: "medicineName", label: "Medicine" },
  { key: "batchNumber", label: "Batch" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "expiryDate", label: "Expiry" },
  { key: "days", label: "Days", align: "right" },
  { key: "quantity", label: "Qty", align: "right" },
  { key: "stockValue", label: "Value", align: "right" },
];
const HIDE_BELOW_LG = new Set(["batchNumber", "manufacturer", "days", "quantity"]);
export function ExpiryInventory({
  rows,
  currency,
  query,
  onQueryChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  manufacturer,
  onManufacturerChange,
  branch,
  onBranchChange,
  shelf,
  onShelfChange,
  categories,
  manufacturers,
  shelves,
  sort,
  onSort,
  selected,
  onToggle,
  onToggleAll,
  onClearSelection,
  onOpenRecommendations,
  onReturn,
  onDiscount,
  onClearDiscount,
  onPriority,
  onClearPriority,
  onSuggest,
  onTransfer,
  onDispose,
  canDispose,
  onBulkReturn,
  onBulkDispose,
  onExport,
  onViewBatch,
  onViewMedicine,
  onPrintLabel,
}) {
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const selectedRows = rows.filter((r) => selected.has(r.batch.id));
  return (
    <div className={cn("space-y-3", selected.size > 0 && "pb-28 md:pb-0")}>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search medicine, batch, salt or manufacturer…"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="min-w-[140px] flex-1 sm:w-36 sm:min-w-0 sm:flex-none">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={manufacturer} onValueChange={onManufacturerChange}>
            <SelectTrigger className="min-w-[140px] flex-1 sm:w-36 sm:min-w-0 sm:flex-none">
              <SelectValue placeholder="All manufacturers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All manufacturers</SelectItem>
              {manufacturers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={branch} onValueChange={onBranchChange}>
            <SelectTrigger className="min-w-[140px] flex-1 sm:w-36 sm:min-w-0 sm:flex-none">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {shelves.length > 0 &&
                BRANCHES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={shelf} onValueChange={onShelfChange}>
            <SelectTrigger className="min-w-[140px] flex-1 sm:w-32 sm:min-w-0 sm:flex-none">
              <SelectValue placeholder="All shelves" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All shelves</SelectItem>
              {shelves.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!rows.length}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Export as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport("csv")}>
                <FileText className="h-4 w-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("xls")}>
                <FileSpreadsheet className="h-4 w-4" /> Excel (.xls)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onStatusChange(f.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              status === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto pr-1 text-xs text-muted-foreground">
          {rows.length} batch{rows.length !== 1 ? "es" : ""}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No batches in view"
          description="Adjust the time window or clear filters to see more stock."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onQueryChange("");
                onStatusChange("all");
                onCategoryChange("all");
                onManufacturerChange("all");
                onBranchChange("all");
                onShelfChange("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onToggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                {SORTABLE.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "cursor-pointer select-none",
                      HIDE_BELOW_LG.has(col.key) && "hidden lg:table-cell",
                      col.align === "right" && "text-right",
                    )}
                    onClick={() => onSort(col.key)}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        sort?.key === col.key && "text-foreground",
                      )}
                    >
                      {col.label}
                      {sort?.key === col.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Shelf</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const meta = BUCKET_META[row.bucket];
                const returnable = isReturnable(row);
                return (
                  <TableRow key={row.batch.id} data-selected={selected.has(row.batch.id)}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(row.batch.id)}
                        onCheckedChange={() => onToggle(row.batch.id)}
                        aria-label={`Select ${row.medicineName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => onViewMedicine(row.batch.medicineId)}
                          className="text-left font-medium underline-offset-2 hover:underline"
                        >
                          {row.medicineName}
                        </button>
                        <span className="text-xs text-muted-foreground">{row.salt}</span>
                        {(row.batch.discountPct || row.batch.fefo || row.batch.suggestAtPos) && (
                          <div className="flex flex-wrap gap-1">
                            {row.batch.discountPct && (
                              <span className="rounded bg-info/15 px-1.5 py-0.5 text-[10px] font-medium text-info">
                                {row.batch.discountPct}% discount
                              </span>
                            )}
                            {row.batch.fefo && (
                              <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground">
                                FEFO first
                              </span>
                            )}
                            {row.batch.suggestAtPos && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                Suggest at POS
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-xs">{row.batchNumber}</span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {row.manufacturer}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(row.expiryDate).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="hidden text-right lg:table-cell">
                      <DaysPill days={row.days} />
                    </TableCell>
                    <TableCell className="hidden text-right font-mono tabular-nums lg:table-cell">
                      {row.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {currency}
                      {row.stockValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {row.shelf}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                          meta.chip,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RowActions
                        row={row}
                        returnable={returnable}
                        canDispose={canDispose}
                        onViewBatch={() => onViewBatch(row)}
                        onPrintLabel={() => onPrintLabel(row)}
                        onRecommend={() => onOpenRecommendations(row.batch.id)}
                        onReturn={() => onReturn(row)}
                        onDiscount={() => onDiscount(row)}
                        onClearDiscount={() => onClearDiscount(row)}
                        onPriority={() => onPriority(row)}
                        onClearPriority={() => onClearPriority(row)}
                        onSuggest={() => onSuggest(row)}
                        onTransfer={() => onTransfer(row)}
                        onDispose={() => onDispose(row)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {selected.size > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="inline-flex items-center justify-center rounded-full border border-border p-2 text-muted-foreground"
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selected.size} selected</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedRows.length} batch{selectedRows.length !== 1 ? "es" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onBulkReturn(selectedRows)}
                    disabled={!selectedRows.some(isReturnable)}
                  >
                    Return
                  </Button>
                  {canDispose && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onBulkDispose(selectedRows)}
                    >
                      Dispose
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {selected.size > 0 && (
            <div className="sticky bottom-0 hidden items-center gap-2 border-t border-border bg-accent/60 px-4 py-2.5 backdrop-blur md:flex">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={onClearSelection}>
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onBulkReturn(selectedRows)}
                  disabled={!selectedRows.some(isReturnable)}
                >
                  Return selected
                </Button>
                {canDispose && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onBulkDispose(selectedRows)}
                  >
                    Dispose selected
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function DaysPill({ days }) {
  const text =
    days < 0
      ? `Overdue ${Math.abs(days)}d`
      : days === 0
        ? "Today"
        : days === 1
          ? "1 day"
          : `${days} days`;
  const cls =
    days <= 0
      ? "text-destructive"
      : days <= 3
        ? "text-warning-foreground font-medium"
        : days <= 30
          ? "text-warning-foreground/80"
          : "text-success";
  return <span className={cn("font-mono text-xs tabular-nums", cls)}>{text}</span>;
}
function RowActions({
  row,
  returnable,
  canDispose,
  onViewBatch,
  onPrintLabel,
  onRecommend,
  onReturn,
  onDiscount,
  onClearDiscount,
  onPriority,
  onClearPriority,
  onSuggest,
  onTransfer,
  onDispose,
}) {
  const saleable = row.days >= 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">{row.medicineName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onViewBatch}>
          <Eye className="h-4 w-4" /> View batch details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPrintLabel}>
          <Printer className="h-4 w-4" /> Print shelf label
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onRecommend}>View smart recommendations</DropdownMenuItem>
        <DropdownMenuItem onClick={onReturn} disabled={!returnable}>
          Return to supplier
        </DropdownMenuItem>
        {saleable && (
          <>
            {row.batch.discountPct ? (
              <DropdownMenuItem onClick={onClearDiscount}>
                Clear {row.batch.discountPct}% discount flag
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onDiscount}>Apply quick-sale discount</DropdownMenuItem>
            )}
            {row.batch.fefo ? (
              <DropdownMenuItem onClick={onClearPriority}>Clear FEFO priority</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onPriority}>Prioritize in billing (FEFO)</DropdownMenuItem>
            )}
            {row.batch.suggestAtPos ? (
              <DropdownMenuItem onClick={onSuggest}>Stop suggesting at POS</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onSuggest}>Suggest at POS (auto-swap)</DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onTransfer}>Transfer to another branch</DropdownMenuItem>
          </>
        )}
        {canDispose && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDispose}
              className="text-destructive focus:text-destructive"
            >
              Dispose / write off
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
