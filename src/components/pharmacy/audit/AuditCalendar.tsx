import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { format, isSameDay, startOfDay, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useFloating, autoUpdate, offset, flip, shift } from "@floating-ui/react-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
  Play,
  Eye,
  Search,
  Plus,
  X,
  MapPin,
  User,
  Layers,
  Sparkles,
  Check,
  Clock,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  AUDIT_STATUS_META,
  AUDIT_TYPE_DOT,
  AUDIT_TYPE_LABEL,
  bucketAudit,
  calendarGrid,
  CalendarDay,
} from "@/lib/audit";
import type { Audit, AuditStatus, AuditType } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FILTER_OPTIONS: { id: CalendarFilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "live", label: "Live" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
  { id: "upcoming", label: "Upcoming" },
];

export type CalendarFilterType =
  "all" | "overdue" | "today" | "paused" | "live" | "completed" | "upcoming";

interface AuditCalendarProps {
  audits: Audit[];
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onView: (id: string) => void;
  onNewAudit?: () => void;
}

export function AuditCalendar({
  audits,
  onSelect,
  onStart,
  onView,
  onNewAudit,
}: AuditCalendarProps) {
  const now = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [activeFilters, setActiveFilters] = useState<CalendarFilterType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const isLg = useMediaQuery("(min-width: 1024px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  const shouldReduceMotion = useReducedMotion();

  // Floating popover state (desktop) / bottom sheet state (mobile)
  const isMobile = useIsMobile();
  const [isDayOpen, setIsDayOpen] = useState(false);
  const dayCellKey = format(selectedDate, "yyyy-MM-dd");

  const { refs, floatingStyles } = useFloating({
    open: isDayOpen,
    strategy: "fixed",
    placement: "right",
    middleware: [
      offset(8),
      flip({ padding: 8, fallbackPlacements: ["bottom-end", "bottom", "left"] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Anchor the floating popover to the currently selected calendar cell
  useEffect(() => {
    if (!isDayOpen) return;
    const el = gridRef.current?.querySelector(`[data-cell-key="${dayCellKey}"]`);
    if (el instanceof HTMLElement) refs.setReference(el);
  }, [isDayOpen, dayCellKey, cursor.year, cursor.month, refs]);

  // Dismiss on Escape, or on click outside the calendar grid & popover
  useEffect(() => {
    if (!isDayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDayOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (gridRef.current?.contains(t)) return;
      if (refs.floating.current?.contains(t)) return;
      setIsDayOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isDayOpen, refs.floating]);

  // Memoized Calendar Grid Cells
  const cells = useMemo(
    () => calendarGrid(cursor.year, cursor.month, audits),
    [cursor.year, cursor.month, audits],
  );

  // Check if current month has any audits at all
  const monthAuditsCount = useMemo(() => {
    return cells.reduce((acc, cell) => acc + (cell.inMonth ? cell.audits.length : 0), 0);
  }, [cells]);

  const moveMonth = (dir: -1 | 1) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + dir, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setIsDayOpen(false);
  };

  const jumpToToday = () => {
    const today = new Date();
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedDate(today);
    anchorPopover(today);
    setIsDayOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    anchorPopover(date);
    setIsDayOpen(true);
  };

  const anchorPopover = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const el = gridRef.current?.querySelector(`[data-cell-key="${key}"]`);
    if (el instanceof HTMLElement) refs.setReference(el);
  };

  // Keyboard navigation support across calendar grid
  const handleKeyDown = (e: React.KeyboardEvent, currentDate: Date) => {
    let daysToAdd = 0;
    if (e.key === "ArrowRight") daysToAdd = 1;
    else if (e.key === "ArrowLeft") daysToAdd = -1;
    else if (e.key === "ArrowDown") daysToAdd = 7;
    else if (e.key === "ArrowUp") daysToAdd = -7;

    if (daysToAdd !== 0) {
      e.preventDefault();
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + daysToAdd);
      setSelectedDate(newDate);
      // Auto adjust month cursor if navigated outside current month
      if (newDate.getMonth() !== cursor.month || newDate.getFullYear() !== cursor.year) {
        setCursor({ year: newDate.getFullYear(), month: newDate.getMonth() });
      }
    }
  };

  // Filter & Search Logic for Audits
  const filterAudit = useCallback(
    (audit: Audit): boolean => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = audit.auditNumber.toLowerCase().includes(q);
        const matchTitle = audit.title.toLowerCase().includes(q);
        const matchBranch = audit.branch.toLowerCase().includes(q);
        const matchAuditor = (audit.createdByName ?? "").toLowerCase().includes(q);
        if (!matchNumber && !matchTitle && !matchBranch && !matchAuditor) {
          return false;
        }
      }

      // 2. Smart Status Filter (multi-select, OR semantics; empty = All)
      if (activeFilters.length === 0) return true;
      const bucket = bucketAudit(audit, now);
      return activeFilters.some((f) => {
        switch (f) {
          case "overdue":
            return (
              bucket === "overdue" && audit.status !== "completed" && audit.status !== "cancelled"
            );
          case "today":
            return isSameDay(new Date(audit.scheduledDate), now);
          case "paused":
            return audit.status === "paused";
          case "live":
            return audit.status === "in_progress";
          case "completed":
            return audit.status === "completed" || audit.status === "approved";
          case "upcoming":
            return (
              bucket === "upcoming" && audit.status !== "completed" && audit.status !== "cancelled"
            );
          default:
            return true;
        }
      });
    },
    [searchQuery, activeFilters, now],
  );

  const toggleFilter = useCallback((id: CalendarFilterType, checked: boolean) => {
    setActiveFilters((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  }, []);

  // Audits on the selected date matching active filters & search query
  const selectedDateAudits = useMemo(() => {
    return audits
      .filter((a) => isSameDay(new Date(a.scheduledDate), selectedDate))
      .filter(filterAudit);
  }, [audits, selectedDate, filterAudit]);

  // Overall counts for filter badges
  const filterCounts = useMemo(() => {
    const overdue = audits.filter(
      (a) =>
        bucketAudit(a, now) === "overdue" && a.status !== "completed" && a.status !== "cancelled",
    ).length;
    const today = audits.filter((a) => isSameDay(new Date(a.scheduledDate), now)).length;
    const paused = audits.filter((a) => a.status === "paused").length;
    const live = audits.filter((a) => a.status === "in_progress").length;
    const completed = audits.filter(
      (a) => a.status === "completed" || a.status === "approved",
    ).length;
    const upcoming = audits.filter(
      (a) =>
        bucketAudit(a, now) === "upcoming" && a.status !== "completed" && a.status !== "cancelled",
    ).length;

    return {
      all: audits.filter((a) => a.status !== "cancelled").length,
      overdue,
      today,
      paused,
      live,
      completed,
      upcoming,
    };
  }, [audits, now]);

  return (
    <div className="w-full space-y-3 md:space-y-6">
      {/* 1. Google Calendar Style Top Toolbar */}
      <div className="rounded-xl border border-border/80 bg-card p-3 md:p-4 shadow-2xs space-y-3">
        {/* === Mobile Toolbar (<768px) === */}
        <div className="md:hidden space-y-3">
          {/* Row 1: Month navigation */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 text-foreground hover:bg-background hover:shadow-2xs"
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              {format(new Date(cursor.year, cursor.month, 1), "MMMM yyyy")}
            </h2>

            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 text-foreground hover:bg-background hover:shadow-2xs"
                onClick={() => moveMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row 2: Today, Search, Filter & Legend overflow */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-11 shrink-0 text-xs font-semibold border-border/80"
              onClick={jumpToToday}
            >
              Today
            </Button>

            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search audits"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 text-xs pl-8 pr-7 bg-background border-border/80 focus-visible:ring-1"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-11 shrink-0 text-xs font-semibold gap-1.5 border-border/80"
                  aria-label="Filter audits by status"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilters.length > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground leading-normal">
                      {activeFilters.length}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <FilterDropdown
                activeFilters={activeFilters}
                counts={filterCounts}
                onToggle={toggleFilter}
                onClear={() => setActiveFilters([])}
              />
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-11 w-11 shrink-0 border-border/80"
                  aria-label="Legend"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-3.5 space-y-3 text-xs">
                <LegendContent />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* === Desktop & Tablet Toolbar (≥768px) === */}
        <div className="hidden md:flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left Controls: Prev, Today, Next & Month Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-foreground hover:bg-background hover:shadow-2xs"
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs font-bold px-3 text-primary hover:bg-primary/10"
                onClick={jumpToToday}
              >
                Today
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-foreground hover:bg-background hover:shadow-2xs"
                onClick={() => moveMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2.5 ml-1">
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                {format(new Date(cursor.year, cursor.month, 1), "MMMM yyyy")}
              </h2>
              <Badge
                variant="outline"
                className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:inline-flex"
              >
                Month View
              </Badge>
            </div>
          </div>

          {/* Right Controls: Search, Filter & Legend */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Audit Box */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search audit, branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs pl-8 pr-7 bg-background border-border/80 focus-visible:ring-1"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 font-medium border-border/80"
                >
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Filters</span>
                  {activeFilters.length > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground leading-normal">
                      {activeFilters.length}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <FilterDropdown
                activeFilters={activeFilters}
                counts={filterCounts}
                onToggle={toggleFilter}
                onClear={() => setActiveFilters([])}
              />
            </DropdownMenu>

            {/* Legend Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 font-medium border-border/80"
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Legend</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-3.5 space-y-3 text-xs shadow-md">
                <LegendContent />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* 2. Google Calendar Style Month Grid */}
      <div className="rounded-xl border border-border/80 bg-card p-2 space-y-1.5 shadow-2xs md:p-4 md:space-y-2">
        {/* Empty Month Experience Notice */}
        {monthAuditsCount === 0 && (
          <div className="mb-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 text-center text-xs text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2 md:mb-3 md:p-3">
            <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
            <span>
              No audits scheduled this month (
              <strong>{format(new Date(cursor.year, cursor.month, 1), "MMMM yyyy")}</strong>).
            </span>
            {onNewAudit && (
              <button
                type="button"
                onClick={onNewAudit}
                className="font-bold underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-200"
              >
                Create your first audit
              </button>
            )}
          </div>
        )}

        {/* Sticky Weekday Headers */}
        <div className="grid grid-cols-7 text-center border-b border-border/60 pb-1 md:pb-2">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="py-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground/90"
            >
              <span className="md:hidden">{w.slice(0, 1)}</span>
              <span className="hidden md:inline">{w}</span>
            </div>
          ))}
        </div>

        {/* 7-Column Grid Cells */}
        <div ref={gridRef} className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.map((cell) => {
            const isSelected = isSameDay(cell.date, selectedDate);
            const filteredAudits = cell.audits.filter(filterAudit);

            const hasOverdue = cell.audits.some(
              (a) =>
                bucketAudit(a, now) === "overdue" &&
                a.status !== "completed" &&
                a.status !== "cancelled",
            );
            const hasLive = cell.audits.some((a) => a.status === "in_progress");
            const hasPaused = cell.audits.some((a) => a.status === "paused");
            const hasCompleted =
              cell.audits.length > 0 &&
              cell.audits.every(
                (a) =>
                  a.status === "completed" || a.status === "approved" || a.status === "cancelled",
              );

            // Visible chips scale with breakpoint: 2 on lg+, 1 on md, 0 on mobile
            const chipCount = isLg ? 2 : isMd ? 1 : 0;
            const visibleAudits = filteredAudits.slice(0, chipCount);
            const overflowCount = Math.max(0, filteredAudits.length - visibleAudits.length);

            const mobileDotClass = hasOverdue
              ? "bg-destructive"
              : hasLive
                ? "bg-emerald-500"
                : hasPaused
                  ? "bg-amber-500"
                  : "bg-muted-foreground";

            return (
              <button
                key={cell.key}
                type="button"
                tabIndex={0}
                data-cell-key={cell.key}
                onClick={() => handleDateClick(cell.date)}
                onKeyDown={(e) => handleKeyDown(e, cell.date)}
                aria-label={`${format(cell.date, "EEEE, MMMM d, yyyy")}. ${cell.audits.length} audits.`}
                aria-expanded={isSelected ? isDayOpen : undefined}
                className={cn(
                  "relative flex flex-col rounded-lg border text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
                  "items-center justify-center gap-1 p-1 md:items-stretch md:justify-between md:gap-0 md:p-1.5",
                  "min-h-[72px] sm:min-h-[80px] md:min-h-[90px] lg:min-h-[112px] xl:min-h-[132px]",
                  cell.inMonth ? "bg-background" : "bg-muted/15 opacity-45",
                  isSelected
                    ? "border-2 border-primary/70 bg-primary/10 md:border md:border-primary md:bg-primary/[0.04] md:ring-2 md:ring-primary/30 md:shadow-sm"
                    : "border border-border/60 md:hover:border-primary/40 md:hover:bg-accent/40 md:hover:shadow-md",
                )}
              >
                {/* Mobile: filled date circle only */}
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all md:hidden",
                    cell.isToday || isSelected
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-foreground font-medium",
                  )}
                >
                  {cell.date.getDate()}
                </span>

                {/* Mobile: compact event count badge (e.g. • 2) */}
                {filteredAudits.length > 0 && (
                  <span
                    className="flex items-center gap-1 px-1 text-[10px] font-bold text-foreground/80 md:hidden"
                    title={`${filteredAudits.length} audit${filteredAudits.length !== 1 ? "s" : ""}`}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", mobileDotClass)} />
                    {filteredAudits.length}
                  </span>
                )}

                {/* Desktop & Tablet: Day Header with status dots */}
                <div className="hidden w-full items-center justify-between md:flex">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs transition-all",
                      cell.isToday
                        ? "bg-primary text-primary-foreground font-bold shadow-2xs ring-2 ring-primary/30"
                        : isSelected
                          ? "text-primary font-bold bg-primary/10"
                          : "text-foreground font-medium",
                    )}
                  >
                    {cell.date.getDate()}
                  </span>

                  {/* Day Status Dot Indicators */}
                  <div className="flex items-center gap-1">
                    {hasOverdue && (
                      <span
                        className="h-2 w-2 rounded-full bg-destructive animate-pulse"
                        title="Contains overdue audits"
                      />
                    )}
                    {hasLive && !hasOverdue && (
                      <span
                        className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                        title="Live audit in progress"
                      />
                    )}
                    {hasPaused && !hasOverdue && !hasLive && (
                      <span className="h-2 w-2 rounded-full bg-amber-500" title="Paused audit" />
                    )}
                    {hasCompleted && !hasOverdue && !hasLive && !hasPaused && (
                      <Check className="h-3 w-3 text-muted-foreground/70" />
                    )}
                  </div>
                </div>

                {/* Compact Event Chips (Google Calendar Style) */}
                <div className="hidden w-full space-y-1 mt-1 md:block">
                  {isMd ? (
                    <>
                      {visibleAudits.map((a) => {
                        const isOverdueAudit =
                          bucketAudit(a, now) === "overdue" &&
                          a.status !== "completed" &&
                          a.status !== "cancelled";

                        return (
                          <div
                            key={a.id}
                            className={cn(
                              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] leading-tight font-medium border truncate transition-colors",
                              isOverdueAudit
                                ? "bg-destructive/10 border-destructive/30 text-destructive font-semibold"
                                : "bg-muted/50 border-border/40 text-foreground hover:bg-accent",
                            )}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: isOverdueAudit
                                  ? "#ef4444"
                                  : AUDIT_TYPE_DOT[a.type],
                              }}
                            />
                            <span className="truncate">
                              {AUDIT_TYPE_LABEL[a.type].replace(" Audit", "")}
                            </span>
                          </div>
                        );
                      })}

                      {overflowCount > 0 && (
                        <div className="text-[10px] font-bold text-primary hover:underline px-1">
                          +{overflowCount} more
                        </div>
                      )}
                    </>
                  ) : (
                    filteredAudits.length > 0 && (
                      <div className="text-[10px] font-bold text-primary leading-tight px-1">
                        +{filteredAudits.length}
                      </div>
                    )
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Floating Day Popover (Desktop) & Bottom Sheet (Mobile) */}
      <AnimatePresence>
        {!isMobile && isDayOpen && (
          <motion.div
            ref={refs.setFloating}
            style={floatingStyles}
            role="dialog"
            aria-label={`Audits on ${format(selectedDate, "EEEE, d MMMM yyyy")}`}
            className="z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.05 : 0.2,
              ease: "easeOut",
            }}
          >
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 6 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
              transition={
                shouldReduceMotion ? { duration: 0.05 } : { duration: 0.2, ease: "easeOut" }
              }
              className="w-80 max-w-[calc(100vw-1rem)] rounded-xl border border-border/80 bg-card p-3 shadow-lg"
            >
              <DayAuditList
                date={selectedDate}
                audits={selectedDateAudits}
                now={now}
                onSelect={onSelect}
                onStart={onStart}
                onView={onView}
                onNewAudit={onNewAudit}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer
        open={isMobile && isDayOpen}
        onOpenChange={setIsDayOpen}
        shouldScaleBackground={false}
      >
        <DrawerContent className="max-h-[72vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {isSameDay(selectedDate, now) ? "Today — " : ""}
              {format(selectedDate, "EEEE, d MMMM yyyy")}
            </DrawerTitle>
            <DrawerDescription>
              {selectedDateAudits.length} Audit{selectedDateAudits.length !== 1 ? "s" : ""}{" "}
              scheduled for this day
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="max-h-[58vh] px-4 pb-6">
            <DayAuditList
              date={selectedDate}
              audits={selectedDateAudits}
              now={now}
              onSelect={onSelect}
              onStart={onStart}
              onView={onView}
              onNewAudit={onNewAudit}
              showHeader={false}
              mobile={isMobile}
            />
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Linear-Inspired Audit Detail Card Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared Legend Content (desktop popover & mobile overflow menu)
// ---------------------------------------------------------------------------

function FilterDropdown({
  activeFilters,
  counts,
  onToggle,
  onClear,
}: {
  activeFilters: CalendarFilterType[];
  counts: {
    all: number;
    overdue: number;
    today: number;
    paused: number;
    live: number;
    completed: number;
    upcoming: number;
  };
  onToggle: (id: CalendarFilterType, checked: boolean) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenuContent align="end" className="w-60 p-1.5 text-xs" sideOffset={6}>
      <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1.5">
        Status Filters
      </DropdownMenuLabel>
      <DropdownMenuCheckboxItem
        checked={activeFilters.length === 0}
        onSelect={(e) => e.preventDefault()}
        onCheckedChange={(c) => {
          if (c) onClear();
        }}
        className="py-2"
      >
        <span className="flex-1">All</span>
        <span className="ml-auto text-[10px] font-semibold text-muted-foreground">
          {counts.all}
        </span>
      </DropdownMenuCheckboxItem>
      {FILTER_OPTIONS.filter((f) => f.id !== "all").map((f) => (
        <DropdownMenuCheckboxItem
          key={f.id}
          checked={activeFilters.includes(f.id)}
          onSelect={(e) => e.preventDefault()}
          onCheckedChange={(c) => onToggle(f.id, c)}
          className="py-2"
        >
          <span className="flex-1">{f.label}</span>
          <span className="ml-auto text-[10px] font-semibold text-muted-foreground">
            {counts[f.id]}
          </span>
        </DropdownMenuCheckboxItem>
      ))}
      {activeFilters.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              onClear();
            }}
            className="py-2 text-muted-foreground focus:text-foreground"
          >
            Clear Filters
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
}

function LegendContent() {
  return (
    <>
      <div className="font-bold text-foreground border-b pb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground flex items-center justify-between">
        <span>Audit Types & Indicators</span>
      </div>
      <div className="space-y-2">
        {(Object.keys(AUDIT_TYPE_LABEL) as (keyof typeof AUDIT_TYPE_LABEL)[]).map((t) => (
          <div key={t} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: AUDIT_TYPE_DOT[t] }}
              />
              <span className="font-medium text-foreground">{AUDIT_TYPE_LABEL[t]}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="border-t pt-2 space-y-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span>Overdue day indicator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live / In Progress audit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Paused audit</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-3 w-3 text-muted-foreground shrink-0" />
          <span>Completed audit</span>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared Day Audits List (rendered inside the desktop popover & mobile sheet)
// ---------------------------------------------------------------------------

function DayAuditList({
  date,
  audits,
  now,
  onSelect,
  onStart,
  onView,
  onNewAudit,
  showHeader = true,
  mobile = false,
}: {
  date: Date;
  audits: Audit[];
  now: Date;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onView: (id: string) => void;
  onNewAudit?: () => void;
  showHeader?: boolean;
  mobile?: boolean;
}) {
  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <h3 className="text-sm font-extrabold tracking-tight text-foreground">
            {isSameDay(date, now) ? "Today — " : ""}
            {format(date, "EEEE, d MMMM yyyy")}
          </h3>
          <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 shrink-0">
            {audits.length} Audit{audits.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      )}

      {audits.length === 0 ? (
        <div className="py-8 px-4 rounded-xl border border-dashed border-border/80 text-center space-y-3 bg-muted/10">
          <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">No audits scheduled</h4>
            <p className="text-xs text-muted-foreground">
              Enjoy your quiet day or schedule a new audit.
            </p>
          </div>
          {onNewAudit && (
            <Button
              size="sm"
              variant="outline"
              onClick={onNewAudit}
              className="h-8 text-xs font-bold gap-1.5 border-border shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>Schedule Audit</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {audits.map((audit) => (
            <AuditDayRow
              key={audit.id}
              audit={audit}
              now={now}
              onSelect={onSelect}
              onStart={onStart}
              onView={onView}
              mobile={mobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditDayRow({
  audit,
  now,
  onSelect,
  onStart,
  onView,
  mobile = false,
}: {
  audit: Audit;
  now: Date;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onView: (id: string) => void;
  mobile?: boolean;
}) {
  const isOverdue =
    bucketAudit(audit, now) === "overdue" &&
    audit.status !== "completed" &&
    audit.status !== "cancelled";

  return (
    <div
      onClick={() => onSelect(audit.id)}
      className={cn(
        "group rounded-xl border p-3 transition-all cursor-pointer shadow-2xs hover:shadow-sm",
        isOverdue
          ? "border-destructive/40 bg-destructive/[0.02] hover:border-destructive"
          : "border-border/80 bg-card hover:border-primary/50",
      )}
    >
      {/* Header: Audit Number, Type Dot & Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: AUDIT_TYPE_DOT[audit.type] }}
          />
          <span className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-tight">
            {audit.auditNumber}
          </span>
        </div>

        <Badge
          className={cn(
            "border px-2 py-0.5 text-[10px] font-semibold shrink-0 uppercase tracking-wider",
            isOverdue
              ? "bg-destructive/15 text-destructive border-destructive/30"
              : AUDIT_STATUS_META[audit.status].chip,
          )}
        >
          {isOverdue ? "Overdue" : AUDIT_STATUS_META[audit.status].label}
        </Badge>
      </div>

      {/* Title */}
      <h4 className="mt-1.5 text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
        {audit.title}
      </h4>

      {/* Metadata: Branch, Type, Scheduled Time, Batches, Auditor */}
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1 truncate">
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
          <span className="truncate">{audit.branch}</span>
        </span>

        <span className="flex items-center gap-1 truncate">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: AUDIT_TYPE_DOT[audit.type] }}
          />
          <span className="truncate">{AUDIT_TYPE_LABEL[audit.type]}</span>
        </span>

        <span className="flex items-center gap-1 truncate">
          <Clock className="h-3 w-3 shrink-0 text-muted-foreground/70" />
          <span>{format(new Date(audit.scheduledDate), "h:mm a")}</span>
        </span>

        <span className="flex items-center gap-1 truncate">
          <Layers className="h-3 w-3 shrink-0 text-muted-foreground/70" />
          <span>{audit.batchIds.length} Batches</span>
        </span>

        {audit.createdByName && (
          <span className="flex items-center gap-1 truncate col-span-2">
            <User className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{audit.createdByName}</span>
          </span>
        )}
      </div>

      {/* Footer: Primary Action Button */}
      <div
        className="flex items-center justify-between pt-2.5 mt-2 border-t border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] font-medium text-muted-foreground">
          {format(new Date(audit.scheduledDate), "EEE, d MMM")}
        </span>

        <div>
          {audit.status === "scheduled" && (
            <Button
              size="sm"
              className={cn(
                "text-xs px-2.5 font-bold gap-1 shadow-2xs",
                mobile ? "min-h-[44px]" : "h-7",
              )}
              onClick={() => onStart(audit.id)}
            >
              <Play className="h-3 w-3" /> Start Audit
            </Button>
          )}

          {(audit.status === "in_progress" || audit.status === "paused") && (
            <Button
              size="sm"
              className={cn(
                "text-xs px-2.5 font-bold gap-1 shadow-2xs",
                mobile ? "min-h-[44px]" : "h-7",
              )}
              onClick={() => onView(audit.id)}
            >
              <Play className="h-3 w-3" /> {audit.status === "paused" ? "Resume" : "Count Now"}
            </Button>
          )}

          {(audit.status === "completed" ||
            audit.status === "pending_review" ||
            audit.status === "approved" ||
            audit.status === "cancelled") && (
            <Button
              size="sm"
              variant="outline"
              className={cn("text-xs px-2.5 font-semibold gap-1", mobile ? "min-h-[44px]" : "h-7")}
              onClick={() => onSelect(audit.id)}
            >
              <Eye className="h-3 w-3" /> View Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
