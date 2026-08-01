# Dell PowerEdge XE9712 · GB300 NVL72 SU Explorer

Interactive 3D schematic of a **Dell IR9048** Integrated Rack SU.

## Live site

**[https://franklinelliott.github.io/gb300-nvl72-su-explorer/](https://franklinelliott.github.io/gb300-nvl72-su-explorer/)**

Source: [FranklinElliott/gb300-nvl72-su-explorer](https://github.com/FranklinElliott/gb300-nvl72-su-explorer)

Deployed via GitHub Actions → GitHub Pages (`npm run build:pages`).

## Front elevation (top → bottom)

| Zone | Contents |
| --- | --- |
| **PS33 × 4 (top)** | PS33-5–8 |
| **CT18 – CT9** | 10 × PowerEdge XE9712 |
| **NVS9 – NVS1** | 9 × NVLink switch trays |
| **CT8 – CT1** | 8 × PowerEdge XE9712 |
| **PS33 × 4 (bottom)** | PS33-1–4 |
| **Facility plant** | Outside data hall · FacOps · multi-cabinet (not in model) |

## Rear

| Part | Role |
| --- | --- |
| **CC0 – CC3** | NVLink **cable cartridges** — CT/NVS nodes **blind-mate** into these |
| CC0 | CT1–5 + NVS path A |
| CC1 | CT6–9 + NVS path B |
| CC2 | CT10–14 + NVS path C |
| CC3 | CT15–18 + NVS path D |

### Field failures called out in the guide

- **Bent / damaged pins** on cartridge mate face after sled service  
- **Elevated BER / CRC / replay** on NVLink lanes through one cartridge path  

Use the **Rear** camera toggle in the UI to inspect CC0–CC3.

## Run locally

```bash
npm install
npm run dev
npm run build          # Vercel-oriented production build
npm run build:pages    # Static build for GitHub Pages
```

Educational only — follow Dell ProSupport on production systems.
