export type ComponentKind =
  | "compute"
  | "switch"
  | "power"
  | "manifold"
  | "management"
  | "cdu"
  | "frame";

export type RackZone =
  | "power-bottom"
  | "power-top"
  | "ct-low"
  | "nvs"
  | "ct-high"
  | "mgmt"
  | "service"
  | "cdu-external";

export type RackPart = {
  id: string;
  kind: ComponentKind;
  zone: RackZone;
  /** In-rack U position, or external (CDU sidecar). */
  placement: "in-rack" | "external";
  label: string;
  shortLabel: string;
  uStart: number;
  uHeight: number;
  description: string;
  specs: { label: string; value: string }[];
  color: string;
};

/**
 * Dell IR9048 front elevation (bottom → top, in-rack):
 *   PS33×4 (bottom) → CT1–8 → NVS1–9 → CT9–18 → PS33×4 (top) → OOB
 *
 * Top → bottom callout:
 *   PS33×4 top · CT18–9 · NVS9–1 · CT8–1 · PS33×4 bottom
 *
 * CDU is external (in-row / facility sidecar), not inside the IR9048 U stack.
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
  powerLayout: "4 PS33 bottom · 4 PS33 top",
  stackOrder: "PS33 top · CT18–9 · NVS9–1 · CT8–1 · PS33 bottom",
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
  frame: "#4b5563",
};

function makePower(
  n: number,
  u: number,
  bank: "bottom" | "top",
): RackPart {
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
    description: `Dell PS33 33 kW power shelf ${n} in the ${bank} bank of four. Six 5.5 kW AC PSUs feed the ORv3 busbar (~54 VDC) for CT/NVS trays. Power is split: 4 shelves at the bottom of the IR9048 and 4 at the top.`,
    specs: [
      { label: "Model", value: "PS33 · 33 kW" },
      { label: "Bank", value: bankLabel },
      { label: "Shelf #", value: `${n} of 8` },
      { label: "PSUs / shelf", value: "6 × 5500 W AC" },
      { label: "DC output", value: "Up to ~54 VDC busbar" },
      { label: "Layout", value: "4 bottom + 4 top" },
    ],
    color: COMPONENT_COLORS.power,
  };
}

function makeCompute(n: number, u: number, zone: RackZone): RackPart {
  const bank =
    zone === "ct-low"
      ? "Lower bank (CT1–CT8)"
      : zone === "ct-high"
        ? "Upper bank (CT9–CT18)"
        : "Compute bank";

  return {
    id: `ct-${n}`,
    kind: "compute",
    zone,
    placement: "in-rack",
    label: `CT${n} · PowerEdge XE9712`,
    shortLabel: `CT${n}`,
    uStart: u,
    uHeight: 1,
    description: `Dell PowerEdge XE9712 compute tray CT${n} (${bank}). 4× B300 + 2× Grace, DLC cold plates fed from rack manifolds to the external CDU, CX-8 / BF3 networking, iDRAC/OpenBMC.`,
    specs: [
      { label: "Tray ID", value: `CT${n}` },
      { label: "Bank", value: bank },
      { label: "GPUs", value: "4 × B300 Blackwell Ultra · 288 GB HBM3e ea." },
      { label: "CPUs", value: "2 × Grace · 72 Arm cores each" },
      { label: "CPU memory", value: "Up to 480 GB LPDDR5 / Grace" },
      { label: "East/West", value: "4× OSFP · ConnectX-8" },
      { label: "North/South", value: "1× BlueField-3 SuperNIC" },
      { label: "Cooling", value: "DLC → external CDU" },
      { label: "Management", value: "iDRAC 10 / OpenBMC" },
    ],
    color: COMPONENT_COLORS.compute,
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
    description: `NVLink switch tray NVS${n} (middle fabric NVS1–NVS9). Two NVSwitch ASICs; liquid-cooled via rack manifolds to the external CDU.`,
    specs: [
      { label: "Tray ID", value: `NVS${n}` },
      { label: "Bank", value: "Middle fabric (NVS1–NVS9)" },
      { label: "NVSwitch ASICs", value: "2 per tray" },
      { label: "Generation", value: "NVLink 5th gen" },
      { label: "Rack aggregate", value: "130 TB/s NVLink" },
      { label: "Cooling", value: "DLC → external CDU" },
    ],
    color: COMPONENT_COLORS.switch,
  };
}

function buildLayout(): RackPart[] {
  const parts: RackPart[] = [];
  let u = 1;

  // --- Bottom power: PS33 1–4 ---
  for (let n = 1; n <= 4; n++) {
    parts.push(makePower(n, u, "bottom"));
    u += 1;
  }

  // Rack coolant interface (not the CDU itself)
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
      "In-rack lower liquid manifold and quick-disconnects. Supply/return connect out of the IR9048 to the external CDU (in-row or facility). Leak sensors at tray and rack level.",
    specs: [
      { label: "Role", value: "Rack coolant interface" },
      { label: "CDU", value: "External — not in this U stack" },
      { label: "Serves", value: "CT1–CT8 / lower paths" },
      { label: "Leak detection", value: "Tray + rack sensors" },
    ],
    color: COMPONENT_COLORS.manifold,
  });
  u += 1;

  // CT1–CT8
  for (let n = 1; n <= 8; n++) {
    parts.push(makeCompute(n, u, "ct-low"));
    u += 1;
  }

  // NVS1–NVS9
  for (let n = 1; n <= 9; n++) {
    parts.push(makeNvs(n, u));
    u += 1;
  }

  // CT9–CT18
  for (let n = 9; n <= 18; n++) {
    parts.push(makeCompute(n, u, "ct-high"));
    u += 1;
  }

  // --- Top power: PS33 5–8 ---
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
    description:
      "Upper manifold / hose routing and cable service zone near top PS33 bank. Facility hoses still land on the external CDU.",
    specs: [
      { label: "Role", value: "Upper manifold + cabling" },
      { label: "CDU", value: "External" },
      { label: "Near", value: "PS33-5–8 (top power)" },
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
    description:
      "Top of stack: PowerSwitch SN2201-class OOB, iDRAC/OpenBMC, OpenManage Enterprise for CT1–CT18 and both PS33 banks.",
    specs: [
      { label: "OOB switches", value: "PowerSwitch SN2201 class (×2)" },
      { label: "Node BMC", value: "iDRAC 10 / OpenBMC" },
      { label: "Fleet tools", value: "OpenManage Enterprise" },
      { label: "Position", value: "Above top PS33 bank" },
    ],
    color: COMPONENT_COLORS.management,
  });

  // External CDU — not in U stack
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
      "Coolant Distribution Unit sits outside the IR9048 — in-row, end-of-row, or facility plant. Secondary loop pumps, heat exchange to primary facility water, and N+1 pump redundancy. Rack manifolds / QDCs only interface to this external CDU; there is no full CDU chassis inside the 48U stack.",
    specs: [
      { label: "Location", value: "External to IR9048" },
      { label: "Typical form", value: "In-row / in-rack sidecar / facility" },
      { label: "Serves", value: "One or more NVL72 SUs" },
      { label: "Loop", value: "Secondary DLC ↔ facility primary" },
      { label: "Redundancy", value: "N+1 pumps (design dependent)" },
      { label: "Alarms", value: "Flow, ΔP, leak, temp → BMS / OME" },
    ],
    color: COMPONENT_COLORS.cdu,
  });

  return parts;
}

export const RACK_PARTS = buildLayout();
export const IN_RACK_PARTS = RACK_PARTS.filter((p) => p.placement === "in-rack");
export const EXTERNAL_PARTS = RACK_PARTS.filter((p) => p.placement === "external");

/** Top → bottom elevation for UI (in-rack + external note). */
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
  { kind: "power", label: "PS33", count: "4+4" },
  { kind: "cdu", label: "External CDU", count: "Sidecar" },
  { kind: "manifold", label: "DLC manifolds", count: "In-rack" },
  { kind: "management", label: "OOB / iDRAC", count: "SN2201" },
];
