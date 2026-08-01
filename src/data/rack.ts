export type ComponentKind =
  | "compute"
  | "switch"
  | "power"
  | "manifold"
  | "management"
  | "cartridge"
  | "frame";

export type RackZone =
  | "power-bottom"
  | "power-top"
  | "ct-low"
  | "nvs"
  | "ct-high"
  | "mgmt"
  | "service"
  | "rear-cartridge";

export type Placement = "in-rack" | "rear";

export type RackPart = {
  id: string;
  kind: ComponentKind;
  zone: RackZone;
  placement: Placement;
  label: string;
  shortLabel: string;
  uStart: number;
  uHeight: number;
  description: string;
  specs: { label: string; value: string }[];
  color: string;
  /** For rear cartridges: GPU lane / mate path summary. */
  matesTo?: string;

};

/**
 * Dell IR9048 elevation (bottom → top, front):
 *   PS33×4 bottom → CT1–8 → NVS1–9 → CT9–18 → PS33×4 top → OOB
 *
 * Rear: 4 NVLink cable cartridges (CC0–CC3). Every CT and NVS mates into all four;
 * each cartridge carries one GPU index lane across the SU:
 *   CC0→GPU1, CC1→GPU0, CC2→GPU3, CC3→GPU2.

 * Facility cooling (CDU plant) is outside the data hall — FacOps, not this SU model.
 */
export const RACK_SPECS = {
  name: "Dell PowerEdge XE9712",
  platform: "NVIDIA GB300 NVL72",
  role: "Integrated Rack Scalable System (SU)",
  formFactor: "48U Dell IR9048 ORv3 · rack DLC manifolds",
  dimensions: "≈ 2294 × 750 × 1200 mm (H×W×D)",
  weight: "≈ 1590 kg wet cabinet class",
  power: "8× PS33 · 4 bottom + 4 top",
  gpus: 72,
  cpus: 36,
  computeTrays: 18,
  switchTrays: 9,
  powerShelves: 8,
  cableCartridges: 4,
  powerLayout: "4 PS33 bottom · 4 PS33 top",
  stackOrder: "PS33 top · CT18–9 · NVS9–1 · CT8–1 · PS33 bottom",
  rear: "4× NVLink cable cartridges CC0–CC3 · all CT/NVS · by GPU index",

  cooling: "In-rack DLC manifolds/QDCs · facility plant is FacOps (outside hall)",
  nvlinkBandwidth: "130 TB/s aggregate NVLink",
  gpuMemory: "288 GB HBM3e × 72 (~20 TB)",
  cpuMemory: "Up to 480 GB LPDDR5 / Grace",
  cpuCores: "2,592 Arm Neoverse V2",
  fastMemory: "Up to ~40 TB fast memory class",
  management: "iDRAC 10 / OpenBMC · OpenManage Enterprise",
  support: "Dell ProSupport / ProSupport Plus",
} as const;

export const COMPONENT_COLORS: Record<ComponentKind, string> = {
  compute: "#0076ce",
  switch: "#7c9cff",
  power: "#f0a202",
  manifold: "#2ec4b6",
  management: "#94a3b8",
  cartridge: "#e11d48",
  frame: "#4b5563",
};

/**
 * Rear cable cartridges: each connects to **all** CT and NVS trays.
 * Mapping is by GPU index on every compute tray (not by CT range).
 *   CC0 ↔ GPU 1 · CC1 ↔ GPU 0 · CC2 ↔ GPU 3 · CC3 ↔ GPU 2
 */
export const CARTRIDGE_MAP = [
  {
    n: 0,
    gpu: 1,
    matesTo: "GPU 1 · all CT1–18 + all NVS1–9",
    detail: "NVLink lanes for GPU1 on every CT through the full NVS fabric",
  },
  {
    n: 1,
    gpu: 0,
    matesTo: "GPU 0 · all CT1–18 + all NVS1–9",
    detail: "NVLink lanes for GPU0 on every CT through the full NVS fabric",
  },
  {
    n: 2,
    gpu: 3,
    matesTo: "GPU 3 · all CT1–18 + all NVS1–9",
    detail: "NVLink lanes for GPU3 on every CT through the full NVS fabric",
  },
  {
    n: 3,
    gpu: 2,
    matesTo: "GPU 2 · all CT1–18 + all NVS1–9",
    detail: "NVLink lanes for GPU2 on every CT through the full NVS fabric",
  },
] as const;

/** Compact legend string for UI / CT specs. */
export const CARTRIDGE_GPU_LEGEND =
  "CC0→GPU1 · CC1→GPU0 · CC2→GPU3 · CC3→GPU2 (all CT + NVS)";


