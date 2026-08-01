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
    title: "DLC leak detection trip (IR9048)",
    severity: "critical",
    symptoms: [
      "Rack or sled leak sensor asserts in OpenManage / facility BMS",
      "CDU interlock or emergency power policy risk",
      "Moisture under XE9712 sleds or along DLC manifolds",
    ],
    checks: [
      "Identify zone: sled-level vs rack manifold on IR9048",
      "Inspect cold-plate quick-disconnects on flagged PowerEdge XE9712 / NVLink trays",
      "Verify CDU supply/return pressure and drip-tray sensors",
      "Confirm facility primary loop if using in-row CDU with Dell IRSS",
    ],
    actions: [
      "Follow site EOP and Dell service procedures before reseating liquid lines",
      "Isolate power if liquid contacts electrical paths; engage ProSupport Plus if under contract",
      "Reseat QDCs; replace O-rings/hoses per Dell FRU guidance",
      "Do not clear latching leak alarms until dry and revalidated",
    ],
    relatedKinds: ["manifold", "compute", "switch"],
    tags: ["leak", "DLC", "IR9048", "CDU", "safety"],
  },
  {
    id: "thermal-throttle",
    category: "Cooling",
    title: "GPU / NVSwitch thermal throttling on XE9712",
    severity: "major",
    symptoms: [
      "B300 clocks dropping under sustained train/infer load",
      "High die temperature via iDRAC / HMC telemetry",
      "Job slowdowns without NVLink fabric errors",
    ],
    checks: [
      "Inlet coolant temp vs Dell IRSS design set-point",
      "CDU flow rate and ΔT across the IR9048 rack",
      "Cold-plate seating on hottest XE9712 sleds",
      "Residual air path for OSFP / E1.S zones still within limit",
    ],
    actions: [
      "Increase flow or lower inlet temp within Dell/facility limits",
      "Reseat or RMA cold-plate path on the hottest sled",
      "Balance load across SUs if facility cooling is undersized",
      "Apply Dell/NVIDIA firmware packages if thermal table fixes apply",
    ],
    relatedKinds: ["compute", "switch", "manifold"],
    tags: ["thermal", "throttle", "iDRAC", "DLC"],
  },
  {
    id: "cdu-flow",
    category: "Cooling",
    title: "CDU low flow or pump failover",
    severity: "major",
    symptoms: [
      "CDU N+1 pump failover events",
      "Low differential pressure alarms",
      "Multiple XE9712 sleds rising in temperature together",
    ],
    checks: [
      "Pump health on facility/in-rack CDU serving the IR9048",
      "Filter differential pressure (clogged strainer)",
      "Valve positions for the affected SU",
      "OpenManage / BMS correlation with rack power load",
    ],
    actions: [
      "Fail over to standby pump; replace failed pump cartridge",
      "Service filters; flush secondary loop if contaminated",
      "Validate facility capacity for multi-rack IRSS scale-out",
    ],
    relatedKinds: ["manifold"],
    tags: ["CDU", "pump", "flow", "IRSS"],
  },
  {
    id: "ps33-fail",
    category: "Power",
    title: "PS33 power shelf / PSU failure",
    severity: "major",
    symptoms: [
      "Amber/red LED on a PS33 shelf or individual 5.5 kW PSU",
      "Reduced power budget headroom in OpenManage",
      "AC phase imbalance or upstream breaker events",
    ],
    checks: [
      "Which of 8 PS33 shelves and which of 6 PSUs is faulted",
      "IR9048 busbar presence / shelf seating",
      "Facility feed and PDU/breaker loading for the rack",
      "Whether remaining PSUs keep N+n within policy",
    ],
    actions: [
      "Hot-swap failed 5500 W PSU if design supports online replace",
      "Replace entire PS33 shelf if midplane or multi-PSU fault",
      "Rebalance facility feeds; do not oversubscribe remaining shelves",
      "Log FRU serials for Dell ProSupport RMA",
    ],
    relatedKinds: ["power"],
    tags: ["PS33", "power", "busbar", "ORv3"],
  },
  {
    id: "rack-power-budget",
    category: "Power",
    title: "IR9048 approaching power ceiling",
    severity: "minor",
    symptoms: [
      "Power capping under peak FP4/FP8 load",
      "Scheduler jobs paused for power policy",
      "Facility demand-response signals",
    ],
    checks: [
      "Per-PS33 and rack aggregate telemetry",
      "Workload mix vs Dell power policy settings",
      "Whether peer SUs share the same electrical domain",
    ],
    actions: [
      "Enable staggered job ramp / power policies",
      "Confirm DLC can accept full power before raising caps",
      "Coordinate facility feed upgrades for IRSS growth",
    ],
    relatedKinds: ["power", "compute"],
    tags: ["budget", "capping", "IR9048"],
  },
  {
    id: "nvlink-error",
    category: "Fabric",
    title: "NVLink fabric errors inside the Dell SU",
    severity: "critical",
    symptoms: [
      "GPU peer-to-peer failures across XE9712 sleds",
      "NVSwitch port CRC / replay counters climbing",
      "Collectives hang isolated to one IR9048 rack",
    ],
    checks: [
      "Health of all 9 NVLink switch trays (18 ASICs)",
      "Per-GPU NVLink training status on each XE9712",
      "Backplane / tray seating for switch trays",
      "Whether one switch tray partitions the all-to-all domain",
    ],
    actions: [
      "Reseat or replace the implicated NVLink switch tray (Dell FRU process)",
      "Replace XE9712 sled if errors track a single GPU package",
      "Collect NVOS / HMC dumps before clearing sticky errors",
      "Keep SU out of production until domain is fully non-blocking",
    ],
    relatedKinds: ["switch", "compute"],
    tags: ["NVLink", "NVSwitch", "fabric", "XE9712"],
  },
  {
    id: "cx8-down",
    category: "Networking",
    title: "ConnectX-8 OSFP east/west link down",
    severity: "major",
    symptoms: [
      "Scale-out path degraded for one or more XE9712 sleds",
      "NCCL over network timeouts while in-rack NVLink is healthy",
      "Leaf/spine flaps matching CX-8 OSFP ports",
    ],
    checks: [
      "OSFP link LEDs and adapter status on the sled",
      "Optics / DAC seating and FEC counters",
      "Dell/NVIDIA leaf switch config (speed, FEC, MTU)",
      "Whether BlueField-3 north/south is also impacted",
    ],
    actions: [
      "Reseat optics; replace bad transceiver/cable",
      "Bounce the CX-8 PF after firmware check",
      "Replace mezz/I/O FRU or entire XE9712 if hardware fault",
      "Roll CX-8 firmware via controlled Dell update window",
    ],
    relatedKinds: ["compute"],
    tags: ["ConnectX-8", "OSFP", "RDMA", "east-west"],
  },
  {
    id: "bf3-dpu",
    category: "Networking",
    title: "BlueField-3 SuperNIC / storage path issues",
    severity: "major",
    symptoms: [
      "North/south traffic blackholed for a sled",
      "Remote storage / SNAP path not presenting",
      "DPU Arm OS unreachable while host GPUs remain up",
    ],
    checks: [
      "BF3 mode and BMC reachability on XE9712",
      "DPU OS health and representors",
      "Secure boot / root-of-trust events",
      "Uplink from dual-port BF3 path",
    ],
    actions: [
      "Reboot DPU subsystem via iDRAC/OpenBMC if policy allows",
      "Reflash BF3 image from Dell-supported media",
      "Replace SuperNIC FRU or sled if self-test fails",
      "Restore zero-trust policy after recovery",
    ],
    relatedKinds: ["compute", "management"],
    tags: ["BlueField", "BF3", "SuperNIC", "storage"],
  },
  {
    id: "idrac-oob",
    category: "Management",
    title: "iDRAC / OpenBMC unreachable on XE9712",
    severity: "major",
    symptoms: [
      "Cannot inventory or power-control a sled from OpenManage Enterprise",
      "PowerSwitch OOB port up but iDRAC/OpenBMC times out",
      "Sensor history gaps in fleet tools",
    ],
    checks: [
      "SN2201 OOB switch port/VLAN for the sled BMC",
      "BMC IP reservation (DHCP/static) and certificates",
      "Dedicated BMC RJ45 seating on XE9712",
      "Whether host OS still runs in-band",
    ],
    actions: [
      "Cycle BMC via chassis management if available",
      "Re-cable OOB; replace SN2201 optic/port if needed",
      "Factory-reset BMC only under change control",
      "Replace sled if BMC silicon fails — open ProSupport case with Service Tag",
    ],
    relatedKinds: ["management", "compute"],
    tags: ["iDRAC", "OpenBMC", "OpenManage", "OOB"],
  },
  {
    id: "openmanage",
    category: "Management",
    title: "OpenManage Enterprise inventory drift",
    severity: "minor",
    symptoms: [
      "Missing XE9712 or PS33 components after FRU swap",
      "Firmware compliance report stale",
      "Alert storms after mass discovery",
    ],
    checks: [
      "OME discovery ranges cover IR9048 OOB subnets",
      "Credentials / certificates for iDRAC and BMC paths",
      "Duplicate Service Tags after sled moves",
    ],
    actions: [
      "Re-run discovery / refresh inventory for the SU",
      "Update Dell catalog baselines for XE9712 firmware",
      "Suppress duplicate alerts after FRU replacement",
    ],
    relatedKinds: ["management"],
    tags: ["OpenManage", "OME", "inventory", "firmware"],
  },
  {
    id: "tray-offline",
    category: "Compute",
    title: "PowerEdge XE9712 sled offline or failed POST",
    severity: "major",
    symptoms: [
      "Sled missing from fabric and OpenManage",
      "Grace memory training failures",
      "GPU enumeration incomplete (expect 4× B300)",
    ],
    checks: [
      "iDRAC/OpenBMC health codes and SEL",
      "Busbar / sled power presence from PS33 path",
      "M.2 boot device health",
      "HBM and LPDDR training logs via HMC path",
    ],
    actions: [
      "Cold boot after confirming DLC present and leak-free",
      "Reseat sled fully on IR9048 midplane/rails",
      "Reimage OS M.2 from Dell-supported golden image",
      "RMA XE9712 via ProSupport if GPU/CPU package fails diagnostics",
    ],
    relatedKinds: ["compute", "power"],
    tags: ["POST", "XE9712", "Service Tag", "RMA"],
  },
  {
    id: "nvme-cache",
    category: "Storage",
    title: "E1.S / M.2 storage faults on XE9712",
    severity: "minor",
    symptoms: [
      "OS boot failures (M.2)",
      "Local cache I/O errors on E1.S devices",
      "SMART predictive failure alerts in iDRAC",
    ],
    checks: [
      "SMART attributes and media errors",
      "PCIe link width/speed to drives",
      "Filesystem / cache pool metadata",
    ],
    actions: [
      "Replace failed E1.S (hot-swap where supported); rebuild cache",
      "Reimage OS M.2",
      "Apply Dell-qualified drive firmware in maintenance window",
    ],
    relatedKinds: ["compute"],
    tags: ["NVMe", "E1.S", "M.2", "iDRAC"],
  },
  {
    id: "su-scaleout",
    category: "Cluster",
    title: "Multi-SU (multi-IR9048) job imbalance",
    severity: "info",
    symptoms: [
      "Jobs spanning multiple Dell IRSS racks slower than single-SU NVLink",
      "Network congestion between racks while intra-rack is fine",
      "Uneven GPU utilization across SUs",
    ],
    checks: [
      "Confirm each SU internal NVLink domain is healthy first",
      "East/west leaf-spine utilization and ECMP balance",
      "Scheduler topology awareness (keep NVLink-heavy stages in-SU)",
    ],
    actions: [
      "Pin NVLink-bound collectives inside one XE9712 SU when possible",
      "Increase inter-rack bandwidth or reduce oversubscription",
      "Tune NCCL/network plugin for dual-plane Spectrum-X / Quantum designs",
    ],
    relatedKinds: ["switch", "compute"],
    tags: ["SU", "IRSS", "scale-out", "NCCL"],
  },
];

export const GUIDE_CATEGORIES = Array.from(
  new Set(TROUBLESHOOTING_GUIDE.map((g) => g.category)),
).sort();
