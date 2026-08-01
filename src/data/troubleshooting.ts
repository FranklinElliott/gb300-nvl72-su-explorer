export type Severity = "critical" | "major" | "minor" | "info";

export type Vendor = "dell" | "nvidia" | "both";

export type ComponentKindRef =
  | "compute"
  | "switch"
  | "power"
  | "manifold"
  | "management"
  | "cdu"
  | "cartridge"
  | "frame";

export type GuideSection = {
  id: string;
  category: string;
  title: string;
  severity: Severity;
  /** Primary documentation / field-practice lineage. */
  vendor: Vendor;
  summary: string;
  symptoms: string[];
  checks: string[];
  actions: string[];
  relatedKinds: ComponentKindRef[];
  tags: string[];
  /** Informal source pointers (not live hyperlinks to paywalled docs). */
  sources: string[];
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

export const VENDOR_META: Record<
  Vendor,
  { label: string; short: string; className: string }
> = {
  dell: {
    label: "Dell",
    short: "Dell",
    className: "bg-accent/15 text-accent border-accent/35",
  },
  nvidia: {
    label: "NVIDIA",
    short: "NVIDIA",
    className: "bg-ok/15 text-ok border-ok/35",
  },
  both: {
    label: "Dell + NVIDIA",
    short: "Both",
    className: "bg-switch/15 text-switch border-switch/35",
  },
};

/**
 * Operator procedures for Dell PowerEdge XE9712 / IR9048 SU (GB300 NVL72).
 * Educational composite of public architecture + field practice — always defer
 * to Dell ProSupport / NVIDIA enterprise support and site EOPs on live systems.
 */
export const TROUBLESHOOTING_GUIDE: GuideSection[] = [
  {
    id: "leak-detect",
    category: "Cooling",
    title: "DLC leak detection trip (rack manifolds)",
    severity: "critical",
    vendor: "dell",
    summary:
      "Latching leak events on IR9048 manifolds or CT/NVS cold-plate QDCs. Treat as electrical safety until dry.",
    symptoms: [
      "OpenManage Enterprise / iDRAC / rack controller asserts leak",
      "Facility BMS or external CDU interlock on secondary loop",
      "Visible moisture at QDCs, drip trays, or bulkhead fittings",
      "Policy-driven emergency power-off risk on some sites",
    ],
    checks: [
      "Is the hit on in-rack manifold sensors vs external CDU drip tray?",
      "Which CT/NVS tray QDCs show wetness (map CT1–18 / NVS1–9)?",
      "Secondary loop pressure and isolation valve positions to external CDU",
      "Whether power was still applied after the first leak event",
    ],
    actions: [
      "Follow site EOP first — isolate electrical if liquid near busbar/PS33",
      "Do not clear latching leak alarms until dry and revalidated",
      "Reseat QDCs; replace O-rings/hoses per Dell FRU procedure",
      "Engage Dell ProSupport Plus + facilities for external CDU hose work",
      "Log Service Tags, rack location, and photos before RMA",
    ],
    relatedKinds: ["manifold", "cdu", "compute", "switch"],
    tags: ["leak", "DLC", "QDC", "safety", "OpenManage", "iDRAC"],
    sources: [
      "Dell IR9048 / IRSS liquid cooling install & service notes",
      "Dell ProSupport Plus field procedures (leak / QDC)",
    ],
  },
  {
    id: "external-cdu",
    category: "Cooling",
    title: "External CDU fault (in-row / facility)",
    severity: "critical",
    vendor: "dell",
    summary:
      "Coolant Distribution Unit is outside the 48U stack. Multi-tray thermal rise usually points here, not a single sled.",
    symptoms: [
      "CDU low flow, high ΔP, pump failover, or filter clog alarms",
      "Many CT/NVS trays heat together",
      "BMS alarms on external CDU while IR9048 looks dry",
      "Peer SUs sharing the same plant also degrade",
    ],
    checks: [
      "Confirm CDU is external — do not open IR9048 looking for a CDU chassis",
      "N+1 pump status, strainer DP, primary facility water",
      "Hose isolation valves IR9048 bulkhead ↔ CDU",
      "Secondary inlet temp/flow vs Dell design envelope",
    ],
    actions: [
      "Fail over standby pump; service filters on the external CDU",
      "Lock out primary loops with facilities before hose work",
      "Reduce SU load until secondary flow is restored",
      "Coordinate Dell + mechanical contractor for capacity/RMA",
    ],
    relatedKinds: ["cdu", "manifold"],
    tags: ["CDU", "external", "pump", "facility", "flow", "ΔP"],
    sources: [
      "Dell Integrated Rack CDU interface / facility design guides",
      "Site mechanical EOP for secondary loop",
    ],
  },
  {
    id: "thermal-throttle",
    category: "Cooling",
    title: "GPU / NVSwitch thermal throttling",
    severity: "major",
    vendor: "both",
    summary:
      "B300 or NVSwitch clocks drop under load. Split Dell loop health from NVIDIA die telemetry.",
    symptoms: [
      "B300 clocks dropping; lower sustained FLOPS",
      "High die temp in iDRAC / NVIDIA HMC / DCGM",
      "One bank (CT1–8 vs CT9–18) hotter than the other",
      "NVSwitch trays warmer than adjacent CT trays",
    ],
    checks: [
      "External CDU inlet temp and flow (Dell)",
      "Upper vs lower manifold balance (Dell)",
      "Cold-plate seating on hottest CT/NVS (Dell FRU)",
      "NVIDIA thermal thresholds / throttle reasons in HMC/DCGM",
      "Firmware levels: BMC, HMC, GPU VBIOS (Dell bundle vs NVIDIA)",
    ],
    actions: [
      "Restore CDU flow / inlet within design before chasing single GPUs",
      "Reseat cold plates on hot trays per Dell",
      "Apply Dell-supported NVIDIA firmware if thermal fixes apply",
      "If one GPU stays hot after loop is healthy → package / cold-plate FRU",
    ],
    relatedKinds: ["compute", "switch", "manifold", "cdu"],
    tags: ["thermal", "throttle", "B300", "NVSwitch", "DCGM", "HMC", "iDRAC"],
    sources: [
      "NVIDIA DCGM / NVSM thermal fields",
      "Dell XE9712 thermal / DLC service",
    ],
  },
  {
    id: "cold-plate-flow",
    category: "Cooling",
    title: "Single-tray cold plate / QDC flow restriction",
    severity: "major",
    vendor: "dell",
    summary: "One CT or NVS runs hot while peers and external CDU look fine.",
    symptoms: [
      "Single CT or NVS thermal outlier",
      "Local leak sensor intermittent on one tray",
      "QDC hard to seat or incomplete latch",
    ],
    checks: [
      "Compare inlet/outlet ΔT on the outlier vs neighbors",
      "QDC orientation and full mate click",
      "Debris or kink in tray hoses",
    ],
    actions: [
      "Reseat QDCs with ESD and drip control",
      "Replace tray cold-plate / hose kit FRU",
      "Do not run sustained load until flow is confirmed",
    ],
    relatedKinds: ["compute", "switch", "manifold"],
    tags: ["cold plate", "QDC", "single tray", "ΔT"],
    sources: ["Dell CT/NVS DLC FRU procedures"],
  },
  {
    id: "ps33-bank",
    category: "Power",
    title: "PS33 shelf failure (top or bottom bank)",
    severity: "major",
    vendor: "dell",
    summary:
      "IR9048 uses 4× PS33 bottom (PS33-1–4) and 4× top (PS33-5–8). Localize bank before RMA.",
    symptoms: [
      "Amber/red LEDs on PS33-1–4 (bottom) or PS33-5–8 (top)",
      "Reduced power headroom; unexpected power caps",
      "AC phase / breaker events on one feed",
      "OME power inventory shows shelf offline",
    ],
    checks: [
      "Which bank: bottom (under CT1) vs top (above CT18)",
      "Which of 6× 5.5 kW PSUs inside the shelf",
      "ORv3 busbar alarms for that domain",
      "Remaining shelves still meet N+n policy",
    ],
    actions: [
      "Hot-swap failed 5500 W PSU if Dell procedure allows",
      "Replace entire PS33 shelf FRU on midplane/multi-PSU faults",
      "Do not oversubscribe the opposite bank during recovery",
      "Open ProSupport with Service Tag + shelf position",
    ],
    relatedKinds: ["power"],
    tags: ["PS33", "top bank", "bottom bank", "busbar", "ORv3", "hot-swap"],
    sources: ["Dell PS33 / IR9048 power shelf service"],
  },
  {
    id: "busbar-orv3",
    category: "Power",
    title: "ORv3 busbar / DC distribution fault",
    severity: "critical",
    vendor: "dell",
    summary: "Shared ~54 VDC path from PS33 banks to CT/NVS. Multiple trays lose power together.",
    symptoms: [
      "Several CT/NVS drop simultaneously in one power domain",
      "Busbar sensor / IRSS power path alarms",
      "PSUs report DC rail issues without single AC breaker trip",
    ],
    checks: [
      "Correlation with PS33 bank LEDs",
      "Physical inspection only under LOTO",
      "Whether top vs bottom domain is isolated",
    ],
    actions: [
      "De-energize per EOP before busbar inspection",
      "Dell field replaceable busbar / power path components only",
      "Do not probe live ORv3 rails with general meters without procedure",
    ],
    relatedKinds: ["power", "compute", "switch"],
    tags: ["ORv3", "busbar", "54V", "LOTO"],
    sources: ["Dell IR9048 ORv3 power architecture service"],
  },
  {
    id: "rack-power-budget",
    category: "Power",
    title: "IR9048 approaching power ceiling",
    severity: "minor",
    vendor: "dell",
    summary: "Policy caps or feed limits before hardware failure.",
    symptoms: [
      "Power capping under peak training load",
      "One PS33 bank higher utilization than the other",
      "OME power budget warnings",
    ],
    checks: [
      "Per-shelf Watts for PS33-1–4 and PS33-5–8",
      "Facility feed and PDU breaker ratings",
      "Whether external CDU heat rejection limits are the real ceiling",
    ],
    actions: [
      "Stagger job ramp; apply coordinated power policies",
      "Rebalance workloads across SUs",
      "Confirm CDU can accept full heat before raising caps",
    ],
    relatedKinds: ["power", "compute"],
    tags: ["budget", "capping", "OME", "facility"],
    sources: ["Dell OpenManage power monitoring", "Site power design"],
  },
  {
    id: "ac-feed-imbalance",
    category: "Power",
    title: "AC feed / phase imbalance into PS33",
    severity: "major",
    vendor: "dell",
    summary: "Upstream AC issues look like random PSU failures.",
    symptoms: [
      "Repeated PSU drop on same AC phase",
      "Breaker trips on one of redundant feeds",
      "Brownout events aligned with utility",
    ],
    checks: [
      "Input voltage/current per feed at PS33",
      "Redundant A/B feed wiring map",
      "Facility UPS / PDU logs",
    ],
    actions: [
      "Correct feed wiring with facilities electrician",
      "Replace only PSUs that failed after feed is stable",
      "Document phase map for the IR9048 position",
    ],
    relatedKinds: ["power"],
    tags: ["AC", "phase", "PDU", "UPS"],
    sources: ["Dell PS33 AC input requirements", "Site electrical drawings"],
  },
  {
    id: "nvlink-error",
    category: "Fabric",
    title: "NVLink fabric errors (NVS1–NVS9 domain)",
    severity: "critical",
    vendor: "both",
    summary:
      "Single-SU NVLink L1 domain is non-blocking across 72 GPUs. Errors may be NVS tray, CT package, or rear CC path.",
    symptoms: [
      "GPU P2P failures inside the SU",
      "NVSwitch CRC / replay counters climbing",
      "NCCL/MPI hangs that stay healthy when pinned to fewer GPUs",
      "nvidia-smi / NVSM reports link degraded",
    ],
    checks: [
      "NVIDIA: per-link state via NVSM / HMC / fabric manager logs",
      "Map errors to NVS tray vs CT vs rear cartridge (CC1–CC4)",
      "Dell: tray seating, latches, rear CC mate depth",
      "Firmware alignment: switch tray + GPU + HMC (Dell bundle preferred)",
    ],
    actions: [
      "Collect NVIDIA dumps before clearing sticky errors",
      "Reseat/replace implicated NVS tray (Dell FRU)",
      "If errors group by CC affinity → cartridge procedure",
      "If errors follow one GPU package → CT FRU / NVIDIA GPU RMA path via Dell",
    ],
    relatedKinds: ["switch", "compute", "cartridge"],
    tags: ["NVLink", "NVS", "CRC", "replay", "NCCL", "NVSM", "HMC"],
    sources: [
      "NVIDIA NVLink / NVSwitch troubleshooting",
      "Dell NVL72 switch tray service",
    ],
  },
  {
    id: "cartridge-bent-pins",
    category: "Fabric",
    title: "Rear cable cartridge bent / damaged pins (CC1–CC4)",
    severity: "critical",
    vendor: "dell",
    summary:
      "CT/NVS blind-mate into four rear NVLink cable cartridges. Bent pins after sled service are a top field failure.",
    symptoms: [
      "NVLink fails to train after CT/NVS insert/remove",
      "Visible bent, recessed, or contaminated pins on CC face",
      "One cartridge path down; peers healthy",
      "Hard stop / crunch before full mate",
    ],
    checks: [
      "Power down and isolate before inspecting pin field",
      "Light + magnification only — no metal tools on pins",
      "Affinity: CC1≈CT1–5, CC2≈CT6–9, CC3≈CT10–14, CC4≈CT15–18",
      "Guide pins, debris, cage latch, and node-side connector",
    ],
    actions: [
      "Stop if resistance is abnormal — never force home",
      "FRU-replace cable cartridge per Dell (preferred over field pin-straighten)",
      "Replace node connector if damage is on CT/NVS side",
      "Reseat, verify all links, clear sticky errors, re-run fabric test",
      "ProSupport: Service Tag + CC# + pin-field photos",
    ],
    relatedKinds: ["cartridge", "compute", "switch"],
    tags: ["bent pins", "CC1", "CC2", "CC3", "CC4", "mate", "FRU"],
    sources: ["Dell rear cable cartridge service / pin inspection"],
  },
  {
    id: "cartridge-ber",
    category: "Fabric",
    title: "Elevated BER / CRC on cable cartridge path",
    severity: "major",
    vendor: "both",
    summary:
      "Marginal mates often pass idle and fail under load. Use NVIDIA counters + Dell physical reseat path.",
    symptoms: [
      "Rising NVLink CRC, replay, or BER on a CT subset",
      "Intermittent collective hangs under traffic",
      "Errors cluster by CC affinity",
      "More retrains after thermal or vibration events",
    ],
    checks: [
      "NVIDIA: dump per-link BER/CRC/replay; group by CC",
      "Idle vs loaded BER (marginal mates fail under traffic)",
      "Dell: reseat CT trays on that CC; check latch depth",
      "Rule out single ASIC (errors stick to one chip, not a CC group)",
    ],
    actions: [
      "Reseat CT + rear cartridge (Dell physical)",
      "Clean per Dell ESD procedure — no abrasives on pin fields",
      "Replace cartridge if BER stays high after reseat",
      "If BER follows node after cartridge swap → CT/NVS FRU",
      "Keep SU out of production jobs until baseline BER restored",
    ],
    relatedKinds: ["cartridge", "compute", "switch"],
    tags: ["BER", "CRC", "signal integrity", "NVLink", "load test"],
    sources: [
      "NVIDIA link error / BER counter guidance",
      "Dell cable cartridge reseat / replace",
    ],
  },
  {
    id: "nvswitch-asic",
    category: "Fabric",
    title: "Single NVSwitch ASIC / tray fault",
    severity: "major",
    vendor: "nvidia",
    summary: "Errors sticky to one NVS tray after Dell mate path looks clean.",
    symptoms: [
      "One of NVS1–NVS9 consistently in error",
      "Links from many CTs into one tray fail",
      "NVSM marks specific NVSwitch degraded",
    ],
    checks: [
      "Swap tray position only if Dell procedure allows diagnosis",
      "Firmware/HMC logs for that switch ASIC",
      "Power/thermal on that tray alone",
    ],
    actions: [
      "Replace NVS tray FRU via Dell",
      "Reflash only with Dell-supported NVIDIA image set",
      "Re-validate full mesh after replacement",
    ],
    relatedKinds: ["switch"],
    tags: ["NVSwitch", "ASIC", "NVSM", "tray FRU"],
    sources: ["NVIDIA NVSwitch diagnostics", "Dell NVS tray RMA"],
  },
  {
    id: "gpu-package",
    category: "Fabric",
    title: "Single B300 GPU package isolation",
    severity: "major",
    vendor: "nvidia",
    summary: "One of four GPUs on a CT fails training or runs ECC/XID storms.",
    symptoms: [
      "Incomplete GPU enum (expect 4× B300 on CT)",
      "XID errors sticky to one GPU UUID",
      "NVLink links only fail on that package",
    ],
    checks: [
      "nvidia-smi / NVSM inventory vs expected 4 GPUs",
      "Whether reseat CT changes the fault",
      "Power/thermal on that package only",
    ],
    actions: [
      "Collect NVIDIA bug report / XID logs",
      "Reseat CT once; if persistent → Dell CT FRU (GPU package not field-reworked)",
      "Do not mix random VBIOS outside Dell certified set",
    ],
    relatedKinds: ["compute"],
    tags: ["B300", "XID", "GPU", "UUID", "enum"],
    sources: ["NVIDIA XID reference", "Dell XE9712 CT replacement"],
  },
  {
    id: "cx8-down",
    category: "Networking",
    title: "ConnectX-8 OSFP east/west link down",
    severity: "major",
    vendor: "both",
    summary: "Scale-out path for multi-SU jobs while in-rack NVLink may still be healthy.",
    symptoms: [
      "Leaf flaps or down ports on CT east/west",
      "NCCL network timeouts with healthy NVLink domain",
      "ibdev2netdev / mlx link state down",
    ],
    checks: [
      "OSFP / optics seating and Tx power",
      "Leaf FEC, speed, and flap counters",
      "Whether BF3 north/south is also affected",
      "Dell iDRAC NIC health vs NVIDIA firmware on CX-8",
    ],
    actions: [
      "Reseat optics; swap known-good cable/transceiver",
      "Bounce port; update to Dell-supported CX-8 firmware",
      "FRU replace SuperNIC / CT if PHYs stay down",
    ],
    relatedKinds: ["compute"],
    tags: ["ConnectX-8", "OSFP", "east-west", "InfiniBand", "Ethernet", "NCCL"],
    sources: ["NVIDIA ConnectX / MLNX_OFED link troubleshooting", "Dell NIC FRU"],
  },
  {
    id: "bf3-dpu",
    category: "Networking",
    title: "BlueField-3 SuperNIC / DPU issues",
    severity: "major",
    vendor: "both",
    summary: "North/south DPU path can blackhole a CT while GPUs stay up.",
    symptoms: [
      "BF3 OS unreachable; host NICs missing",
      "Secure boot / ATF failures on DPU",
      "Storage or control plane via BF3 offline",
    ],
    checks: [
      "iDRAC / BMC path to DPU",
      "BF3 mode (DPU vs NIC) expected by site image",
      "Uplink optics and leaf config",
      "NVIDIA BF3 boot logs vs Dell support matrix",
    ],
    actions: [
      "Reboot DPU via iDRAC/OpenBMC if policy allows",
      "Reflash BF3 only from Dell-supported media",
      "Replace SuperNIC FRU or entire CT",
    ],
    relatedKinds: ["compute", "management"],
    tags: ["BlueField-3", "BF3", "DPU", "SuperNIC", "secure boot"],
    sources: ["NVIDIA BlueField software troubleshooting", "Dell BF3 image bundle"],
  },
  {
    id: "nccl-perf",
    category: "Networking",
    title: "NCCL performance / topology misconfig",
    severity: "minor",
    vendor: "nvidia",
    summary: "Jobs slow without hard link-down alarms — often topo or mixed fabric.",
    symptoms: [
      "AllReduce slower than baseline on same SU",
      "NCCL_DEBUG shows unexpected NET vs NVLS paths",
      "Multi-SU jobs much worse than single-SU",
    ],
    checks: [
      "NCCL_TOPO / NVLink domain visibility",
      "Whether jobs cross east/west unintentionally",
      "PCIe / BF3 / CX-8 binding",
    ],
    actions: [
      "Pin NVLink-heavy stages inside one SU",
      "Fix NCCL env for multi-rail / IB or RoCE design",
      "Validate with nccl-tests before production",
    ],
    relatedKinds: ["compute", "switch"],
    tags: ["NCCL", "topology", "AllReduce", "performance"],
    sources: ["NVIDIA NCCL troubleshooting / performance"],
  },
  {
    id: "idrac-oob",
    category: "Management",
    title: "iDRAC / OpenBMC unreachable",
    severity: "major",
    vendor: "dell",
    summary: "Out-of-band plane via PowerSwitch SN2201-class OOB and BMC RJ45.",
    symptoms: [
      "OME cannot inventory or power-control a CT",
      "OOB switch port up; BMC times out",
      "Redfish/iDRAC web UI unreachable",
    ],
    checks: [
      "SN2201 VLAN/port membership for the sled",
      "BMC RJ45 seating and link lights",
      "Credentials, certs, IP conflicts",
      "Whether host OS is up (in-band vs OOB split)",
    ],
    actions: [
      "Cycle BMC from chassis controls if available",
      "Re-cable OOB; fix VLAN",
      "ProSupport if BMC silicon dead (Service Tag)",
    ],
    relatedKinds: ["management", "compute"],
    tags: ["iDRAC", "OpenBMC", "Redfish", "OOB", "SN2201"],
    sources: ["Dell iDRAC / OpenBMC user guide", "OME connectivity"],
  },
  {
    id: "ome-inventory",
    category: "Management",
    title: "OpenManage Enterprise inventory drift",
    severity: "minor",
    vendor: "dell",
    summary: "Fleet inventory stale after FRU swaps or network partitions.",
    symptoms: [
      "OME shows offline CT that is actually healthy",
      "Wrong Service Tag / model after sled swap",
      "Firmware compliance jobs fail",
    ],
    actions: [
      "Rediscover device; refresh inventory",
      "Re-apply Dell firmware baseline catalog",
      "Fix DNS/certs for Redfish",
    ],
    checks: [
      "Discovery range and credentials",
      "Whether BMC was reset to factory",
      "Duplicate IPs after clone images",
    ],
    relatedKinds: ["management", "compute"],
    tags: ["OME", "inventory", "firmware catalog", "Redfish"],
    sources: ["Dell OpenManage Enterprise admin guide"],
  },
  {
    id: "hmc-firmware",
    category: "Management",
    title: "NVIDIA HMC / host management path issues",
    severity: "major",
    vendor: "both",
    summary: "HMC is the NVIDIA management path; Dell BMC still fronts OOB.",
    symptoms: [
      "HMC unreachable from control plane",
      "GPU/switch telemetry missing while BMC is up",
      "Firmware update jobs stuck mid-bundle",
    ],
    checks: [
      "BMC ↔ HMC link health (Dell + NVIDIA)",
      "Credentials and certificate trust",
      "Whether partial firmware left mixed versions",
    ],
    actions: [
      "Complete Dell-published bundle update (do not mix random NVIDIA builds)",
      "Reset HMC via documented path after dump collection",
      "Escalate joint Dell/NVIDIA if HMC brick suspected",
    ],
    relatedKinds: ["management", "compute", "switch"],
    tags: ["HMC", "firmware", "bundle", "telemetry"],
    sources: ["NVIDIA HMC documentation", "Dell firmware bundle release notes"],
  },
  {
    id: "firmware-mismatch",
    category: "Management",
    title: "Firmware skew across CT / NVS / CX-8 / BF3",
    severity: "major",
    vendor: "both",
    summary: "Mixed levels cause fabric flaps, thermal quirks, or missing devices.",
    symptoms: [
      "New sleds behave differently from fleet baseline",
      "NVLink or NIC features missing after FRU",
      "OME compliance red on subset of trays",
    ],
    checks: [
      "Export inventory: BMC, HMC, GPU, NVSwitch, CX-8, BF3",
      "Compare to Dell support matrix for GB300 NVL72",
    ],
    actions: [
      "Apply Dell certified firmware catalog as a set",
      "Avoid unilateral nvidia-fw updates outside bundle",
      "Reboot policy per Dell release notes",
    ],
    relatedKinds: ["management", "compute", "switch"],
    tags: ["firmware", "compliance", "support matrix", "bundle"],
    sources: ["Dell support matrix / DUP catalog", "NVIDIA enterprise driver notes"],
  },
  {
    id: "tray-offline",
    category: "Compute",
    title: "CT sled offline or failed POST",
    severity: "major",
    vendor: "dell",
    summary: "PowerEdge XE9712 CT missing from fabric and OME after insert or crash.",
    symptoms: [
      "CT not in OME / fabric inventory",
      "Incomplete POST; no host OS",
      "GPU enum incomplete (expect 4× B300)",
    ],
    checks: [
      "iDRAC SEL / health codes",
      "Power from nearest PS33 bank",
      "DLC present and leak-free before cold boot",
      "Rear CC mate for that CT’s cartridge",
    ],
    actions: [
      "Cold boot only after leak-free confirm",
      "Reseat CT on rails/midplane and rear mate",
      "RMA via ProSupport if package fails diagnostics",
    ],
    relatedKinds: ["compute", "power", "cartridge"],
    tags: ["POST", "CT", "XE9712", "SEL", "RMA"],
    sources: ["Dell XE9712 installation & troubleshooting"],
  },
  {
    id: "grace-cpu",
    category: "Compute",
    title: "Grace CPU / C2C coherency issues",
    severity: "major",
    vendor: "nvidia",
    summary: "Grace–Blackwell C2C path problems can look like GPU or memory faults.",
    symptoms: [
      "CPU-side machine checks with GPUs idle",
      "Coherent memory errors under multi-process load",
      "Partial Grace visibility in inventory",
    ],
    checks: [
      "HMC/OS logs for C2C / memory errors",
      "Whether fault follows CT after reseat",
      "Firmware levels for Grace + GPU package",
    ],
    actions: [
      "Collect NVIDIA dumps; do not continue unstable workloads",
      "CT FRU via Dell if package-level fault",
      "Apply coordinated firmware bundle",
    ],
    relatedKinds: ["compute"],
    tags: ["Grace", "C2C", "coherency", "memory"],
    sources: ["NVIDIA Grace/Blackwell architecture notes", "Dell CT RMA"],
  },
  {
    id: "boot-storage",
    category: "Compute",
    title: "Boot media / E1.S NVMe faults on CT",
    severity: "minor",
    vendor: "dell",
    summary: "M.2 boot or E1.S data devices fail while GPUs may still enumerate.",
    symptoms: [
      "Host fails to find boot device",
      "NVMe path errors in OS",
      "OME storage health amber",
    ],
    checks: [
      "Which bay (boot M.2 vs E1.S data)",
      "Cables/backplane seating after sled service",
      "SMART / controller logs",
    ],
    actions: [
      "Reseat devices; replace media FRU",
      "Reimage boot volume from site golden image",
      "Keep GPU workloads drained during storage FRU",
    ],
    relatedKinds: ["compute"],
    tags: ["NVMe", "E1.S", "M.2", "boot"],
    sources: ["Dell XE9712 storage service"],
  },
  {
    id: "su-scaleout",
    category: "Cluster",
    title: "Multi-SU scale-out imbalance",
    severity: "info",
    vendor: "both",
    summary: "NVLink is single-rack L1; multi-rack depends on CX-8 fabric and shared CDU plant.",
    symptoms: [
      "Jobs across IR9048 racks slower than single-SU",
      "Shared external CDU constrains several SUs",
      "One SU’s east/west is the bottleneck",
    ],
    checks: [
      "Per-SU NVLink domain first (NVIDIA fabric health)",
      "East/west leaf utilization",
      "Shared CDU capacity vs concurrent load",
    ],
    actions: [
      "Pin NVLink-heavy stages inside one SU",
      "Upsize inter-rack bandwidth or CDU plant",
      "Schedule multi-SU jobs with thermal headroom",
    ],
    relatedKinds: ["switch", "compute", "cdu"],
    tags: ["SU", "scale-out", "NCCL", "CDU plant"],
    sources: ["NVIDIA multi-node scaling guidance", "Dell multi-rack IRSS design"],
  },
  {
    id: "xid-crash",
    category: "Cluster",
    title: "XID / GPU crash dump storm",
    severity: "critical",
    vendor: "nvidia",
    summary: "Repeated XIDs can take jobs down fleet-wide if not quarantined.",
    symptoms: [
      "XID 48/79/94/etc. floods in syslog",
      "Processes killed; CUDA context failures",
      "One CT generates most events",
    ],
    checks: [
      "Map XID codes to NVIDIA reference",
      "Correlate with NVLink/BER/thermal at same timestamps",
      "Whether dump collection filled disks",
    ],
    actions: [
      "Quarantine CT from scheduler",
      "Collect nvidia-bug-report; preserve dumps",
      "Follow XID-specific recovery; FRU if hardware-class XID",
    ],
    relatedKinds: ["compute", "switch"],
    tags: ["XID", "crash dump", "CUDA", "quarantine"],
    sources: ["NVIDIA XID errors reference"],
  },
  {
    id: "driver-cuda",
    category: "Cluster",
    title: "Driver / CUDA / container mismatch",
    severity: "minor",
    vendor: "nvidia",
    summary: "User software stack out of sync with host driver on GB300.",
    symptoms: [
      "CUDA_ERROR_INVALID_DEVICE / insufficient driver",
      "Containers fail GPU discovery",
      "Works on one SU image, fails on another",
    ],
    checks: [
      "Host driver vs container CUDA requirement",
      "Device plugin / CDI config",
      "Whether Dell image locked driver version",
    ],
    actions: [
      "Align container CUDA to host driver matrix",
      "Rebuild nodes to fleet baseline image",
      "Do not force newer driver outside Dell support window without approval",
    ],
    relatedKinds: ["compute"],
    tags: ["driver", "CUDA", "container", "CDI"],
    sources: ["NVIDIA driver/CUDA compatibility", "Site container platform docs"],
  },
  {
    id: "first-power-on",
    category: "Cluster",
    title: "First power-on / bring-up checklist (SU)",
    severity: "info",
    vendor: "both",
    summary: "Order of operations so cooling and power precede fabric validation.",
    symptoms: [
      "New IR9048 not yet in production",
      "Partial inventory after uncrate",
    ],
    checks: [
      "External CDU online and secondary flow proven (Dell)",
      "PS33 both banks green; no leak sensors (Dell)",
      "All CT1–18 and NVS1–9 present (Dell OME + NVIDIA inventory)",
      "CC1–4 latched; no pin damage (Dell)",
      "NVLink domain trains clean; CX-8/BF3 up (NVIDIA + Dell)",
    ],
    actions: [
      "Do not apply full AI load until leak-free soak completes",
      "Apply Dell firmware baseline before production jobs",
      "Run NVIDIA fabric + NCCL smoke tests; archive results",
      "Hand off with Service Tags and as-built elevation",
    ],
    relatedKinds: ["power", "cdu", "compute", "switch", "cartridge", "management"],
    tags: ["bring-up", "checklist", "soak", "smoke test"],
    sources: [
      "Dell IRSS install guide",
      "NVIDIA NVL72 bring-up / fabric validation",
    ],
  },
];

export const GUIDE_CATEGORIES = Array.from(
  new Set(TROUBLESHOOTING_GUIDE.map((g) => g.category)),
).sort();

/** Match whole tokens so short queries like "ber" do not hit "number". */
function haystackMatch(hay: string, token: string): boolean {
  if (token.length <= 2) {
    return new RegExp(`(?:^|[^a-z0-9])${escapeReg(token)}(?:$|[^a-z0-9])`, "i").test(
      hay,
    );
  }
  if (token.length <= 4) {
    return new RegExp(`(?:^|[^a-z0-9])${escapeReg(token)}`, "i").test(hay);
  }
  return hay.includes(token);
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function searchGuide(
  query: string,
  opts: {
    category?: string;
    severity?: Severity | "all";
    vendor?: Vendor | "all";
    filterKind?: ComponentKindRef | null;
  } = {},
): GuideSection[] {
  const q = query.trim().toLowerCase();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  return TROUBLESHOOTING_GUIDE.filter((g) => {
    if (opts.category && opts.category !== "all" && g.category !== opts.category) {
      return false;
    }
    if (opts.severity && opts.severity !== "all" && g.severity !== opts.severity) {
      return false;
    }
    if (opts.vendor && opts.vendor !== "all") {
      if (opts.vendor === "both") {
        if (g.vendor !== "both") return false;
      } else if (g.vendor !== opts.vendor && g.vendor !== "both") {
        return false;
      }
    }
    if (opts.filterKind && !g.relatedKinds.includes(opts.filterKind)) {
      return false;
    }
    if (tokens.length === 0) return true;
    const hay = [
      g.id,
      g.title,
      g.summary,
      g.category,
      g.vendor,
      ...g.symptoms,
      ...g.checks,
      ...g.actions,
      ...g.tags,
      ...g.sources,
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((t) => haystackMatch(hay, t));
  }).sort((a, b) => {
    const sev = SEVERITY_META[a.severity].order - SEVERITY_META[b.severity].order;
    if (sev !== 0) return sev;
    return a.title.localeCompare(b.title);
  });
}
