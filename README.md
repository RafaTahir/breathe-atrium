# BreatheAtrium

BreatheAtrium is a National Deep Tech Challenge competition repository for a mixed-mode atrium comfort retrofit based on Universiti Malaya IP: **"A Passive Cooling System For An Atrium Of A Building By Using Solar-Assisted Natural Ventilation" (PI 2016700745)**.

The product concept turns overheated glass atriums into measurable, lower-energy breathing spaces. It combines low-level air intake, cross-flow through occupied zones, a solar-assisted chimney or upper exhaust path, high-level hot-air release, optional water-wall or evaporative assistance, sensors, BMS integration, and a monitoring dashboard.

## Repository Map

```text
breathe-atrium/
  apps/studio/                  React + Vite + TypeScript dashboard
  firmware/esp32-sensor-stream/ Arduino/ESP32 simulated sensor stream
  docs/                         Business, prototype, and supporting notes
  scripts/                      Submission packaging helpers
  assets/                       Background placeholders, logos, demo data
```

## Local Setup

```bash
npm install
npm run dev
```

The dev server runs the studio app from `apps/studio`.

Useful commands:

```bash
npm run build
npm run typecheck
npm run proposal:pilot
npm run proposal:pilot:pdf
npm run qr:demo-hub
npm run package:dry-run
npm run package
```

## Deploy To Vercel

This repo includes `vercel.json` so Vercel can build the Vite app from the repository root.

Recommended Vercel settings:

- **Framework preset:** Vite
- **Root directory:** repository root
- **Install command:** `npm install`
- **Build command:** `npm run build`
- **Output directory:** `apps/studio/dist`

The app uses client-side routes such as `/demo-hub` and `/atrium-visualizer`, so `vercel.json` also includes a rewrite back to `index.html`.

Recommended GitHub flow:

1. Create a GitHub repo named `breathe-atrium` under `RafaTahir`.
2. Push this `breathe-atrium` folder as the repository root.
3. In Vercel, choose **Add New Project**, import `RafaTahir/breathe-atrium`, keep the settings above, and deploy.
4. After deployment, generate the booth QR code against the live URL:

```bash
npm run qr:demo-hub -- https://your-vercel-domain.vercel.app/demo-hub
```

## BreatheAtrium Studio Demo Flow

Run the app:

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

Recommended live demo sequence:

1. **Visualizer tab:** Start here for the stage moment explaining the UM solar-assisted natural ventilation IP.
2. **Overview:** Open the main studio only if you need the broader product context.
3. **Live Demo:** Select **Simulated**, **CSV Playback**, or **Hardware Serial**. Use **Start Demo Run** to show the before/after transition, and point to the visible data-source label.
4. **Design Engine:** Move the atrium height, floor area, glazing, occupancy, and discomfort controls to show a generated retrofit package.
5. **ROI Calculator:** Adjust current cooling cost, atrium load share, reduction range, pilot cost, and retrofit cost. State that outputs are assumptions or pilot targets.
6. **Pilot Hub:** Use this as the commercial next-step evidence if judges ask what happens after the demo.

The app uses `apps/studio/src/lib/sensorData.ts` and `apps/studio/src/hooks/useSensorStream.ts` to keep the Live Demo resilient if hardware is unavailable.

## Commercialization Platform Routes

BreatheAtrium Studio is now focused on product demonstration and commercialization evidence. Pitch, Q&A, and judging-criteria material belong in the separate slide deck and speaker prep, not inside the app.

- Main studio: `http://localhost:5173`
- Visualizer tab: `http://localhost:5173/#visualizer`
- QR demo hub: `http://localhost:5173/demo-hub`

In the studio, use **Ctrl+K** or **Cmd+K** to open the command palette. Useful commands include **Open Visualizer**, **Open Pilot Proposal**, and **Open Demo Hub**.

Use **Demo Day Mode** from the top controls for a cleaner projector view. It hides the admin navigation and enlarges the presentation surface.

The studio modules are:

- Overview
- Live Demo
- Design Engine
- ROI
- Pilot Hub

## Demo Hub And QR Code

The lightweight QR landing page is available at:

```text
http://localhost:5173/demo-hub
```

For booth use:

1. Run `npm run dev`.
2. Open the local Vite URL and confirm `/demo-hub` loads.
3. Generate a QR code:

```bash
npm run qr:demo-hub
```

By default, the script tries to use your laptop's LAN IP, which is better for phones on the same booth network. To point the QR code at a deployed URL, run:

```bash
npm run qr:demo-hub -- https://your-deployed-url/demo-hub
```

Generated QR assets:

