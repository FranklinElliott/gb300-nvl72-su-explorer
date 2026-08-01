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
    id: "roce-isolation",
    category: "Networking",
    title: "RoCE down / BER / flaps — isolate NIC vs AEC vs SN5610 SWP",
    severity: "critical",
    vendor: "both",
    summary:
      "XE9712 east/west RoCE ports land on Dell PowerSwitch SN5610 leafs over AEC (or optics). When a link is down, has high BER, or flaps, decide which FRU: ConnectX-8 RoCE NIC, the AEC, or the SN5610 switch port (SWP) — before mass reseats.",
    symptoms: [
      "RoCE / mlx link state Down or Polling on one or more CX-8 ports",
      "SN5610 SWP shows down, err-disabled, or continuous flaps",
      "Rising symbol_err / symbol_ber / symbol_flaps / CRC / FEC corrected+uncorrected",
      "NCCL / RDMA jobs hang or timeout while in-rack NVLink domain is healthy",
      "One CT rail fails; peer rails on same SN5610 look fine (or the reverse)",
    ],
    checks: [
      "Identity the path: CT# · CX-8 port (mlx5_n) · AEC serial/length · SN5610 hostname · SWP name (e.g. swp17)",
      "Collect BOTH ends at the same timestamp: host (ethtool -S / mlxlink) AND switch (show interface counters / fec / transceiver)",
      "Is the fault sticky to the host port when you move the AEC to a known-good SWP?",
      "Is the fault sticky to the SWP when you move a known-good AEC+NIC path onto that SWP?",
      "Is the fault sticky to the AEC when NIC and SWP were both known-good?",
      "Speed/FEC match both ends (e.g. 400G/800G + RS-FEC) — mismatch looks like perpetual flaps",
      "RoCE lossless config present on SN5610 and host (PFC priorities, ECN, MTU 4k/9k as designed)",
    ],
    actions: [
      "Use the cross-swap matrix (below procedures) — change ONE variable at a time",
      "If follows NIC/CX-8 port → reseat OSFP cage, update Dell CX-8 firmware, then CT/NIC FRU",
      "If follows AEC → replace AEC (do not reuse suspect high-BER cables in production)",
      "If follows SN5610 SWP → try different breakout/lane group if applicable; else move to spare SWP / RMA line card or switch per Dell",
      "Clear sticky error-disable only after root FRU is replaced; archive counters before clear",
      "Re-run link soak + RDMA/NCCL smoke before returning the rail to the scheduler",
    ],
    relatedKinds: ["compute"],
    tags: [
      "RoCE",
      "SN5610",
      "SWP",
      "AEC",
      "ConnectX-8",
      "BER",
      "flaps",
      "down",
      "isolation",
      "east-west",
    ],
    sources: [
      "Dell PowerSwitch SN5610 / Enterprise SONiC interface & FEC troubleshooting",
      "NVIDIA ConnectX / mlxlink BER and phy state",
      "Dell XE9712 east-west cabling matrix (CT ↔ SN5610)",
    ],
  },
  {
    id: "roce-down-link",
    category: "Networking",
    title: "RoCE link down (no light / no train) on SN5610 path",
    severity: "major",
    vendor: "both",
    summary:
      "Hard down is usually seating, wrong SWP mapping, dead AEC, or admin-down/error-disable — not RoCE congestion.",
    symptoms: [
      "Host: port state Down; no carrier",
      "SN5610: SWP is admin down, notconnect, or err-disabled",
      "No neighbor LLDP/CDP where expected",
      "AEC LEDs dark or solid fault color per vendor",
    ],
    checks: [
      "Confirm planned cabling: this CT OSFP → this SN5610 SWP (as-built vs reality)",
      "Both ends not shutdown; correct breakout profile on SN5610",
      "OSFP / AEC fully latched in CX-8 cage and in SN5610 port",
      "Transceiver/AEC EEPROM readable on switch (`show interface transceiver` class commands)",
      "iDRAC/OME NIC presence; CX-8 powered (not just BF3 path)",
      "Same fault on a known-good spare SWP with same AEC?",
    ],
    actions: [
      "no shutdown / clear error-disable after verifying cause",
      "Reseat AEC both ends; try known-good short AEC on same SWP",
      "If known-good AEC works on SWP but production AEC fails → replace AEC",
      "If no AEC trains on that SWP → move service to spare SWP; open Dell switch case",
      "If every SWP fails on that CX-8 port with known-good AECs → CX-8/CT FRU path",
    ],
    relatedKinds: ["compute"],
    tags: ["RoCE", "link down", "SN5610", "SWP", "AEC", "OSFP", "err-disabled"],
    sources: [
      "Dell SN5610 port status / errdisable recovery",
      "NVIDIA ConnectX port state troubleshooting",
    ],
  },
  {
    id: "roce-high-ber",
    category: "Networking",
    title: "High BER / FEC stress on RoCE (NIC · AEC · SWP)",
    severity: "major",
    vendor: "both",
    summary:
      "High BER often passes a casual ‘link up’ check and kills RDMA under load. Separate medium (AEC) from endpoints.",
    symptoms: [
      "Link stays Up but symbol_ber, CRC, symbol_err, or FEC uncorrectable climb",
      "Jobs slow or retry; GPU-direct RDMA errors under traffic",
      "Counters rise only when that rail carries NCCL/Alltoall",
      "mlxlink shows marginal eye / high physical errors",
    ],
    checks: [
      "Baseline idle 5–10 min counters on host AND SN5610 SWP — then under load",
      "Compare adjacent SWPs on same SN5610 ASIC/pipeline for shared fault",
      "AEC bend radius, cable management crush, and length vs supported reach",
      "FEC mode identical both ends; no half-reconfigured breakout",
      "Temperature: CX-8 cage, AEC, and SN5610 port zone (thermal raises BER)",
      "Cross-swap: (1) AEC to known-good SWP (2) known-good AEC on suspect SWP (3) suspect NIC to known-good AEC+SWP",
    ],
    actions: [
      "If BER follows AEC → scrap/replace that AEC; do not ‘clean and hope’ on high-speed AEC beyond procedure",
      "If BER follows SWP with multiple AECs → Dell SN5610 port / PHY / line-card path",
      "If BER follows CX-8 port across SWPs/AECs → reseat, firmware, then NIC/CT FRU",
      "After replace: clear counters; soak under synthetic RDMA + production-like NCCL",
      "Leave rail drained until BER returns to fleet baseline",
    ],
    relatedKinds: ["compute"],
    tags: ["RoCE", "BER", "FEC", "CRC", "AEC", "SN5610", "SWP", "ConnectX-8", "mlxlink"],
    sources: [
      "NVIDIA mlxlink / physical layer diagnostics",
      "Dell SN5610 FEC and error counters",
      "AEC vendor reach & handling notes",
    ],
  },
  {
    id: "roce-link-flaps",
    category: "Networking",
    title: "RoCE link flaps on SN5610 leaf",
    severity: "major",
    vendor: "both",
    summary:
      "Flaps are often speed/FEC mismatch, bad AEC, oversubscribed SWP config, or NIC power/firmware — not application RoCE tuning.",
    symptoms: [
      "Interface up/down events every seconds–minutes",
      "SN5610 logs link flap / transceiver removed storms",
      "Host dmesg mlx5 link down/up",
      "Scheduler sees intermittent rail loss mid-job",
    ],
    checks: [
      "Match advertised speed & FEC on CX-8 and SN5610 SWP",
      "Whether flaps correlate with thermal events or cable pulls in cold aisle",
      "Dampening / flapping detection thresholds hiding a hard fault",
      "One SWP flapping with many AECs (switch) vs one AEC flapping on many SWPs (cable)",
      "NIC firmware and SN5610 NOS version on Dell support matrix",
    ],
    actions: [
      "Hard-set speed/FEC both ends to the designed profile (avoid bad autoneg pairs)",
      "Replace AEC if it flaps across multiple known-good SWPs",
      "Migrate off bad SWP; RMA switch components if port stays flappy with good AECs",
      "Update CX-8 + SN5610 in the Dell-certified set if known flap fixes exist",
      "Enable only intentional dampening after hardware is stable — not as a permanent mask",
    ],
    relatedKinds: ["compute"],
    tags: ["RoCE", "flaps", "link flap", "SN5610", "SWP", "AEC", "FEC", "autoneg"],
    sources: [
      "Dell SN5610 link-flap / interface logs",
      "NVIDIA driver link event troubleshooting",
    ],
  },
  {
    id: "roce-aec",
    category: "Networking",
    title: "AEC cable faults (RoCE CT ↔ SN5610)",
    severity: "major",
    vendor: "dell",
    summary:
      "Active Electrical Cables are field-high failure for BER and intermittent downs — treat as first swap candidate after seating checks.",
    symptoms: [
      "Fault follows the cable in cross-swap",
      "AEC warm/hot relative to peers; or one end not latched",
      "Works in lab short path, fails in routed tray length",
      "Visible jacket crush, tight bend, or pulled strain relief",
    ],
    checks: [
      "Part number / length supported for the SN5610 + CX-8 rate",
      "Both latches fully engaged; no partial OSFP seat",
      "EEPROM / vendor identify readable on SN5610",
      "Does a known-golden AEC clear BER/flaps on same SWP+NIC?",
    ],
    actions: [
      "Replace AEC; label and quarantine bad cable (don’t return to pool)",
      "Rework cable management if bend radius or crush caused it",
      "Update as-built if length class was wrong for the run",
      "Only after good AEC still fails → escalate to SWP or NIC procedures",
    ],
    relatedKinds: ["compute"],
    tags: ["AEC", "DAC", "cable", "OSFP", "RoCE", "SN5610", "BER"],
    sources: [
      "Dell validated AEC/optics list for SN5610 + XE9712",
      "Cable plant handling standards",
    ],
  },
  {
    id: "roce-sn5610-swp",
    category: "Networking",
    title: "SN5610 SWP / leaf port faults",
    severity: "major",
    vendor: "dell",
    summary:
      "When multiple AECs and multiple CX-8 ports fail only on one SWP (or SWP group), blame the switch side.",
    symptoms: [
      "Known-good AEC + known-good NIC still BER/down on one SWP",
      "Cluster of bad SWPs on same pipeline/ASIC/half of the switch",
      "Transceiver not detected only on that cage",
      "SN5610 logs PHY / MAC / buffer errors local to the port",
    ],
    checks: [
      "Move known-good AEC+NIC path onto suspect SWP — fault stays?",
      "Sibling SWPs on same breakout group or tile",
      "NOS bugs: counters freezing, FEC not applied after config",
      "Power/thermal alarms on that SN5610",
      "Whether only one leaf of a dual-homed CT pair is bad",
    ],
    actions: [
      "Migrate CT rail to spare SWP; update IP/BGP/rail map if required",
      "Bounce only the suspect SWP after config dump",
      "RMA / replace SN5610 or field-replaceable optics cage per Dell procedure",
      "Do not keep re-terminating AECs into a known-bad SWP",
    ],
    relatedKinds: ["compute"],
    tags: ["SN5610", "SWP", "leaf", "PowerSwitch", "SONiC", "PHY", "RMA"],
    sources: [
      "Dell PowerSwitch SN5610 hardware / SONiC troubleshooting",
      "Dell ProSupport switch RMA data collection",
    ],
  },
  {
    id: "roce-nic-cx8",
    category: "Networking",
    title: "ConnectX-8 RoCE NIC faults (host side)",
    severity: "major",
    vendor: "both",
    summary:
      "If the failure follows the CT OSFP/CX-8 port across known-good AECs and known-good SN5610 SWPs, replace or reflash the NIC path.",
    symptoms: [
      "All SWPs fail against one CX-8 port with golden AECs",
      "mlx5 device missing, AER/PCIe errors, or persistent phys down",
      "Only one of multi-rail CX-8 ports on the CT is bad",
      "Firmware mismatch vs other CTs on the same image",
    ],
    checks: [
      "lspci / mst / mlxconfig inventory; Dell iDRAC NIC health",
      "PCIe link width/speed to the CX-8",
      "Dell-supported firmware vs fleet baseline",
      "Whether reseat of CT changes the fault (midplane) vs stays on OSFP cage",
    ],
    actions: [
      "Reseat OSFP/AEC; clean cage per procedure",
      "Apply Dell CX-8 firmware bundle; reboot policy per notes",
      "If still bad → SuperNIC FRU or CT sled RMA via ProSupport",
      "Keep NVIDIA debug dumps with the Dell Service Tag",
    ],
    relatedKinds: ["compute"],
    tags: ["ConnectX-8", "CX-8", "RoCE", "NIC", "mlx5", "PCIe", "firmware"],
    sources: [
      "NVIDIA ConnectX firmware / mlx tools",
      "Dell XE9712 NIC FRU procedures",
    ],
  },
  {
    id: "roce-lossless",
    category: "Networking",
    title: "RoCE lossless misconfig (PFC / ECN / DCQCN) on SN5610",
    severity: "major",
    vendor: "both",
    summary:
      "Link can be up with low BER yet RDMA melts under load if PFC/ECN/queue config is wrong on leaf or host.",
    symptoms: [
      "Pause storms or zero-throughput under traffic",
      "ECN-marked high but app still stalls",
      "Works on a lab leaf with known-good QoS, fails on production SN5610 policy",
      "Only multi-rail jobs fail; single-rail pings fine",
    ],
    checks: [
      "SN5610: PFC enabled on correct priorities; no mismatched trust dscp/cos",
      "Host: RoCE tos/priority matches leaf; MTU end-to-end",
      "Buffer / headroom for the lossless PG on SN5610",
      "DCQCN / CC algorithm consistent with site standard",
      "Not confusing this with physical BER (check FEC uncorrectable first)",
    ],
    actions: [
      "Restore SN5610 QoS template from known-good leaf",
      "Align host netplan/nm + mlnx_qos to the fabric standard",
      "Validate with perftest/ib_write_bw then NCCL",
      "Change control: don’t tune PFC live on a shared leaf without drain",
    ],
    relatedKinds: ["compute"],
    tags: ["RoCE", "PFC", "ECN", "DCQCN", "lossless", "QoS", "SN5610", "MTU"],
    sources: [
      "Dell SN5610 RoCE / QoS deployment guides",
      "NVIDIA RoCE lossless configuration",
    ],
  },
  {
    id: "roce-cross-swap",
    category: "Networking",
    title: "Field cross-swap matrix (NIC · AEC · SWP)",
    severity: "info",
    vendor: "both",
    summary:
      "One-variable swaps to label the bad layer in minutes. Record results before FRU.",
    symptoms: [
      "Team disagrees whether to RMA cable, NIC, or switch",
      "Multiple bad rails; need a repeatable method",
    ],
    checks: [
      "Step A: reseat only — if fixed, document seating; soak",
      "Step B: move AEC to known-good SWP (same NIC) — if fault moves with AEC → AEC; if stays on old SWP when retested → SWP; if stays on NIC with good AEC+SWP → NIC",
      "Step C: known-good AEC on suspect SWP with known-good NIC — confirms SWP",
      "Step D: suspect NIC + good AEC + good SWP — confirms NIC",
      "Always capture counters before/after each step (host + SN5610)",
    ],
    actions: [
      "Label FRU decision: NIC / AEC / SWP (or config)",
      "Quarantine failed AECs; open Dell cases with both-end logs for NIC/SWP",
      "Update rail map when SWP or CT port changes",
      "Only then clear errdisable / re-enable scheduler rails",
    ],
    relatedKinds: ["compute"],
    tags: [
      "cross-swap",
      "matrix",
      "AEC",
      "SWP",
      "NIC",
      "RoCE",
      "SN5610",
      "isolation",
      "BER",
      "flaps",
    ],
    sources: [
      "Site NOC isolation runbook (NIC/AEC/SWP)",
      "Dell + NVIDIA joint data collection checklist",
    ],
  },
  {
    id: "cx8-down",
    category: "Networking",
    title: "ConnectX-8 OSFP physical path (legacy quick check)",
    severity: "major",
    vendor: "both",
    summary:
      "Quick CX-8 OSFP checks. For production RoCE to SN5610 prefer the NIC vs AEC vs SWP isolation procedures above.",
    symptoms: [
      "Leaf flaps or down ports on CT east/west",
      "NCCL network timeouts with healthy NVLink domain",
      "mlx link state down",
    ],
    checks: [
      "OSFP / AEC seating and Tx power / EEPROM",
      "SN5610 SWP FEC and flap counters",
      "Whether BF3 north/south is also affected",
      "Dell iDRAC NIC health vs NVIDIA CX-8 firmware",
    ],
    actions: [
      "Jump to RoCE isolation runbook (NIC · AEC · SWP)",
      "Reseat; swap known-good AEC; migrate SWP",
      "Firmware bounce; FRU CX-8/CT if PHY stays down on good leaf ports",
    ],
    relatedKinds: ["compute"],
    tags: ["ConnectX-8", "OSFP", "east-west", "RoCE", "SN5610", "NCCL"],
    sources: ["NVIDIA ConnectX / MLNX_OFED", "Dell NIC FRU", "SN5610 interface guide"],
  },
  {
    id: "bf3-dpu",
    category: "Networking",
    title: "BlueField-3 SuperNIC / DPU issues",
    severity: "major",
    vendor: "both",
    summary: "North/south DPU path can blackhole a CT while GPUs stay up (separate from east/west RoCE to SN5610).",
    symptoms: [
      "BF3 OS unreachable; host NICs missing",
      "Secure boot / ATF failures on DPU",
      "Storage or control plane via BF3 offline",
    ],
    checks: [
      "iDRAC / BMC path to DPU",
      "BF3 mode (DPU vs NIC) expected by site image",
      "Uplink optics and leaf config (may be different switches than SN5610 RoCE fabric)",
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
    summary: "Jobs slow without hard link-down alarms — topo, rail mapping, or RoCE path quality.",
    symptoms: [
      "AllReduce slower than baseline on same SU",
      "NCCL_DEBUG shows unexpected NET vs NVLS paths",
      "Multi-SU jobs much worse than single-SU",
      "One rail of multi-rail RoCE is silent but not marked down",
    ],
    checks: [
      "NCCL_TOPO / NVLink domain visibility",
      "Rail map CT CX-8 → SN5610 leafs; missing rail?",
      "Hidden BER on one RoCE rail (see high-BER procedure)",
      "PCIe / BF3 / CX-8 binding",
    ],
    actions: [
      "Pin NVLink-heavy stages inside one SU",
      "Fix NCCL env for multi-rail RoCE design",
      "Repair bad RoCE rail (NIC/AEC/SWP) before chasing software",
      "Validate with nccl-tests before production",
    ],
    relatedKinds: ["compute", "switch"],
    tags: ["NCCL", "topology", "AllReduce", "performance", "RoCE", "rails"],
    sources: ["NVIDIA NCCL troubleshooting / performance", "Site rail map"],
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
