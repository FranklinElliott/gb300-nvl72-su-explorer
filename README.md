# Dell PowerEdge XE9712 · GB300 NVL72 SU Explorer

Interactive **3D schematic** of a **Dell Integrated Rack Scalable System (IRSS)** SU:

| Layer | Product |
| --- | --- |
| Compute sleds | **Dell PowerEdge XE9712** (18 × 1U) |
| GPU platform | **NVIDIA GB300 NVL72** · 72× B300 + 36× Grace |
| Rack | **Dell IR9048** ORv3 · 48U · Direct Liquid Cooling |
| Power | **PS33** 33 kW shelves (6 × 5500 W) on ORv3 busbar |
| Management | **iDRAC 10 / OpenBMC** · **OpenManage Enterprise** · PowerSwitch SN2201 OOB |

## Features

- Orbit / zoom / click any sled or tray
- Filters for XE9712, NVLink switch, PS33, DLC, OOB
- Exploded subsystem view
- Spec drawer with Dell-oriented tray details
- Searchable operator guide (DLC leaks, PS33, iDRAC, NVLink, CX-8, BF3, OME, multi-SU)

## Stack

React 19 · TypeScript · Vite · TanStack Start · React Three Fiber · Tailwind CSS v4

## Run

```bash
npm install
npm run dev    # 0.0.0.0:8080
npm run build
npm run typecheck
```

## Disclaimer

Educational schematic based on public Dell / NVIDIA materials — **not** a certified mechanical drawing or Dell field service manual. Always follow **Dell ProSupport** procedures and site EOPs on production systems.

## Public references

- [Dell PowerEdge XE9712](https://www.dell.com/en-us/shop/ipovw/poweredge-xe9712)
- [PowerEdge XE9712 spec sheet](https://www.delltechnologies.com/asset/en-us/products/servers/technical-support/poweredge-xe9712-spec-sheet.pdf)
- [Dell + NVIDIA GB300 NVL72 IRSS](https://www.dell.com/en-us/blog/dell-delivers-market-s-first-nvidia-gb300-nvl72-to-coreweave/)