- `assets/demo-data/demo-hub-qr.svg`
- `assets/demo-data/demo-hub-qr.png`
- `apps/studio/public/demo-hub-qr.svg`
- `apps/studio/public/demo-hub-qr.png`

If the QR uses a local LAN URL, keep the laptop and scanning phones on the same network. If the venue Wi-Fi blocks device-to-device access, open the hub directly on the demo laptop or use a deployed URL.

## Live Demo Data Modes

The Live Demo supports three modes:

- **Simulated:** Default fallback. Generates realistic drifting values locally in the browser and is visibly labeled **SIMULATED DATA**.
- **CSV Playback:** Replays `assets/demo-data/demo-run.csv` offline. Use this for a reliable before/after walkthrough with no hardware.
- **Hardware Serial:** Optional Web Serial mode for newline-delimited JSON from a sensor device. If the browser does not support Web Serial, the app shows a graceful unsupported message and keeps the other modes available.

Use **Start Demo Run** in Simulated or CSV Playback mode to animate a dead-atrium baseline into BreatheAtrium Mode over time.

Expected serial JSON shape:

```json
{
  "timestamp": "2026-05-16T10:30:00.000Z",
  "mode": "breathe_atrium",
  "topTempC": 37.2,
  "occupiedTempC": 30.8,
  "humidityPct": 64,
  "airflowMs": 0.68,
  "co2ppm": 650
}
```

Serial readings are optional demo inputs, not measured pilot evidence unless they come from an instrumented site run.

## ROI Calculator Formulas And Assumptions

The ROI calculator is designed for credible commercial discussion, not guaranteed savings. Every output is labeled as an assumption or pilot target until replaced by measured pilot evidence.

Inputs:

- Building type.
- Atrium floor area and height.
- Current monthly electricity/cooling cost in RM.
- Estimated atrium share of cooling burden, default 10%.
- Expected cooling-load reduction range, default 5% to 15%.
- Pilot cost.
- Full retrofit cost.
- Monitoring subscription in RM/month.
- Electricity emissions factor, labeled as an editable assumption.

Formulas:

```text
atrium monthly cooling burden =
  current monthly electricity/cooling cost * atrium cooling burden share

monthly savings range =
  atrium monthly cooling burden * expected reduction range

annual gross savings range =
  monthly savings range * 12

annual monitoring cost =
  monitoring subscription * 12

annual net savings range =
  annual gross savings range - annual monitoring cost

simple payback range =
  (pilot cost + retrofit cost) / annual net savings range
```

The calculator reports conservative and optimistic payback using the low and high ends of the net savings range. If net annual savings are not positive after monitoring cost, payback is shown as not yet positive rather than forcing a false number.

The 90-day pilot success threshold uses the low end of the expected cooling-load reduction range as the minimum target, then requires post-install verification through matched-weather baseline comparison, sensor measurement, and facilities acceptance.

Risk note shown in the app:

```text
Actual savings require site audit, sensor measurement, and post-install verification.
```

## Submission Outputs

The final package is expected to include:

- Pitch deck PDF/PPTX.
- Dashboard build from `apps/studio/dist`.
- Two-page 90-day pilot proposal at `docs/business/breathe-atrium-90-day-pilot.html`.
- Architecture diagrams and Mermaid source.
- Pilot proposal.
- Business model, go-to-market, competitive landscape, and scaling potential briefs.
- Optional speaker-prep notes outside the app.
- Firmware prototype source.
- Screenshots, background visuals, and demo JSON.

Run `npm run package` when final artifacts are ready. The script writes `submission-package/manifest.json` and attempts to create `submission-package/breathe-atrium-submission.zip` from the current build, docs, firmware, and assets. Add final deck files, screenshots, demo video, and measured pilot reports only when they actually exist.

## 90-Day Pilot Proposal

Generate the facility-manager proposal with:

```bash
npm run proposal:pilot
```

This writes `docs/business/breathe-atrium-90-day-pilot.html`. Open it in a browser and use **Print or Save PDF** to export a clean two-page PDF for the pitch package.

If Edge or Chrome is installed, generate both HTML and PDF with:

```bash
npm run proposal:pilot:pdf
```

## Data And Claims Policy

- Do not invent measured performance data.
- Label numbers as **simulated**, **assumed**, or **pilot target** unless they come from a measured pilot.
- Do not claim BreatheAtrium replaces all air-conditioning.
- Position the product as a passive-first, HVAC-aware, mixed-mode atrium retrofit.
- Confirm IP status and licensing terms with UM before final submission language implies exclusivity.

## Visual Asset Placeholders

Place AI-generated or photographed visuals under:

```text
assets/backgrounds/
```

Recommended filenames are documented in `assets/backgrounds/README.md`.
