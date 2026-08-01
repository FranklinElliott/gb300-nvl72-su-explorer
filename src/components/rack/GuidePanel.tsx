import { useEffect, useMemo, useState } from "react";
import {
  Search,
  AlertTriangle,
  ChevronDown,
  BookOpen,
  ExternalLink,
  X,
} from "lucide-react";
import {
  GUIDE_CATEGORIES,
  SEVERITY_META,
  VENDOR_META,
  TROUBLESHOOTING_GUIDE,
  searchGuide,
  type GuideSection,
  type Severity,
  type Vendor,
} from "@/data/troubleshooting";
import type { ComponentKind } from "@/data/rack";
import { cn } from "@/lib/utils";

type GuidePanelProps = {
  filterKind: ComponentKind | null;
  onClearKindFilter: () => void;
};

export function GuidePanel({ filterKind, onClearKindFilter }: GuidePanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [vendor, setVendor] = useState<Vendor | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(
    () =>
      searchGuide(query, {
        category,
        severity,
        vendor,
        filterKind: filterKind === "frame" ? null : filterKind,
      }),
    [query, category, severity, vendor, filterKind],
  );

  // Keep selection valid when filters change; auto-open first hit for search.
  useEffect(() => {
    if (items.length === 0) {
      setOpenId(null);
      return;
    }
    if (!openId || !items.some((g) => g.id === openId)) {
      setOpenId(items[0]!.id);
    }
  }, [items, openId]);

  const clearAll = () => {
    setQuery("");
    setCategory("all");
    setSeverity("all");
    setVendor("all");
    onClearKindFilter();
  };

  const hasFilters =
    query.trim() !== "" ||
    category !== "all" ||
    severity !== "all" ||
    vendor !== "all" ||
    filterKind !== null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-warn" />
            <div>
              <h2 className="text-base font-semibold text-fg">
                Troubleshooting guide
              </h2>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Dell PowerEdge XE9712 / IR9048 + NVIDIA GB300 NVL72 field procedures.
                Educational — follow ProSupport / NVIDIA enterprise + site EOPs live.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted">
            {items.length}/{TROUBLESHOOTING_GUIDE.length}
          </span>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search BER, bent pins, iDRAC, XID, PS33, CDU, NCCL…"
            className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-9 text-sm text-fg placeholder:text-subtle outline-none ring-accent/40 focus:ring-2"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-subtle hover:text-fg"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {(["all", "dell", "nvidia", "both"] as const).map((v) => {
            const active = vendor === v;
            const label =
              v === "all" ? "All vendors" : VENDOR_META[v].label;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVendor(v)}
                className={cn(
                  "h-8 rounded-full border px-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? v === "all"
                      ? "border-fg/30 bg-surface-3 text-fg"
                      : VENDOR_META[v].className
                    : "border-border bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2 text-xs text-fg outline-none"
          >
            <option value="all">All categories</option>
            {GUIDE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity | "all")}
            className="h-9 min-w-[7.5rem] rounded-md border border-border bg-surface-2 px-2 text-xs text-fg outline-none"
          >
            <option value="all">All severities</option>
            {(Object.keys(SEVERITY_META) as Severity[]).map((s) => (
              <option key={s} value={s}>
                {SEVERITY_META[s].label}
              </option>
            ))}
          </select>
        </div>

        {(filterKind || hasFilters) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {filterKind && (
              <button
                type="button"
                onClick={onClearKindFilter}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2.5 text-xs font-medium text-accent"
              >
                Hardware: {filterKind}
                <X className="size-3" />
              </button>
            )}
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="h-8 rounded-md border border-border px-2.5 text-xs text-muted hover:text-fg"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 md:p-4">
        {items.length === 0 ? (
          <div className="px-2 py-10 text-center">
            <BookOpen className="mx-auto size-8 text-subtle" />
            <p className="mt-3 text-sm text-muted">No matching procedures.</p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-3 text-xs font-medium text-accent hover:underline"
            >
              Clear filters and show all {TROUBLESHOOTING_GUIDE.length}
            </button>
          </div>
        ) : (
          <ul className="space-y-2 pb-6">
            {items.map((g) => (
              <GuideCard
                key={g.id}
                guide={g}
                open={openId === g.id}
                onToggle={() => setOpenId(openId === g.id ? null : g.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function GuideCard({
  guide,
  open,
  onToggle,
}: {
  guide: GuideSection;
  open: boolean;
  onToggle: () => void;
}) {
  const sev = SEVERITY_META[guide.severity];
  const ven = VENDOR_META[guide.vendor];

  return (
    <li className="overflow-hidden rounded-lg border border-border bg-surface-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-3/60"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide",
                sev.className,
              )}
            >
              {sev.label}
            </span>
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide",
                ven.className,
              )}
            >
              {ven.short}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wide text-subtle">
              {guide.category}
            </span>
          </div>
          <div className="mt-1 text-sm font-medium leading-snug text-fg">
            {guide.title}
          </div>
          {!open && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
              {guide.summary}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <p className="text-xs leading-relaxed text-muted">{guide.summary}</p>
          <Section title="Symptoms" items={guide.symptoms} />
          <Section title="Checks" items={guide.checks} />
          <Section title="Actions" items={guide.actions} />
          {guide.sources.length > 0 && (
            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-wider text-subtle">
                Sources / lineage
              </h4>
              <ul className="mt-1.5 space-y-1">
                {guide.sources.map((s) => (
                  <li
                    key={s}
                    className="flex gap-2 text-[11px] leading-relaxed text-muted"
                  >
                    <ExternalLink className="mt-0.5 size-3 shrink-0 text-subtle" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {guide.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-mono text-[10px] uppercase tracking-wider text-subtle">
        {title}
      </h4>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent/80" />
            <span className="text-fg/90">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