function makePower(n: number, u: number, bank: "bottom" | "top"): RackPart {
  const zone = bank === "bottom" ? "power-bottom" : "power-top";
  const bankLabel = bank === "bottom" ? "Lower power bank (×4)" : "Upper power bank (×4)";
  return {
    id: `psu-${n}`,
    kind: "power",
    zone,
    placement: "in-rack",
    label: `PS33-${n} · Power Shelf (${bank})`,
    shortLabel: `PS33-${n}`,
    uStart: u,
    uHeight: 1,
    description: `Dell PS33 33 kW power shelf ${n} in the ${bank} bank of four. Six 5.5 kW AC PSUs feed the ORv3 busbar (~54 VDC).`,
    specs: [
      { label: "Model", value: "PS33 · 33 kW" },
      { label: "Bank", value: bankLabel },
      { label: "Shelf #", value: `${n} of 8` },
      { label: "PSUs / shelf", value: "6 × 5500 W AC" },
      { label: "Layout", value: "4 bottom + 4 top" },
    ],
    color: COMPONENT_COLORS.power,
  };
}

function makeCompute(n: number, u: number, zone: RackZone): RackPart {
  const bank =
    zone === "ct-low" ? "Lower bank (CT1–CT8)" : "Upper bank (CT9–CT18)";

  return {
    id: `ct-${n}`,
    kind: "compute",
    zone,
    placement: "in-rack",
    label: `CT${n} · PowerEdge XE9712`,
    shortLabel: `CT${n}`,
    uStart: u,
    uHeight: 1,
    description: `Dell PowerEdge XE9712 CT${n} (${bank}). Blind-mates into all four rear cable cartridges (CC0–CC3): GPU0→CC1, GPU1→CC0, GPU2→CC3, GPU3→CC2. East/west ConnectX-8 RoCE uplinks over AEC to Dell PowerSwitch SN5610 (isolate NIC vs AEC vs SWP on down/BER/flaps).`,
    specs: [
      { label: "Tray ID", value: `CT${n}` },
      { label: "Bank", value: bank },
      { label: "GPUs", value: "4 × B300 · 288 GB HBM3e ea." },
      { label: "NVLink cart.", value: "All CC0–CC3 (by GPU)" },
      { label: "GPU→CC map", value: "G0→CC1 · G1→CC0 · G2→CC3 · G3→CC2" },
      { label: "CPUs", value: "2 × Grace" },
      { label: "East/West", value: "4× OSFP · ConnectX-8 RoCE → SN5610" },
      { label: "North/South", value: "1× BlueField-3" },
      { label: "Cooling", value: "In-rack DLC · facility plant (FacOps)" },
    ],
    color: COMPONENT_COLORS.compute,
    matesTo: CARTRIDGE_GPU_LEGEND,
  };
}


function makeNvs(n: number, u: number): RackPart {
  return {
    id: `nvs-${n}`,
    kind: "switch",
    zone: "nvs",
    placement: "in-rack",
    label: `NVS${n} · NVLink Switch Tray`,
    shortLabel: `NVS${n}`,
    uStart: u,
    uHeight: 1,
    description: `NVLink switch tray NVS${n}. Mates into all four rear cable cartridges (CC0–CC3) with every CT. Each cartridge carries one GPU-index lane (CC0=GPU1, CC1=GPU0, CC2=GPU3, CC3=GPU2). Bent pins or BER on a cartridge degrade that GPU lane across the SU.`,
    specs: [
      { label: "Tray ID", value: `NVS${n}` },
      { label: "Bank", value: "Middle fabric (NVS1–NVS9)" },
      { label: "Rear path", value: "All CC0–CC3 (with every CT)" },
      { label: "Lane map", value: CARTRIDGE_GPU_LEGEND },
      { label: "NVSwitch ASICs", value: "2 per tray" },
      { label: "Rack aggregate", value: "130 TB/s NVLink" },
    ],
    color: COMPONENT_COLORS.switch,
    matesTo: CARTRIDGE_GPU_LEGEND,
  };
}


function makeCartridge(n: number): RackPart {
  const map = CARTRIDGE_MAP.find((c) => c.n === n)!;
  return {
    id: `cc-${n}`,
    kind: "cartridge",
    zone: "rear-cartridge",
    placement: "rear",
    label: `CC${n} · Rear Cable Cartridge (GPU ${map.gpu})`,
    shortLabel: `CC${n}`,
    uStart: 0,
    uHeight: 0,
    matesTo: map.matesTo,
    description: `Rear NVLink cable cartridge CC${n} carries GPU ${map.gpu} lanes for every CT (CT1–18) and mates with every NVS (NVS1–9). Not a per-CT subset — all trays hit all four cartridges; this one is the GPU ${map.gpu} path. Field failures: bent/pushed pins, incomplete mate after sled service, elevated BER/CRC on GPU ${map.gpu} links across the SU.`,
    specs: [
      { label: "Cartridge", value: `CC${n} (0–3)` },
      { label: "GPU index", value: `GPU ${map.gpu}` },
      { label: "Connects", value: "All CT1–18 + all NVS1–9" },
      { label: "Lane map", value: CARTRIDGE_GPU_LEGEND },
      { label: "Location", value: "Rear of IR9048 (behind CT/NVS)" },
      { label: "Role", value: `NVLink copper · GPU ${map.gpu} domain` },
      { label: "Failure modes", value: "Bent pins · incomplete mate · high BER" },
      { label: "Telemetry", value: `NVLink CRC / replay / BER on GPU ${map.gpu}` },
      { label: "Service", value: "Inspect pins · reseat · FRU replace" },
    ],
    color: COMPONENT_COLORS.cartridge,
  };
}


