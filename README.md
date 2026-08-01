# Dell PowerEdge XE9712 · GB300 NVL72 SU Explorer

Interactive **3D schematic** of a **Dell Integrated Rack Scalable System (IRSS)** SU with the correct **front elevation stack**.

## Front elevation (top → bottom)

| Zone | Trays |
| --- | --- |
| Upper compute | **CT18 – CT9** (10 × PowerEdge XE9712) |
| NVLink fabric | **NVS9 – NVS1** (9 × NVLink switch trays) |
| Lower compute | **CT8 – CT1** (8 × PowerEdge XE9712) |
| Power | **PS33 × 8** (33 kW shelves on ORv3 busbar) |

Bottom-up U order matches: PS33 → CT1–8 → NVS1–9 → CT9–18 → OOB / service.

| Layer | Product |
| --- | --- |
| Compute sleds | **Dell PowerEdge XE9712** (CT1–CT18) |
| GPU platform | **NVIDIA GB300 NVL72** · 72× B300 + 36× Grace |
| Rack | **Dell IR9048** ORv3 · 48U · Direct Liquid Cooling |
| Power | **PS33** 33 kW shelves |
| Management | **iDRAC 10 / OpenBMC** · **OpenManage Enterprise** |

## Features

- Orbit / zoom / click any **CT** or **NVS** tray
- Filters for CT, NVS, PS33, DLC, OOB
- Exploded subsystem view
- Elevation callout + per-tray specs
- Operator guide (DLC, PS33, iDRAC, NVLink, CX-8, BF3, OME)

## Run

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

## Disclaimer

Educational schematic — not a certified Dell mechanical drawing. Follow **ProSupport** procedures on production systems.
