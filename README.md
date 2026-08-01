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
| **CC0 – CC3** | NVLink **cable cartridges** — **all** CT + **all** NVS mate into every cartridge |
| CC0 | **GPU 1** lanes (every CT) |
| CC1 | **GPU 0** lanes (every CT) |
| CC2 | **GPU 3** lanes (every CT) |
| CC3 | **GPU 2** lanes (every CT) |

### Field failures called out in the guide

- **Bent / damaged pins** on cartridge mate face after sled service  
- **Elevated BER / CRC / replay** on that **GPU index** across the SU (not a CT range)  

Use the **Rear** camera toggle in the UI to inspect CC0–CC3.


## Run locally

```bash
npm install
npm run dev
npm run build          # Vercel-oriented production build
npm run build:pages    # Static build for GitHub Pages
```

Educational only — follow Dell ProSupport on production systems.
