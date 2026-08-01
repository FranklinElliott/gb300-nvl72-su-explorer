# GB300 NVL72 SU Explorer

Interactive **3D schematic model** of the **NVIDIA GB300 NVL72 Scalable Unit (SU)** plus an operator-oriented **troubleshooting guide**.

> One SU = one liquid-cooled GB300 NVL72 rack: **72 Blackwell Ultra GPUs**, **36 Grace CPUs**, **9 NVLink switch trays**, **8 power shelves**, full in-rack NVLink domain (~130 TB/s class).

## Features

- Orbit / zoom / click any tray in a procedural 3D rack model
- Component filters (compute, NVSwitch, power, coolant, management)
- Exploded view by subsystem class
- Detail drawer with tray specs
- Searchable troubleshooting playbook (cooling, power, NVLink, CX-8, BlueField, BMC, storage, multi-SU)

## Stack

- React 19 + TypeScript + Vite + TanStack Start
- React Three Fiber + Drei + Three.js
- Tailwind CSS v4

## Run

```bash
npm install
npm run dev    # http://0.0.0.0:8080
npm run build
npm run typecheck
```

## Disclaimer

Educational schematic — **not** an OEM mechanical drawing or certified field service manual. Always follow site emergency operating procedures and NVIDIA / ODM documentation for production systems.

## Spec sources (public)

- [NVIDIA GB300 NVL72](https://www.nvidia.com/en-us/data-center/gb300-nvl72/)
- [NVL72 AI Factory components](https://docs.nvidia.com/enterprise-reference-architectures/nvl72-ai-factory/latest/components.html)
