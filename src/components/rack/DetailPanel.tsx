import { X, Cpu, Zap, Network, Droplets, Server } from "lucide-react";
import { getPart, RACK_SPECS, type ComponentKind } from "@/data/rack";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<ComponentKind, typeof Cpu> = {
  compute: Cpu,
  switch: Network,
  power: Zap,
  manifold: Droplets,
  management: Server,
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
            Scalable Unit
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg md:text-2xl">
            {RACK_SPECS.name}
          </h2>
          <p className="mt-1 text-sm text-muted">{RACK_SPECS.role} · {RACK_SPECS.formFactor}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { k: "GPUs", v: String(RACK_SPECS.gpus) },
            { k: "Grace CPUs", v: String(RACK_SPECS.cpus) },
            { k: "Compute trays", v: String(RACK_SPECS.computeTrays) },
            { k: "NVSwitch trays", v: String(RACK_SPECS.switchTrays) },
            { k: "Power shelves", v: String(RACK_SPECS.powerShelves) },
            { k: "NVLink", v: RACK_SPECS.nvlinkBandwidth },
            { k: "GPU memory", v: RACK_SPECS.gpuMemory },
            { k: "CPU memory", v: RACK_SPECS.cpuMemory },
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
          Click any tray in the 3D rack to inspect compute, NVLink switch, power, or
          coolant components. One SU = one liquid-cooled NVL72 rack (72 Blackwell Ultra
          GPUs as a single NVLink domain).
        </p>

        <div className="mt-auto rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
          <span className="font-medium text-fg">Tip: </span>
          Use Explode view to separate component classes, or filter by type in the legend.
        </div>
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
              U{part.uStart}
              {part.uHeight > 1 ? `–U${part.uStart + part.uHeight - 1}` : ""} · {part.kind}
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
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-subtle">
          Specs
        </h3>
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
        Related troubleshooting
      </button>
    </div>
  );
}
