import { X, Cpu, Zap, Network, Droplets, Server, Waves } from "lucide-react";
import {
  ELEVATION_TOP_DOWN,
  getPart,
  RACK_SPECS,
  COMPONENT_COLORS,
  type ComponentKind,
} from "@/data/rack";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<ComponentKind, typeof Cpu> = {
  compute: Cpu,
  switch: Network,
  power: Zap,
  manifold: Droplets,
  management: Server,
  cdu: Waves,
  frame: Server,
};

type DetailPanelProps = {
  selectedId: string | null;
  onClose: () => void;
  onOpenGuide: (kind: ComponentKind) => void;
};

export function DetailPanel({ selectedId, onClose, onOpenGuide }: DetailPanelProps) {
  const part = getPart(selectedId);

  if (!part) {
    return (
      <div className="flex h-full flex-col gap-4 p-4 md:p-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-accent">
            Dell Integrated Rack · SU
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg md:text-2xl">
            {RACK_SPECS.name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {RACK_SPECS.platform} · {RACK_SPECS.formFactor}
          </p>
        </div>

        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-wider text-subtle">
            Front elevation · top → bottom
          </h3>
          <ol className="mt-2 space-y-1.5">
            {ELEVATION_TOP_DOWN.map((row, i) => (
              <li
                key={row.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
              >
                <span className="w-4 font-mono text-[10px] text-subtle">{i + 1}</span>
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: COMPONENT_COLORS[row.kind] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold tabular-nums text-fg">{row.label}</div>
                  <div className="text-[11px] text-muted">{row.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { k: "CT trays", v: "CT1–CT18" },
            { k: "NVS trays", v: "NVS1–NVS9" },
            { k: "PS33", v: "4 top + 4 bottom" },
            { k: "CDU", v: "External" },
            { k: "GPUs", v: String(RACK_SPECS.gpus) },
            { k: "NVLink", v: "130 TB/s" },
          ].map((row) => (
            <div
              key={row.k}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2.5"
            >
              <div className="font-mono text-[10px] uppercase tracking-wide text-subtle">
                {row.k}
              </div>
              <div className="mt-0.5 text-sm font-medium text-fg">{row.v}</div>
            </div>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-muted">
          Power is split <span className="font-medium text-fg">4 PS33 top / 4 PS33 bottom</span>.
          The <span className="font-medium text-fg">CDU is external</span> (in-row or facility);
          in-rack pieces are only DLC manifolds and QDCs into that CDU.
        </p>
      </div>
    );
  }

  const Icon = KIND_ICON[part.kind];

  return (
    <div className="flex h-full flex-col p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border"
            style={{ backgroundColor: `${part.color}22`, color: part.color }}
          >
            <Icon className="size-4" />
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {part.placement === "external"
                ? "External · not in U stack"
                : `U${part.uStart}${part.uHeight > 1 ? `–U${part.uStart + part.uHeight - 1}` : ""}`}{" "}
              · {part.shortLabel}
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-fg md:text-xl">
              {part.label}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted">{part.description}</p>

      <div className="mt-4 space-y-2">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-subtle">Specs</h3>
        <dl className="space-y-1.5">
          {part.specs.map((s) => (
            <div
              key={s.label}
              className="flex items-start justify-between gap-3 rounded-md border border-border/80 bg-surface-2/80 px-3 py-2"
            >
              <dt className="text-xs text-muted">{s.label}</dt>
              <dd className="text-right text-xs font-medium text-fg">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <button
        type="button"
        onClick={() => onOpenGuide(part.kind)}
        className={cn(
          "mt-auto w-full rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5",
          "text-sm font-medium text-accent transition-colors hover:bg-accent/20",
        )}
      >
        Related Dell troubleshooting
      </button>
    </div>
  );
}