function buildLayout(): RackPart[] {
  const parts: RackPart[] = [];
  let u = 1;

  for (let n = 1; n <= 4; n++) {
    parts.push(makePower(n, u, "bottom"));
    u += 1;
  }

  parts.push({
    id: "manifold-lower",
    kind: "manifold",
    zone: "service",
    placement: "in-rack",
    label: "Lower DLC Manifold / QDCs",
    shortLabel: "DLC-L",
    uStart: u,
    uHeight: 1,
    description:
      "In-rack lower liquid manifold and tray QDCs. Facility coolant plant / CDU is outside the data hall (FacOps) and serves many cabinets — not modeled on this SU.",
    specs: [
      { label: "Role", value: "Rack coolant interface" },
      { label: "Facility plant", value: "FacOps · outside data hall" },
    ],
    color: COMPONENT_COLORS.manifold,
  });
  u += 1;

  for (let n = 1; n <= 8; n++) {
    parts.push(makeCompute(n, u, "ct-low"));
    u += 1;
  }
  for (let n = 1; n <= 9; n++) {
    parts.push(makeNvs(n, u));
    u += 1;
  }
  for (let n = 9; n <= 18; n++) {
    parts.push(makeCompute(n, u, "ct-high"));
    u += 1;
  }
  for (let n = 5; n <= 8; n++) {
    parts.push(makePower(n, u, "top"));
    u += 1;
  }

  parts.push({
    id: "manifold-upper",
    kind: "manifold",
    zone: "service",
    placement: "in-rack",
    label: "Upper DLC / Cable Zone",
    shortLabel: "DLC-U",
    uStart: u,
    uHeight: 1,
    description: "Upper manifold / hose routing near top PS33 bank. Facility plant remains FacOps outside the hall.",
    specs: [
      { label: "Role", value: "Upper manifold + cabling" },
      { label: "Facility plant", value: "FacOps · multi-cabinet" },
    ],
    color: COMPONENT_COLORS.manifold,
  });
  u += 1;

  parts.push({
    id: "mgmt",
    kind: "management",
    zone: "mgmt",
    placement: "in-rack",
    label: "Dell / PowerSwitch OOB Management",
    shortLabel: "OOB",
    uStart: u,
    uHeight: Math.max(1, 48 - u + 1),
    description: "Top of stack: SN2201 OOB, iDRAC/OpenBMC, OpenManage Enterprise.",
    specs: [
      { label: "OOB", value: "PowerSwitch SN2201 class (×2)" },
      { label: "BMC", value: "iDRAC 10 / OpenBMC" },
    ],
    color: COMPONENT_COLORS.management,
  });

  for (let n = 0; n <= 3; n++) {
    parts.push(makeCartridge(n));
  }

  return parts;
}

export const RACK_PARTS = buildLayout();
export const IN_RACK_PARTS = RACK_PARTS.filter((p) => p.placement === "in-rack");
export const REAR_PARTS = RACK_PARTS.filter((p) => p.placement === "rear");

export const ELEVATION_TOP_DOWN = [
  {
    id: "power-top",
    label: "PS33 × 4 (top)",
    detail: "Upper power bank · PS33-5–8",
    kind: "power" as const,
  },
  {
    id: "ct-high",
    label: "CT18 – CT9",
    detail: "10 × PowerEdge XE9712",
    kind: "compute" as const,
  },
  {
    id: "nvs",
    label: "NVS9 – NVS1",
    detail: "9 × NVLink switch trays",
    kind: "switch" as const,
  },
  {
    id: "ct-low",
    label: "CT8 – CT1",
    detail: "8 × PowerEdge XE9712",
    kind: "compute" as const,
  },
  {
    id: "power-bottom",
    label: "PS33 × 4 (bottom)",
    detail: "Lower power bank · PS33-1–4",
    kind: "power" as const,
  },
  {
    id: "cartridges",
    label: "CC0 – CC3 (rear)",
    detail: "All CT/NVS · by GPU index",

    kind: "cartridge" as const,
  },
];

export function getPart(id: string | null): RackPart | undefined {
  if (!id) return undefined;
  return RACK_PARTS.find((p) => p.id === id);
}

export const KIND_LEGEND: { kind: ComponentKind; label: string; count: string }[] = [
  { kind: "compute", label: "CT trays", count: "CT1–18" },
  { kind: "switch", label: "NVS trays", count: "NVS1–9" },
  { kind: "cartridge", label: "Cable cart.", count: "CC0–3 rear" },
  { kind: "power", label: "PS33", count: "4+4" },
  { kind: "manifold", label: "DLC manifolds", count: "In-rack" },
  { kind: "management", label: "OOB / iDRAC", count: "SN2201" },
];
