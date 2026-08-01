export type ComponentKind =
  | "compute"
  | "switch"
  | "power"
  | "manifold"
  | "management"
  | "frame";

export type RackPart = {
  id: string;
  kind: ComponentKind;
  label: string;
  shortLabel: string;
  uStart: number;
  uHeight: number;
  description: string;
  specs: { label: string; value: string }[];
  color: string;
};

/** Schematic bottom→top layout for one GB300 NVL72 Scalable Unit (48U rack). */
export const RACK_SPECS = {
  name: "NVIDIA GB300 NVL72",
  role: "Scalable Unit (SU)",
  formFactor: "48U MGX liquid-cooled rack",
  dimensions: "≈ 2236 × 600 × 1068 mm (H×W×D)",
  power: "Up to ~132–142 kW operating",
  gpus: 72,
  cpus: 36,
  computeTrays: 18,
  switchTrays: 9,
  powerShelves: 8,
  nvlinkBandwidth: "130 TB/s aggregate",
  gpuMemory: "20 TB HBM3e class",
  cpuMemory: "17 TB LPDDR5X",
  cpuCores: "2,592 Arm Neoverse V2",
  fp4: "Up to ~1.1 EFLOPS FP4 class (config dependent)",
} as const;

export const COMPONENT_COLORS: Record<ComponentKind, string> = {
  compute: "#3d8bfd",
  switch: "#a78bfa",
  power: "#f59e0b",
  manifold: "#22d3ee",
  management: "#94a3b8",
  frame: "#3f4650",
};

function buildLayout(): RackPart[] {
  const parts: RackPart[] = [];
  let u = 1;

  // Power domain at base
  for (let i = 0; i < 8; i++) {
    parts.push({
      id: `psu-${i + 1}`,
      kind: "power",
      label: `Power Shelf ${i + 1}`,
      shortLabel: `PSU ${i + 1}`,
      uStart: u,
      uHeight: 1,
      description:
        "1U power shelf with six 5.5 kW PSUs (~33 kW per shelf). Feeds the rack DC busbar for compute, NVSwitch, and management loads.",
      specs: [
        { label: "Shelf power", value: "33 kW" },
        { label: "PSUs / shelf", value: "6 × 5.5 kW" },
        { label: "Rack total shelves", value: "8" },
        { label: "Operating draw", value: "132–142 kW class" },
      ],
      color: COMPONENT_COLORS.power,
    });
    u += 1;
  }

  // Coolant manifold / leak detection zone
  parts.push({
    id: "manifold-lower",
    kind: "manifold",
    label: "Lower Coolant Manifold & Leak Sensors",
    shortLabel: "Manifold",
    uStart: u,
    uHeight: 2,
    description:
      "In-rack liquid distribution and return manifolds with tray-level and rack-level leak detection. Primary interface to facility/in-rack CDU.",
    specs: [
      { label: "Cooling", value: "Direct liquid (MGX)" },
      { label: "Leak detection", value: "Tray + rack sensors" },
      { label: "Typical CDU", value: "In-rack / in-row / L2A sidecar" },
      { label: "Heat load", value: "~409k BTU/hr class" },
    ],
    color: COMPONENT_COLORS.manifold,
  });
  u += 2;

  // 18 compute trays + 9 NVSwitch trays in 2:1 groups (C,C,SW) × 9
  let computeIdx = 1;
  let switchIdx = 1;
  for (let group = 0; group < 9; group++) {
    for (let c = 0; c < 2; c++) {
      const n = computeIdx++;
      parts.push({
        id: `compute-${n}`,
        kind: "compute",
        label: `Compute Tray ${n}`,
        shortLabel: `C${n}`,
        uStart: u,
        uHeight: 1,
        description:
          "GB300 NVL compute tray: 4× Blackwell Ultra (B300) GPUs + 2× Grace CPUs, liquid-cooled cold plates, ConnectX-8 east/west fabric, BlueField-3 north/south DPU, local NVMe.",
        specs: [
          { label: "GPUs", value: "4 × B300 Blackwell Ultra" },
          { label: "CPUs", value: "2 × Grace (72 Arm cores total)" },
          { label: "HBM / tray", value: "~1.15 TB class aggregate" },
          { label: "CPU DRAM / tray", value: "~1 TB LPDDR5X class" },
          { label: "East/West", value: "ConnectX-8 SuperNICs (800 Gb/s class)" },
          { label: "North/South", value: "BlueField-3 B3240 DPU" },
          { label: "Storage", value: "M.2 OS + 4× E1.S cache NVMe" },
        ],
        color: COMPONENT_COLORS.compute,
      });
      u += 1;
    }

    const s = switchIdx++;
    parts.push({
      id: `switch-${s}`,
      kind: "switch",
      label: `NVLink Switch Tray ${s}`,
      shortLabel: `SW${s}`,
      uStart: u,
      uHeight: 1,
      description:
        "NVLink 5th-generation switch tray with 2 NVSwitch ASICs. Completes the non-blocking all-to-all fabric for 72 GPUs inside the SU (single L1 NVLink domain).",
      specs: [
        { label: "NVSwitch ASICs", value: "2 per tray" },
        { label: "Generation", value: "NVLink 5th gen" },
        { label: "Domain role", value: "Full P2P within rack SU" },
        { label: "Rack aggregate", value: "130 TB/s NVLink" },
        { label: "Links / GPU", value: "18 NVLink ports (1 per switch ASIC pair path)" },
      ],
      color: COMPONENT_COLORS.switch,
    });
    u += 1;
  }

  // Management / OOB
  parts.push({
    id: "mgmt",
    kind: "management",
    label: "OOB Management Switches",
    shortLabel: "Mgmt",
    uStart: u,
    uHeight: 2,
    description:
      "In-rack SN2201-class out-of-band management switches for BMC, tray controllers, and service access (Redfish / management plane).",
    specs: [
      { label: "Switches", value: "2 × SN2201 class OOB" },
      { label: "APIs", value: "Redfish, BMC, secure FW" },
      { label: "Power", value: "DC busbar / AC per design" },
    ],
    color: COMPONENT_COLORS.management,
  });
  u += 2;

  parts.push({
    id: "manifold-upper",
    kind: "manifold",
    label: "Upper Coolant / Cable Zone",
    shortLabel: "Cable",
    uStart: u,
    uHeight: Math.max(1, 48 - u + 1),
    description:
      "Upper rack service zone for cable management, sensor harnesses, and secondary coolant routing depending on OEM rack kit.",
    specs: [
      { label: "Zone", value: "Service / cabling" },
      { label: "Access", value: "Hot-aisle / cold-aisle service" },
    ],
    color: COMPONENT_COLORS.manifold,
  });

  return parts;
}

export const RACK_PARTS = buildLayout();

export function getPart(id: string | null): RackPart | undefined {
  if (!id) return undefined;
  return RACK_PARTS.find((p) => p.id === id);
}

export const KIND_LEGEND: { kind: ComponentKind; label: string; count: string }[] = [
  { kind: "compute", label: "Compute trays", count: "18 × 1U" },
  { kind: "switch", label: "NVLink switch trays", count: "9 × 1U" },
  { kind: "power", label: "Power shelves", count: "8 × 1U" },
  { kind: "manifold", label: "Coolant / service", count: "Manifolds" },
  { kind: "management", label: "OOB management", count: "2 switches" },
];
