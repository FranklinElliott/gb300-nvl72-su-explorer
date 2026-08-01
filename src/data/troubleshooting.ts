export type Severity = "critical" | "major" | "minor" | "info";

export type GuideSection = {
  id: string;
  category: string;
  title: string;
  severity: Severity;
  symptoms: string[];
  checks: string[];
  actions: string[];
  relatedKinds: Array<
    "compute" | "switch" | "power" | "manifold" | "management" | "cdu" | "frame"
  >;
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
    title: "DLC leak detection trip (rack manifolds)",
    severity: "critical",
    symptoms: [
      "Rack or sled leak sensor asserts in OpenManage / facility BMS",
      "Moisture at QDCs between IR9048 manifolds and external CDU hoses",
      "CDU interlock or emergency power policy risk",
    ],
    checks: [
      "Separate rack manifold leak vs external CDU drip-tray / hose leak",
      "Inspect QDCs on CT/NVS cold plates and bulkhead fittings to external CDU",
      "Verify secondary loop pressure from the external CDU",
    ],
    actions: [
      "Follow site EOP; isolate power if liquid contacts electrical paths",
      "Reseat QDCs; replace O-rings/hoses per Dell FRU guidance",
      "Engage ProSupport Plus + facilities for external CDU hose work",
      "Do not clear latching leak alarms until dry and revalidated",
    ],
    relatedKinds: ["manifold", "cdu", "compute", "switch"],
    tags: ["leak", "DLC", "QDC", "external CDU", "safety"],
  },
  {
    id: "external-cdu",
    category: "Cooling",
    title: "External CDU fault (in-row / facility)",
    severity: "critical",
    symptoms: [
      "CDU low flow, high ΔP, or pump failover",
      "Many CT/NVS trays thermal rise together (not a single sled)",
      "BMS alarms on external CDU while IR9048 manifolds look dry",
    ],
    checks: [
      "CDU is external — inspect in-row/facility unit, not a tray inside the 48U stack",
      "N+1 pump status, strainer DP, primary facility water availability",
      "Hose isolation valves between CDU and IR9048 bulkheads",
      "Whether peer SUs share the same CDU plant",
    ],
    actions: [
      "Fail over standby pump; service filters on the external CDU",
      "Do not open live primary loops without facilities lockout",
      "Reduce load on the SU until secondary flow is restored",
      "Coordinate Dell + mechanical contractor for CDU RMA / capacity",
    ],
    relatedKinds: ["cdu", "manifold"],
    tags: ["CDU", "external", "pump", "facility", "flow"],
  },
  {
    id: "thermal-throttle",
    category: "Cooling",
    title: "GPU / NVSwitch thermal throttling on XE9712",
    severity: "major",
    symptoms: [
      "B300 clocks dropping under load",
      "High die temperature via iDRAC / HMC",
      "Single bank (CT1–8 vs CT9–18) hotter than the other",
    ],
    checks: [
      "External CDU inlet temp and flow vs design",
      "Upper vs lower manifold balance",
      "Cold-plate seating on hottest CT/NVS",
    ],
    actions: [
      "Raise flow / lower inlet on external CDU within limits",
      "Reseat cold plates on hot trays",
      "Apply Dell/NVIDIA firmware if thermal fixes apply",
    ],
    relatedKinds: ["compute", "switch", "manifold", "cdu"],
    tags: ["thermal", "throttle", "iDRAC", "DLC"],
  },
  {
    id: "ps33-bank",
    category: "Power",
    title: "PS33 shelf failure (top or bottom bank)",
    severity: "major",
    symptoms: [
      "Amber/red on PS33-1–4 (bottom) or PS33-5–8 (top)",
      "Reduced headroom; possible bank imbalance",
      "AC phase or breaker events on one feed",
    ],
    checks: [
      "Which bank failed: bottom (under CT1) vs top (above CT18)",
      "Which of 6 PSUs in that shelf",
      "Busbar continuity for the affected bank",
      "Whether remaining 4+ shelves keep policy N+n",
    ],
    actions: [
      "Hot-swap failed 5500 W PSU if supported",
      "Replace PS33 shelf FRU if multi-PSU or midplane fault",
      "Do not oversubscribe the opposite bank during recovery",
      "Log Service Tags for ProSupport RMA",
    ],
    relatedKinds: ["power"],
    tags: ["PS33", "top bank", "bottom bank", "busbar"],
  },
  {
    id: "rack-power-budget",
    category: "Power",
    title: "IR9048 approaching power ceiling",
    severity: "minor",
    symptoms: [
      "Power capping under peak load",
      "One PS33 bank hotter / higher utilization than the other",
    ],
    checks: [
      "Per-shelf telemetry for bottom PS33-1–4 and top PS33-5–8",
      "Aggregate vs facility feed limits",
    ],
    actions: [
      "Stagger job ramp / power policies",
      "Confirm external CDU can accept full heat before raising caps",
    ],
    relatedKinds: ["power", "compute"],
    tags: ["budget", "PS33", "capping"],
  },
  {
    id: "nvlink-error",
    category: "Fabric",
    title: "NVLink fabric errors (NVS1–NVS9)",
    severity: "critical",
    symptoms: [
      "GPU P2P failures across CT trays",
      "NVSwitch CRC / replay counters climbing",
      "Collectives hang isolated to this SU",
    ],
    checks: [
      "All NVS1–NVS9 trays healthy",
      "Errors tracking one NVS vs one CT",
      "Tray seating in middle fabric bank",
    ],
    actions: [
      "Reseat/replace implicated NVS tray",
      "Replace CT sled if errors follow a GPU package",
      "Collect dumps before clearing sticky errors",
    ],
    relatedKinds: ["switch", "compute"],
    tags: ["NVLink", "NVS", "fabric", "CT"],
  },
  {
    id: "cx8-down",
    category: "Networking",
    title: "ConnectX-8 OSFP east/west link down",
    severity: "major",
    symptoms: [
      "Scale-out path degraded for one or more CT sleds",
      "NCCL network timeouts while NVLink domain is healthy",
    ],
    checks: [
      "OSFP / optics on the CT",
      "Leaf port FEC and flaps",
      "Whether BF3 is also down on that sled",
    ],
    actions: [
      "Reseat optics; replace cable/transceiver",
      "Firmware bounce; FRU replace if persistent",
    ],
    relatedKinds: ["compute"],
    tags: ["ConnectX-8", "OSFP", "east-west"],
  },
  {
    id: "bf3-dpu",
    category: "Networking",
    title: "BlueField-3 SuperNIC issues",
    severity: "major",
    symptoms: [
      "North/south blackhole for a CT",
      "DPU OS unreachable while GPUs remain up",
    ],
    checks: ["BF3 mode and BMC reachability", "Uplinks and secure boot events"],
    actions: [
      "Reboot DPU via iDRAC/OpenBMC if allowed",
      "Reflash BF3 from Dell-supported media",
      "Replace SuperNIC FRU or CT sled",
    ],
    relatedKinds: ["compute", "management"],
    tags: ["BlueField", "BF3", "SuperNIC"],
  },
  {
    id: "idrac-oob",
    category: "Management",
    title: "iDRAC / OpenBMC unreachable",
    severity: "major",
    symptoms: [
      "OME cannot inventory or power-control a CT",
      "OOB port up but BMC times out",
    ],
    checks: [
      "SN2201 OOB VLAN/port for the sled",
      "BMC RJ45 seating",
      "Credentials / certs",
    ],
    actions: [
      "Cycle BMC; re-cable OOB",
      "ProSupport with Service Tag if BMC silicon dead",
    ],
    relatedKinds: ["management", "compute"],
    tags: ["iDRAC", "OpenBMC", "OME", "OOB"],
  },
  {
    id: "tray-offline",
    category: "Compute",
    title: "CT sled offline or failed POST",
    severity: "major",
    symptoms: [
      "CT missing from fabric and OME",
      "Incomplete GPU enum (expect 4× B300)",
    ],
    checks: [
      "iDRAC SEL / health codes",
      "Power from nearest PS33 bank",
      "DLC present before cold boot",
    ],
    actions: [
      "Cold boot after leak-free confirm",
      "Reseat CT on rails/midplane",
      "RMA via ProSupport if package fails",
    ],
    relatedKinds: ["compute", "power"],
    tags: ["POST", "CT", "XE9712", "RMA"],
  },
  {
    id: "su-scaleout",
    category: "Cluster",
    title: "Multi-SU scale-out imbalance",
    severity: "info",
    symptoms: [
      "Jobs across multiple IR9048 racks slower than single-SU NVLink",
      "Shared external CDU plant constraining several SUs",
    ],
    checks: [
      "Each SU NVLink domain healthy first",
      "East/west fabric and shared CDU capacity",
    ],
    actions: [
      "Pin NVLink-heavy stages inside one SU",
      "Upsize inter-rack bandwidth or CDU plant",
    ],
    relatedKinds: ["switch", "compute", "cdu"],
    tags: ["SU", "scale-out", "CDU plant", "NCCL"],
  },
];

export const GUIDE_CATEGORIES = Array.from(
  new Set(TROUBLESHOOTING_GUIDE.map((g) => g.category)),
).sort();
