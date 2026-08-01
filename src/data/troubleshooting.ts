export type Severity = "critical" | "major" | "minor" | "info";

export type GuideSection = {
  id: string;
  category: string;
  title: string;
  severity: Severity;
  symptoms: string[];
  checks: string[];
  actions: string[];
  relatedKinds: Array<"compute" | "switch" | "power" | "manifold" | "management" | "frame">;
  tags: string[];
};

export const SEVERITY_META: Record<
  Severity,
  { label: string; className: string; order: number }
> = {
  critical: {
    label: "Critical",
    className: "bg-danger/15 text-danger border-danger/30",
    order: 0,
  },
  major: {
    label: "Major",
    className: "bg-warn/15 text-warn border-warn/30",
    order: 1,
  },
  minor: {
    label: "Minor",
    className: "bg-compute/15 text-compute border-compute/30",
    order: 2,
  },
  info: {
    label: "Info",
    className: "bg-muted/15 text-muted border-border",
    order: 3,
  },
};

export const TROUBLESHOOTING_GUIDE: GuideSection[] = [
  {
    id: "leak-detect",
    category: "Cooling",
    title: "Liquid leak detection trip",
    severity: "critical",
    symptoms: [
      "Rack or tray leak sensor asserts alarm",
      "CDU flow interlock or emergency power-off risk",
      "Visible moisture under trays or along manifolds",
    ],
    checks: [
      "Identify which zone reported: tray-level vs rack-level manifold",
      "Inspect cold-plate quick-disconnects on flagged compute/switch trays",
      "Verify CDU supply/return pressure and drip-tray sensors",
      "Confirm facility water / secondary loop integrity if using in-row CDU",
    ],
    actions: [
      "Follow site EOP: isolate power if liquid contacts electrical paths",
      "Drain and reseat QDCs on the affected tray; replace O-rings if damaged",
      "Replace leak sensor cable or tray if false-positive after dry validation",
      "Document incident; do not clear latching alarms until dry and revalidated",
    ],
    relatedKinds: ["manifold", "compute", "switch"],
    tags: ["leak", "coolant", "CDU", "safety"],
  },
  {
    id: "thermal-throttle",
    category: "Cooling",
    title: "GPU / NVSwitch thermal throttling",
    severity: "major",
    symptoms: [
      "SM clocks dropping under sustained train/infer load",
      "High die temperature telemetry on B300 or NVSwitch ASICs",
      "Unexpected job slowdowns without fabric errors",
    ],
    checks: [
      "Compare inlet coolant temp vs design set-point for the SU",
      "CDU flow rate and ΔT across the rack",
      "Cold-plate seating and TIM integrity on hot trays",
      "Air-side residual cooling for OSFP / storage zones still within limit",
    ],
    actions: [
      "Reduce inlet water temperature or increase flow within OEM limits",
      "Reseat / replace the hottest compute or switch tray cold plate path",
      "Balance load across SUs if facility cooling is undersized",
      "Update BMC/firmware if known thermal table bugs apply",
    ],
    relatedKinds: ["compute", "switch", "manifold"],
    tags: ["thermal", "throttle", "flow", "temperature"],
  },
  {
    id: "cdu-flow",
    category: "Cooling",
    title: "CDU low flow or pump failover",
    severity: "major",
    symptoms: [
      "CDU N+1 pump failover events",
      "Low differential pressure alarms",
      "Multiple trays showing rising temperature simultaneously",
    ],
    checks: [
      "Pump health LEDs / Redfish sensors on in-rack or in-row CDU",
      "Filter differential pressure (clogged strainer)",
      "Facility primary loop supply availability",
      "Valve positions for the affected SU",
    ],
    actions: [
      "Swap to standby pump; replace failed pump cartridge",
      "Service filters; flush secondary loop if contaminated",
      "Verify facility side capacity for multi-SU scale-out",
    ],
    relatedKinds: ["manifold"],
    tags: ["CDU", "pump", "flow", "pressure"],
  },
  {
    id: "power-shelf",
    category: "Power",
    title: "Power shelf / PSU failure",
    severity: "major",
    symptoms: [
      "PSU amber/red LED on a 33 kW shelf",
      "Reduced power budget headroom warnings",
      "Unexpected AC phase imbalance or breaker trips",
    ],
    checks: [
      "Which of the 8 shelves and which of the 6 PSUs is faulted",
      "Input feed / PDU phase loading for the rack",
      "Busbar connection integrity and shelf presence detect",
      "Whether remaining PSUs keep N+n within policy",
    ],
    actions: [
      "Hot-swap failed 5.5 kW PSU if design supports online replace",
      "Rebalance rack input feeds; check facility PDU thresholds",
      "Replace entire power shelf if multiple PSUs or midplane fault",
      "Do not oversubscribe remaining shelves during recovery windows",
    ],
    relatedKinds: ["power"],
    tags: ["PSU", "power", "busbar", "PDU"],
  },
  {
    id: "rack-power-budget",
    category: "Power",
    title: "Rack approaching power ceiling (~132–142 kW)",
    severity: "minor",
    symptoms: [
      "Power capping events under peak FP4/FP8 load",
      "Scheduler jobs paused for power policy",
      "Facility demand-response signals",
    ],
    checks: [
      "Per-shelf and rack aggregate power telemetry",
      "Workload mix (dense all-GPU vs sparse)",
      "Whether other SUs share the same power domain",
    ],
    actions: [
      "Enable job-level power policies or staggered ramp",
      "Validate cooling can accept full power before raising caps",
      "Coordinate with facility for feed capacity upgrades",
    ],
    relatedKinds: ["power", "compute"],
    tags: ["budget", "capping", "facility"],
  },
  {
    id: "nvlink-error",
    category: "Fabric",
    title: "NVLink fabric errors / incomplete domain",
    severity: "critical",
    symptoms: [
      "GPU peer-to-peer failures inside the SU",
      "NVSwitch port CRC / replay counters climbing",
      "Training all-reduce hangs isolated to one rack",
    ],
    checks: [
      "NVOS / NVSwitch tray health for all 9 switch trays (18 ASICs)",
      "Per-GPU NVLink link training status (18 links per GPU class design)",
      "Copper backplane / cable seating for switch trays",
      "Whether a single switch tray partitions the all-to-all fabric",
    ],
    actions: [
      "Reseat or replace the implicated NVLink switch tray",
      "Replace compute tray if errors track a single GPU package",
      "Collect NVOS dumps before clearing sticky errors",
      "Keep the SU out of production until domain is fully non-blocking again",
    ],
    relatedKinds: ["switch", "compute"],
    tags: ["NVLink", "NVSwitch", "fabric", "P2P"],
  },
  {
    id: "cx8-down",
    category: "Networking",
    title: "ConnectX-8 east/west link down",
    severity: "major",
    symptoms: [
      "Scale-out Ethernet/IB path degraded for one or more trays",
      "NCCL over network timeouts while NVLink domain is healthy",
      "Leaf/spine port flaps corresponding to CX-8 ports",
    ],
    checks: [
      "Per-tray ConnectX-8 link LEDs and ethtool/ibstat equivalents",
      "Optics / DAC seating and FEC counters",
      "Leaf switch port config (speed, FEC, MTU)",
      "Whether BlueField-3 north/south is also impacted (shared tray issue)",
    ],
    actions: [
      "Reseat optics; replace bad cable or transceiver",
      "Bounce the NIC PF after firmware check",
      "Replace compute tray mezz if persistent hardware faults",
      "Update CX-8 firmware in a controlled rolling window",
    ],
    relatedKinds: ["compute"],
    tags: ["ConnectX-8", "RDMA", "east-west", "optics"],
  },
  {
    id: "bf3-dpu",
    category: "Networking",
    title: "BlueField-3 DPU / storage path issues",
    severity: "major",
    symptoms: [
      "North/south traffic blackholed for a tray",
      "SNAP / remote storage not presenting",
      "DPU Arm OS unreachable while host GPUs remain up",
    ],
    checks: [
      "DPU mode (ECPF vs NIC) and BMC reachability",
      "DPU OS health, NIC representors, and virtual switch",
      "Secure boot / root-of-trust events",
      "Uplink connectivity from dual-port B3240",
    ],
    actions: [
      "Reboot DPU subsystem via BMC if policy allows",
      "Reflash DPU firmware / BFB image from golden media",
      "Replace tray if DPU hardware fails self-test",
      "Restore zero-trust policy after recovery",
    ],
    relatedKinds: ["compute", "management"],
    tags: ["BlueField", "DPU", "SNAP", "storage"],
  },
  {
    id: "grace-bmc",
    category: "Management",
    title: "Grace BMC / Redfish unreachable",
    severity: "major",
    symptoms: [
      "Cannot inventory or power-control a compute tray",
      "OOB switch shows port up but Redfish times out",
      "Sensor history gaps in DCIM",
    ],
    checks: [
      "SN2201 OOB switch port and VLAN for the tray BMC",
      "BMC IP allocation / DHCP / static reservations",
      "Credential and certificate validity",
      "Whether host still runs (in-band may still work)",
    ],
    actions: [
      "Cycle BMC via chassis management if available",
      "Re-cable OOB path; replace management switch SFP if needed",
      "Factory-reset BMC only with change control",
      "Replace tray if BMC silicon is dead",
    ],
    relatedKinds: ["management", "compute"],
    tags: ["BMC", "Redfish", "OOB", "inventory"],
  },
  {
    id: "tray-offline",
    category: "Compute",
    title: "Compute tray offline or failed POST",
    severity: "major",
    symptoms: [
      "Tray missing from fabric and management plane",
      "Grace CPUs fail memory training",
      "GPU enumeration incomplete (expect 4 GPUs)",
    ],
    checks: [
      "Front panel / BMC health codes",
      "Power delivery from busbar to the tray",
      "Local M.2 OS device health",
      "HBM and LPDDR training logs",
    ],
    actions: [
      "Cold boot tray after confirming coolant present",
      "Reseat tray fully on midplane/connectors",
      "Swap OS M.2; reimage node",
      "RMA tray if GPU/CPU package fails diagnostics",
    ],
    relatedKinds: ["compute", "power"],
    tags: ["POST", "GPU", "Grace", "RMA"],
  },
  {
    id: "nvme-cache",
    category: "Storage",
    title: "Local E1.S / M.2 storage faults",
    severity: "minor",
    symptoms: [
      "OS boot failures (M.2)",
      "Checkpoint cache I/O errors (E1.S devices)",
      "SMART predictive failure alerts",
    ],
    checks: [
      "SMART attributes and media error counts",
      "PCIe link width/speed to drives",
      "Filesystem / RAID metadata if used for cache",
    ],
    actions: [
      "Replace failed E1.S device; rebuild cache pool",
      "Reimage OS M.2 from secure golden image",
      "Update drive firmware during maintenance window",
    ],
    relatedKinds: ["compute"],
    tags: ["NVMe", "E1.S", "M.2", "cache"],
  },
  {
    id: "su-scaleout",
    category: "Cluster",
    title: "Multi-SU scale-out job imbalance",
    severity: "info",
    symptoms: [
      "Jobs spanning multiple SUs slower than single-SU NVLink domain",
      "Network congestion between racks while intra-rack is fine",
      "Uneven GPU utilization across SUs",
    ],
    checks: [
      "Confirm each SU's internal NVLink domain is healthy first",
      "East/west leaf-spine utilization and ECMP balance",
      "Scheduler topology awareness (keep NVLink-heavy stages in-SU)",
    ],
    actions: [
      "Pin NVLink-bound collectives inside one SU when possible",
      "Increase inter-rack bandwidth or reduce oversubscription",
      "Tune NCCL/network plugin for dual-plane designs",
    ],
    relatedKinds: ["switch", "compute"],
    tags: ["SU", "scale-out", "NCCL", "topology"],
  },
];

export const GUIDE_CATEGORIES = Array.from(
  new Set(TROUBLESHOOTING_GUIDE.map((g) => g.category)),
).sort();
