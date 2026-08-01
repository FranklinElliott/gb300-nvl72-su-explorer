# Dell PowerEdge XE9712 · GB300 NVL72 SU Explorer

Interactive 3D schematic of a **Dell IR9048** Integrated Rack SU.

## Front elevation (top → bottom)

| Zone | Contents |
| --- | --- |
| **PS33 × 4 (top)** | Upper power bank · PS33-5–8 |
| **CT18 – CT9** | 10 × PowerEdge XE9712 |
| **NVS9 – NVS1** | 9 × NVLink switch trays |
| **CT8 – CT1** | 8 × PowerEdge XE9712 |
| **PS33 × 4 (bottom)** | Lower power bank · PS33-1–4 |
| **External CDU** | In-row / facility — **not** in the 48U stack |

In-rack DLC manifolds / QDCs only; coolant plant is the **external CDU**.

## Run

```bash
npm install
npm run dev
npm run build
```

Educational only — follow Dell ProSupport on production systems.
