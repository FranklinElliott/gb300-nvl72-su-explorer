import { useState } from "react";
import {
  Box,
  BookOpen,
  Layers,
  RotateCcw,
  SplitSquareVertical,
  Info,
  ScanFace,
} from "lucide-react";
import { ClientRackScene } from "../src/components/rack/ClientRackScene";
import { DetailPanel } from "../src/components/rack/DetailPanel";
import { GuidePanel } from "../src/components/rack/GuidePanel";
import {
  COMPONENT_COLORS,
  KIND_LEGEND,
  type ComponentKind,
} from "../src/data/rack";
import type { ViewMode } from "../src/components/rack/RackScene";
import { cn } from "../src/lib/utils";

type Tab = "inspect" | "guide";

/** Static SPA shell for GitHub Pages (no TanStack Start SSR). */
export function SpaApp() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightKind, setHighlightKind] = useState<ComponentKind | null>(null);
  const [explode, setExplode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("front");
  const [tab, setTab] = useState<Tab>("inspect");
  const [guideKindFilter, setGuideKindFilter] = useState<ComponentKind | null>(null);

  const openGuideForKind = (kind: ComponentKind) => {
    setGuideKindFilter(kind);
    setHighlightKind(kind);
    setTab("guide");
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <header className="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/90 px-3 py-2.5 backdrop-blur-md md:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-fg">
              <Box className="size-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight text-fg md:text-base">
                Dell XE9712 · GB300 NVL72
              </h1>
              <p className="truncate font-mono text-[10px] text-muted md:text-[11px]">
                CT/NVS · CC0–3 rear · PS33 4+4 · DLC
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 md:gap-2">
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("front")}
              className={cn(
                "h-8 rounded-md px-2.5 text-xs font-medium transition-colors",
                viewMode === "front" ? "bg-surface-3 text-fg" : "text-muted hover:text-fg",
              )}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("rear");
                setAutoRotate(false);
                setHighlightKind("cartridge");
              }}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors",
                viewMode === "rear" ? "bg-surface-3 text-fg" : "text-muted hover:text-fg",
              )}
            >
              <ScanFace className="size-3.5" />
              Rear
            </button>
          </div>
          <ControlToggle
            active={explode}
            onClick={() => setExplode((v) => !v)}
            label="Explode"
            icon={SplitSquareVertical}
          />
          <ControlToggle
            active={autoRotate}
            onClick={() => setAutoRotate((v) => !v)}
            label="Orbit"
            icon={RotateCcw}
          />
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
            <TabButton
              active={tab === "inspect"}
              onClick={() => setTab("inspect")}
              icon={Layers}
              label="Inspect"
            />
            <TabButton
              active={tab === "guide"}
              onClick={() => setTab("guide")}
              icon={BookOpen}
              label="Guide"
            />
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_minmax(320px,400px)]">
        <section className="relative min-h-[42vh] border-b border-border lg:min-h-0 lg:border-b-0 lg:border-r">
          <ClientRackScene
            selectedId={selectedId}
            highlightKind={highlightKind}
            explode={explode}
            autoRotate={autoRotate}
            viewMode={viewMode}
            onSelect={(id) => {
              setSelectedId(id);
              if (id) setTab("inspect");
            }}
          />

          <div className="pointer-events-none absolute left-3 top-3 right-3 flex flex-wrap gap-1.5 md:left-4 md:top-4">
            {KIND_LEGEND.map((item) => {
              const active = highlightKind === item.kind;
              return (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => {
                    setHighlightKind((k) => (k === item.kind ? null : item.kind));
                    if (item.kind === "cartridge") setViewMode("rear");
                  }}
                  className={cn(
                    "pointer-events-auto flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "border-fg/30 bg-surface-3 text-fg"
                      : "border-border bg-surface/85 text-muted hover:text-fg",
                  )}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: COMPONENT_COLORS[item.kind] }}
                  />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.kind}</span>
                  <span className="font-mono text-[10px] text-subtle">{item.count}</span>
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute bottom-12 right-3 hidden max-w-[240px] rounded-lg border border-border bg-surface/90 p-2.5 text-[10px] leading-relaxed text-muted backdrop-blur-sm md:block">
            <div className="mb-1 flex items-center gap-1 font-medium text-fg">
              <Info className="size-3" />
              Rear cartridges
            </div>
            <span className="text-fg">CC0–CC3</span> carry NVLink copper from CT/NVS blind-mates.
            Watch for <span className="text-fg">bent pins</span> and elevated{" "}
            <span className="text-fg">BER/CRC</span> after sled service.
          </div>
        </section>

        <aside className="min-h-0 overflow-hidden bg-surface">
          {tab === "inspect" ? (
            <div className="panel-scroll h-full overflow-y-auto">
              <DetailPanel
                selectedId={selectedId}
                onClose={() => setSelectedId(null)}
                onOpenGuide={openGuideForKind}
              />
            </div>
          ) : (
            <GuidePanel
              filterKind={guideKindFilter}
              onClearKindFilter={() => setGuideKindFilter(null)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function ControlToggle({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: typeof Box;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
        active
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-border bg-surface-2 text-muted hover:text-fg",
      )}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Box;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
        active ? "bg-surface-3 text-fg" : "text-muted hover:text-fg",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
