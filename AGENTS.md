# AGENTS.md

This repository is meant to stay clean, demo-ready, and competition-safe.

## Working Principles

- Use the existing stack: React, Vite, TypeScript, Tailwind CSS, Recharts, Framer Motion, Markdown, Mermaid, Node scripts.
- Prefer local mock JSON and static assets over backend dependencies.
- Keep backend work optional unless the submission explicitly needs it.
- Do not invent measured performance data.
- Any number in UI, docs, demo data, or slides must be labeled as `simulated`, `assumed`, or `pilot target` unless it is linked to measured pilot evidence.
- Do not claim BreatheAtrium replaces all HVAC. It is a mixed-mode passive-first retrofit.

## Frontend Conventions

- Main app lives in `apps/studio`.
- Use TypeScript for components, data models, and calculation helpers.
- Keep charts in Recharts.
- Use Framer Motion only for subtle airflow and panel motion.
- Use Tailwind utility classes first; add CSS only for reusable animation primitives or global base styling.
- Keep the first screen useful, not a marketing landing page.
- Test desktop and mobile layouts before delivery.

## Docs Conventions

- Markdown docs should be concise, competition-facing, and easy to convert into slides.
- Mermaid diagrams belong in `docs/architecture`.
- Pilot and validation docs must separate measured results from targets.
- Business docs must avoid unsupported market-size claims.

## Firmware Conventions

- Firmware lives in `firmware/esp32-sensor-stream`.
- Prototype firmware may simulate sensor values, but Serial output must label payloads as simulated.
- Keep hardware pin mappings and real sensor dependencies documented before adding them.

## Verification Steps

Run these from the repo root when dependencies are installed:

```bash
npm install
npm run typecheck
npm run build
npm run package:dry-run
```

For local demo:

```bash
npm run dev
```

Manual QA checklist:

- Dashboard loads without console errors.
- Scenario and ROI controls update values.
- Every number is marked simulated, assumed, or pilot target.
- Mobile layout has no text overlap.
- Architecture Mermaid renders in Markdown preview.
- Packaging script prints or writes the expected manifest.
