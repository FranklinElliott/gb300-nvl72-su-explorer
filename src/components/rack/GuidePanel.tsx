import { useMemo, useState } from "react";
import { Search, AlertTriangle, ChevronDown } from "lucide-react";
import {
  GUIDE_CATEGORIES,
  SEVERITY_META,
  TROUBLESHOOTING_GUIDE,
  type GuideSection,
  type Severity,
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
  const [openId, setOpenId] = useState<string | null>(TROUBLESHOOTING_GUIDE[0]?.id ?? null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TROUBLESHOOTING_GUIDE.filter((g) => {
      if (category !== "all" && g.category !== category) return false;
      if (severity !== "all" && g.severity !== severity) return false;
      if (filterKind && !g.relatedKinds.includes(filterKind)) return false;
      if (!q) return true;
      const hay = [g.title, g.category, ...g.symptoms, ...g.checks, ...g.actions, ...g.tags]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    }).sort(
      (a, b) => SEVERITY_META[a.severity].order - SEVERITY_META[b.severity].order,
    );
  }, [query, category, severity, filterKind]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4 md:p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-warn" />
          <h2 className="text-base font-semibold text-fg">Dell operator guide</h2>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          XE9712 / IR9048 SU — external CDU, dual PS33 banks, CT/NVS elevation. Follow
          ProSupport + site EOPs on live systems.
        </p>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search CDU, PS33, CT, NVS, iDRAC…"
            className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-subtle outline-none ring-accent/40 focus:ring-2"
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-border bg-surface-2 px-2 text-xs text-fg outline-none"
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
            className="h-9 rounded-md border border-border bg-surface-2 px-2 text-xs text-fg outline-none"
          >
            <option value="all">All severities</option>
            {(Object.keys(SEVERITY_META) as Severity[]).map((s) => (
              <option key={s} value={s}>
                {SEVERITY_META[s].label}
              </option>
            ))}
          </select>
          {filterKind && (
            <button
              type="button"
              onClick={onClearKindFilter}
              className="h-9 rounded-md border border-accent/40 bg-accent/10 px-2.5 text-xs font-medium text-accent"
            >
              Filtered: {filterKind} ×
            </button>
          )}
        </div>
      </div>

      <div className="panel-scroll min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
        {items.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted">No matching procedures.</p>
        ) : (
          <ul className="space-y-2">
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
  return (
    <li className="overflow-hidden rounded-lg border border-border bg-surface-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-3/60"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide",
                sev.className,
              )}
            >
              {sev.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wide text-subtle">
              {guide.category}
            </span>
          </div>
          <div className="mt-1 text-sm font-medium text-fg">{guide.title}</div>
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
          <Section title="Symptoms" items={guide.symptoms} />
          <Section title="Checks" items={guide.checks} />
          <Section title="Actions" items={guide.actions} />
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
      <h4 className="font-mono text-[10px] uppercase tracking-wider text-subtle">{title}</h4>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent/80" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
