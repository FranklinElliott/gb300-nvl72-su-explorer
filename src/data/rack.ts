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

/**
 * Dell Integrated Rack Scalable System — one SU:
 * PowerEdge XE9712 (GB300 NVL72) sleds in IR9048 ORv3 rack.
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

function buildLayout(): RackPart[] {
  const parts: RackPart[] = [];
  let u = 1;

  for (let i = 0; i < 8; i++) {
    parts.push({
      id: `psu-${i + 1}`,
      kind: "power",
      label: `Dell PS33 Power Shelf ${i + 1}`,
      shortLabel: `PS33-${i + 1}`,
      uStart: u,
      uHeight: 1,
      description:
        "Dell IR9048 33 kW power shelf (PS33) with six 5.5 kW AC PSUs. Delivers up to ~54 VDC over the ORv3 busbar to PowerEdge XE9712 sleds and rack components — no traditional per-node PDUs.",
      specs: [
        { label: "Model", value: "PS33 · 33 kW" },
        { label: "PSUs / shelf", value: "6 × 5500 W AC" },
        { label: "DC output", value: "Up to ~54 VDC busbar" },
        { label: "Rack shelves", value: "8 × PS33" },
        { label: "Rack draw class", value: "~132–142 kW" },
      ],
      color: COMPONENT_COLORS.power,
    });
    u += 1;
  }

  parts.push({
    id: "manifold-lower",
    kind: "manifold",
    label: "DLC Manifold & Leak Detection",
    shortLabel: "DLC",
    uStart: u,
    uHeight: 2,
    description:
      "Direct Liquid Cooling distribution for the IR9048 Integrated Rack — supply/return manifolds, quick-disconnects to XE9712 and NVLink switch cold plates, tray- and rack-level leak sensing.",
    specs: [
      { label: "Cooling", value: "Dell DLC + residual air" },
      { label: "Rack", value: "IR9048 ORv3 IRSS" },
      { label: "Leak detection", value: "Tray + rack sensors" },
      { label: "Facility interface", value: "CDU / facility loop" },
    ],
    color: COMPONENT_COLORS.manifold,
  });
  u += 2;

  let computeIdx = 1;
  let switchIdx = 1;
  for (let group = 0; group < 9; group++) {
    for (let c = 0; c < 2; c++) {
      const n = computeIdx++;
      parts.push({
        id: `compute-${n}`,
        kind: "compute",
        label: `PowerEdge XE9712 Sled ${n}`,
        shortLabel: `XE9712-${n}`,
        uStart: u,
        uHeight: 1,
        description:
          "Dell PowerEdge XE9712 1U compute sled: 4× NVIDIA Blackwell Ultra (B300) GPUs + 2× NVIDIA Grace CPUs, Direct Liquid Cooling cold plates, ConnectX-8 east/west, BlueField-3 SuperNIC, iDRAC/OpenBMC management path to NVIDIA HMC.",
        specs: [
          { label: "GPUs", value: "4 × B300 Blackwell Ultra · 288 GB HBM3e ea." },
          { label: "CPUs", value: "2 × Grace · 72 Arm cores each" },
          { label: "CPU memory", value: "Up to 480 GB LPDDR5 / Grace" },
          { label: "C2C / NVLink-C2C", value: "900 GB/s coherent class" },
          { label: "East/West", value: "4× OSFP · ConnectX-8 SuperNICs" },
          { label: "North/South", value: "1× BlueField-3 SuperNIC" },
          { label: "Storage", value: "M.2 boot + up to 8× E1.S NVMe" },
          { label: "Management", value: "iDRAC 10 / OpenBMC · AST2600" },
          { label: "Rails", value: "Static rails · IR9048 ORv3" },
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
      shortLabel: `NVSW-${s}`,
      uStart: u,
      uHeight: 1,
      description:
        "In-rack NVIDIA NVLink 5th-gen switch tray (2 NVSwitch ASICs) inside the Dell IRSS rack. Completes the non-blocking all-to-all fabric for all 72 GPUs in this PowerEdge XE9712 SU.",
      specs: [
        { label: "NVSwitch ASICs", value: "2 per tray" },
        { label: "Generation", value: "NVLink 5th gen" },
        { label: "Domain", value: "Single-rack L1 (no inter-rack NVLink)" },
        { label: "Rack aggregate", value: "130 TB/s NVLink" },
        { label: "Host sleds", value: "PowerEdge XE9712 × 18" },
      ],
      color: COMPONENT_COLORS.switch,
    });
    u += 1;
  }

  parts.push({
    id: "mgmt",
    kind: "management",
    label: "Dell / PowerSwitch OOB Management",
    shortLabel: "OOB",
    uStart: u,
    uHeight: 2,
    description:
      "Out-of-band plane for the Integrated Rack: Dell PowerSwitch SN2201-class OOB switches, iDRAC/OpenBMC paths, BMC RJ45, and OpenManage Enterprise inventory/control for XE9712 sleds and rack infrastructure.",
    specs: [
      { label: "OOB switches", value: "PowerSwitch SN2201 class (×2)" },
      { label: "Node BMC", value: "iDRAC 10 / OpenBMC" },
      { label: "Fleet tools", value: "OpenManage Enterprise" },
      { label: "HPM path", value: "BMC ↔ NVIDIA HMC" },
      { label: "Support", value: "ProSupport / ProSupport Plus" },
    ],
    color: COMPONENT_COLORS.management,
  });
  u += 2;

  parts.push({
    id: "manifold-upper",
    kind: "manifold",
    label: "Upper Cable / Service Zone",
    shortLabel: "Service",
    uStart: u,
    uHeight: Math.max(1, 48 - u + 1),
    description:
      "IR9048 upper service zone for fiber/copper scale-out cabling, sensor harnesses, and secondary DLC routing depending on Dell Integrated Rack kit and facility design.",
    specs: [
      { label: "Rack", value: "IR9048 · 48U ORv3" },
      { label: "Zone", value: "Cabling & service access" },
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
  { kind: "compute", label: "XE9712 sleds", count: "18 × 1U" },
  { kind: "switch", label: "NVLink switch", count: "9 × 1U" },
  { kind: "power", label: "PS33 shelves", count: "8 × 33 kW" },
  { kind: "manifold", label: "DLC / service", count: "Manifolds" },
  { kind: "management", label: "OOB / iDRAC", count: "SN2201" },
];
