export type ComponentKind =
  | "compute"
  | "switch"
  | "power"
  | "manifold"
  | "management"
  | "frame";

export type RackZone = "power" | "ct-low" | "nvs" | "ct-high" | "mgmt" | "service";

export type RackPart = {
  id: string;
  kind: ComponentKind;
  zone: RackZone;
  label: string;
  shortLabel: string;
  uStart: number;
  uHeight: number;
  description: string;
  specs: { label: string; value: string }[];
  color: string;
};

/**
 * Dell IR9048 front elevation (bottom → top):
 *   PS33 power → CT1–CT8 → NVS1–NVS9 → CT9–CT18 → OOB / service
 *
 * Top-down label order (as operators often call it):
 *   CT18–CT9 · NVS9–NVS1 · CT8–CT1
 */
export const RACK_SPECS = {
  name: "Dell PowerEdge XE9712",
  platform: "NVIDIA GB300 NVL72",
  role: "Integrated Rack Scalable System (SU)",
  formFactor: "48U Dell IR9048 ORv3 · Direct Liquid Cooling",
  dimensions: "≈ 2294 × 750 × 1200 mm (H×W×D)",
  weight: "≈ 1590 kg wet cabinet class",
  power: "PS33 shelves · ~132–142 kW class",
  gpus: 72,
  cpus: 36,
  computeTrays: 18,
  switchTrays: 9,
  powerShelves: 8,
  stackOrder: "CT18–9 · NVS9–1 · CT8–1 (top → bottom)",
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
  frame: "#4b5563",
};

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
    label: `CT${n} · PowerEdge XE9712`,
    shortLabel: `CT${n}`,
    uStart: u,
    uHeight: 1,
    description: `Dell PowerEdge XE9712 compute tray CT${n} (${bank}). 4× NVIDIA Blackwell Ultra (B300) GPUs + 2× NVIDIA Grace CPUs, DLC cold plates, ConnectX-8 east/west, BlueField-3 SuperNIC, iDRAC/OpenBMC to NVIDIA HMC.`,
    specs: [
      { label: "Tray ID", value: `CT${n}` },
      { label: "Bank", value: bank },
      { label: "GPUs", value: "4 × B300 Blackwell Ultra · 288 GB HBM3e ea." },
      { label: "CPUs", value: "2 × Grace · 72 Arm cores each" },
      { label: "CPU memory", value: "Up to 480 GB LPDDR5 / Grace" },
      { label: "C2C / NVLink-C2C", value: "900 GB/s coherent class" },
      { label: "East/West", value: "4× OSFP · ConnectX-8 SuperNICs" },
      { label: "North/South", value: "1× BlueField-3 SuperNIC" },
      { label: "Storage", value: "M.2 boot + up to 8× E1.S NVMe" },
      { label: "Management", value: "iDRAC 10 / OpenBMC · AST2600" },
    ],
    color: COMPONENT_COLORS.compute,
  };
}

function makeNvs(n: number, u: number): RackPart {
  return {
    id: `nvs-${n}`,
    kind: "switch",
    zone: "nvs",
    label: `NVS${n} · NVLink Switch Tray`,
    shortLabel: `NVS${n}`,
    uStart: u,
    uHeight: 1,
    description: `NVLink switch tray NVS${n} (middle fabric bank NVS1–NVS9). Two NVSwitch ASICs (5th-gen NVLink) completing the non-blocking all-to-all domain for all 72 GPUs across CT1–CT18.`,
    specs: [
      { label: "Tray ID", value: `NVS${n}` },
      { label: "Bank", value: "Middle fabric (NVS1–NVS9)" },
      { label: "NVSwitch ASICs", value: "2 per tray" },
      { label: "Generation", value: "NVLink 5th gen" },
      { label: "Domain", value: "Single-rack L1 (no inter-rack NVLink)" },
      { label: "Rack aggregate", value: "130 TB/s NVLink" },
      { label: "Peers", value: "CT1–CT18 (18 × XE9712)" },
    ],
    color: COMPONENT_COLORS.switch,
  };
}

