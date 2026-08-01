export type ComponentKind =
  | "compute"
  | "switch"
  | "power"
  | "manifold"
  | "management"
  | "cdu"
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
  | "cdu-external"
  | "rear-cartridge";

export type Placement = "in-rack" | "external" | "rear";

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
  /** For rear cartridges: which CT range mates to this cartridge. */
  matesTo?: string;
};

/**
 * Dell IR9048 elevation (bottom → top, front):
 *   PS33×4 bottom → CT1–8 → NVS1–9 → CT9–18 → PS33×4 top → OOB
 *
 * Rear: 4 NVLink cable cartridges (CC1–CC4) that CT/NVS nodes blind-mate into.
 * CDU: external sidecar.
 */
export const RACK_SPECS = {
  name: "Dell PowerEdge XE9712",
  platform: "NVIDIA GB300 NVL72",
  role: "Integrated Rack Scalable System (SU)",
  formFactor: "48U Dell IR9048 ORv3 · DLC to external CDU",
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
  rear: "4× NVLink cable cartridges (CC1–CC4)",
  cdu: "External (in-row / facility) — not in-rack",
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
  cdu: "#14b8a6",
  cartridge: "#e11d48",
  frame: "#4b5563",
};

/** Node groups that blind-mate into each rear cable cartridge. */
export const CARTRIDGE_MAP = [
  {
    n: 1,
    matesTo: "CT1–CT5 + NVS path A",
    detail: "Lower-left CT group and associated NVLink lanes into NVS fabric",
  },
  {
    n: 2,
    matesTo: "CT6–CT9 + NVS path B",
    detail: "Lower/mid CT group and NVLink lanes into NVS fabric",
  },
  {
    n: 3,
    matesTo: "CT10–CT14 + NVS path C",
    detail: "Upper-mid CT group and NVLink lanes into NVS fabric",
  },
  {
    n: 4,
    matesTo: "CT15–CT18 + NVS path D",
    detail: "Upper CT group and NVLink lanes into NVS fabric",
  },
] as const;

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
  const cartridge =
    n <= 5 ? "CC1" : n <= 9 ? "CC2" : n <= 14 ? "CC3" : "CC4";

  return {
    id: `ct-${n}`,
    kind: "compute",
    zone,
    placement: "in-rack",
    label: `CT${n} · PowerEdge XE9712`,
    shortLabel: `CT${n}`,
    uStart: u,
    uHeight: 1,
    description: `Dell PowerEdge XE9712 CT${n} (${bank}). Blind-mates NVLink connectors into rear cable cartridge ${cartridge}. Bent pins or high BER on that cartridge path will isolate or degrade this node’s fabric links.`,
    specs: [
      { label: "Tray ID", value: `CT${n}` },
      { label: "Bank", value: bank },
      { label: "Rear cartridge", value: cartridge },
      { label: "GPUs", value: "4 × B300 · 288 GB HBM3e ea." },
      { label: "CPUs", value: "2 × Grace" },
      { label: "East/West", value: "4× OSFP · ConnectX-8" },
      { label: "North/South", value: "1× BlueField-3" },
      { label: "Cooling", value: "DLC → external CDU" },
    ],
    color: COMPONENT_COLORS.compute,
    matesTo: cartridge,
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
    description: `NVLink switch tray NVS${n}. Connects through the four rear cable cartridges (CC1–CC4) to all CT nodes. Cartridge pin damage or elevated BER shows up as NVLink CRC/replay on paths through this switch.`,
    specs: [
      { label: "Tray ID", value: `NVS${n}` },
      { label: "Bank", value: "Middle fabric (NVS1–NVS9)" },
      { label: "Rear path", value: "CC1–CC4 cable cartridges" },
      { label: "NVSwitch ASICs", value: "2 per tray" },
      { label: "Rack aggregate", value: "130 TB/s NVLink" },
    ],
    color: COMPONENT_COLORS.switch,
  };
}

function makeCartridge(n: number): RackPart {
  const map = CARTRIDGE_MAP[n - 1]!;
  return {
    id: `cc-${n}`,
    kind: "cartridge",
    zone: "rear-cartridge",
    placement: "rear",
    label: `CC${n} · Rear Cable Cartridge`,
    shortLabel: `CC${n}`,
    uStart: 0,
    uHeight: 0,
    matesTo: map.matesTo,
    description: `Rear NVLink cable cartridge CC${n}. CT and NVS trays blind-mate into high-density connectors on this cartridge at the back of the IR9048. Common field failures: bent/pushed pins on mate, incomplete seating after sled service, and elevated BER / CRC on NVLink lanes that traverse this cartridge.`,
    specs: [
      { label: "Cartridge", value: `CC${n} of 4` },
      { label: "Location", value: "Rear of IR9048 (behind CT/NVS)" },
      { label: "Mates to", value: map.matesTo },
      { label: "Role", value: "NVLink copper path · node ↔ NVS fabric" },
      { label: "Failure modes", value: "Bent pins · incomplete mate · high BER" },
      { label: "Telemetry", value: "NVLink CRC / replay / BER counters" },
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
      "In-rack lower liquid manifold and QDCs to the external CDU. Not the CDU itself.",
    specs: [
      { label: "Role", value: "Rack coolant interface" },
      { label: "CDU", value: "External" },
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
    description: "Upper manifold / hose routing near top PS33 bank.",
    specs: [
      { label: "Role", value: "Upper manifold + cabling" },
      { label: "CDU", value: "External" },
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

  for (let n = 1; n <= 4; n++) {
    parts.push(makeCartridge(n));
  }

  parts.push({
    id: "cdu-external",
    kind: "cdu",
    zone: "cdu-external",
    placement: "external",
    label: "External CDU (in-row / facility)",
    shortLabel: "CDU",
    uStart: 0,
    uHeight: 0,
    description:
      "Coolant Distribution Unit outside the IR9048 — in-row or facility plant. Rack only has manifolds/QDCs into this unit.",
    specs: [
      { label: "Location", value: "External to IR9048" },
      { label: "Loop", value: "Secondary DLC ↔ facility primary" },
      { label: "Redundancy", value: "N+1 pumps (design dependent)" },
    ],
    color: COMPONENT_COLORS.cdu,
  });

  return parts;
}

export const RACK_PARTS = buildLayout();
export const IN_RACK_PARTS = RACK_PARTS.filter((p) => p.placement === "in-rack");
export const EXTERNAL_PARTS = RACK_PARTS.filter((p) => p.placement === "external");
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
    label: "CC1 – CC4 (rear)",
    detail: "Cable cartridges · nodes blind-mate",
    kind: "cartridge" as const,
  },
  {
    id: "cdu",
    label: "External CDU",
    detail: "Beside rack · not in U stack",
    kind: "cdu" as const,
  },
];

export function getPart(id: string | null): RackPart | undefined {
  if (!id) return undefined;
  return RACK_PARTS.find((p) => p.id === id);
}

export const KIND_LEGEND: { kind: ComponentKind; label: string; count: string }[] = [
  { kind: "compute", label: "CT trays", count: "CT1–18" },
  { kind: "switch", label: "NVS trays", count: "NVS1–9" },
  { kind: "cartridge", label: "Cable cart.", count: "CC1–4 rear" },
  { kind: "power", label: "PS33", count: "4+4" },
  { kind: "cdu", label: "External CDU", count: "Sidecar" },
  { kind: "manifold", label: "DLC manifolds", count: "In-rack" },
  { kind: "management", label: "OOB / iDRAC", count: "SN2201" },
];