function buildLayout(): RackPart[] {
  const parts: RackPart[] = [];
  let u = 1;

  // --- Bottom: PS33 power domain ---
  for (let i = 0; i < 8; i++) {
    parts.push({
      id: `psu-${i + 1}`,
      kind: "power",
      zone: "power",
      label: `Dell PS33 Power Shelf ${i + 1}`,
      shortLabel: `PS33-${i + 1}`,
      uStart: u,
      uHeight: 1,
      description:
        "Dell IR9048 33 kW power shelf (PS33) with six 5.5 kW AC PSUs. Delivers up to ~54 VDC over the ORv3 busbar to CT/NVS trays — base of the IR9048 stack.",
      specs: [
        { label: "Model", value: "PS33 · 33 kW" },
        { label: "PSUs / shelf", value: "6 × 5500 W AC" },
        { label: "DC output", value: "Up to ~54 VDC busbar" },
        { label: "Rack shelves", value: "8 × PS33" },
        { label: "Position", value: "Bottom of IR9048" },
      ],
      color: COMPONENT_COLORS.power,
    });
    u += 1;
  }

  parts.push({
    id: "manifold-lower",
    kind: "manifold",
    zone: "service",
    label: "Lower DLC Manifold & Leak Sensors",
    shortLabel: "DLC-L",
    uStart: u,
    uHeight: 1,
    description:
      "Lower Direct Liquid Cooling manifold and leak detection under the CT1–CT8 bank.",
    specs: [
      { label: "Cooling", value: "Dell DLC" },
      { label: "Serves", value: "CT1–CT8 primarily" },
      { label: "Leak detection", value: "Tray + rack sensors" },
    ],
    color: COMPONENT_COLORS.manifold,
  });
  u += 1;

  // --- CT1–CT8 (bottom compute bank; top-down this is CT8…CT1) ---
  for (let n = 1; n <= 8; n++) {
    parts.push(makeCompute(n, u, "ct-low"));
    u += 1;
  }

  // --- NVS1–NVS9 (middle fabric; top-down NVS9…NVS1) ---
  for (let n = 1; n <= 9; n++) {
    parts.push(makeNvs(n, u));
    u += 1;
  }

  // --- CT9–CT18 (upper compute bank; top-down CT18…CT9) ---
  for (let n = 9; n <= 18; n++) {
    parts.push(makeCompute(n, u, "ct-high"));
    u += 1;
  }

  parts.push({
    id: "mgmt",
    kind: "management",
    zone: "mgmt",
    label: "Dell / PowerSwitch OOB Management",
    shortLabel: "OOB",
    uStart: u,
    uHeight: 2,
    description:
      "Above CT18: PowerSwitch SN2201-class OOB, iDRAC/OpenBMC paths, OpenManage Enterprise inventory for CT1–CT18 and PS33 infrastructure.",
    specs: [
      { label: "OOB switches", value: "PowerSwitch SN2201 class (×2)" },
      { label: "Node BMC", value: "iDRAC 10 / OpenBMC" },
      { label: "Fleet tools", value: "OpenManage Enterprise" },
      { label: "Position", value: "Above CT18" },
    ],
    color: COMPONENT_COLORS.management,
  });
  u += 2;

  parts.push({
    id: "manifold-upper",
    kind: "manifold",
    zone: "service",
    label: "Upper Cable / Service Zone",
    shortLabel: "Service",
    uStart: u,
    uHeight: Math.max(1, 48 - u + 1),
    description:
      "Top of IR9048: scale-out fiber/copper, sensor harnesses, secondary DLC routing.",
    specs: [
      { label: "Rack", value: "IR9048 · 48U ORv3" },
      { label: "Below", value: "CT18–CT9 · NVS9–1 · CT8–1" },
    ],
    color: COMPONENT_COLORS.manifold,
  });

  return parts;
}

export const RACK_PARTS = buildLayout();

/** Top → bottom elevation string for UI chrome. */
export const ELEVATION_TOP_DOWN = [
  { id: "ct-high", label: "CT18 – CT9", detail: "10 × PowerEdge XE9712", kind: "compute" as const },
  { id: "nvs", label: "NVS9 – NVS1", detail: "9 × NVLink switch trays", kind: "switch" as const },
  { id: "ct-low", label: "CT8 – CT1", detail: "8 × PowerEdge XE9712", kind: "compute" as const },
  { id: "power", label: "PS33 × 8", detail: "Power shelves + busbar", kind: "power" as const },
];

export function getPart(id: string | null): RackPart | undefined {
  if (!id) return undefined;
  return RACK_PARTS.find((p) => p.id === id);
}

export const KIND_LEGEND: { kind: ComponentKind; label: string; count: string }[] = [
  { kind: "compute", label: "CT trays", count: "CT1–18" },
  { kind: "switch", label: "NVS trays", count: "NVS1–9" },
  { kind: "power", label: "PS33 shelves", count: "8 × 33 kW" },
  { kind: "manifold", label: "DLC / service", count: "Manifolds" },
  { kind: "management", label: "OOB / iDRAC", count: "SN2201" },
];
