# FieldOps Command

FieldOps Command is a focused operational decision-support experience for a fictional energy operator. It helps management move from fragmented operating signals to prioritized intervention: see what needs attention, understand why, and review the existing work and crew context.

## Primary user

The **Regional Operations Manager**, responsible for operating conditions and coordination across multiple regions, is the primary user.

## Operational problem

Production, asset condition, maintenance, safety, and field-work signals are fragmented across reports. As operating conditions change during the day, a static plan can become outdated. FieldOps Command puts the current management concern and its supporting context in a prioritized sequence so the manager can decide where to intervene.

## Core experience

**Operating health → management signal → regional risk → prioritized asset → priority explanation → operational evidence → work context → intervention**

## Product principles

- **Attention before telemetry:** foreground conditions that merit management attention instead of presenting every data point equally.
- **Explain priority:** show the operational reasons behind an asset's priority.
- **Connect condition to action:** bring existing work and crew context into the intervention decision.
- **Preserve uncertainty:** represent missing readings as unknown and qualify conclusions when telemetry is incomplete.
- **Design for changing operations:** use a current snapshot and consistent region and time-period filters to help managers reorient as conditions change.

## Implemented features

- Operations Overview with operating-health metrics, production versus target, asset attention counts, offline assets, open critical/high work, and available crew capacity.
- Region and time-period filters applied consistently to overview results.
- Regional performance comparison and a management signal based on the largest known production gap and current priority context.
- Rules-based, explainable prioritization and a prioritized asset list.
- Asset Detail routes with priority reasons, production and condition evidence, telemetry status, existing work-order and crew context, and recent operational events.
- Read-only intervention cues based on current work and crew context.
- Incomplete-telemetry and empty-results states.

Acknowledgement and crew-assignment execution, backend persistence, and live production-system connections are not implemented.

## Technology

- Vue 3 with Composition API
- TypeScript and JavaScript ES modules
- Vite
- Vue Router
- Local JSON data
- Roboto fonts from `@fontsource/roboto`

## Project structure

- [`BRIEF.md`](./BRIEF.md): product brief, decisions, hierarchy, and scope boundaries.
- [`.copilot/`](./.copilot/): persistent project instructions.
- [`context/`](./context/): product context, data rules, design decisions, and session log.
- [`scripts/`](./scripts/): dataset and overview-selector validation utilities.
- [`src/data/`](./src/data/): fictional metadata, regions, assets, work orders, crews, and events.
- [`src/views/`](./src/views/): Operations Overview and Asset Detail views.
- [`src/App.vue`](./src/App.vue): application shell and shared navigation.
- [`src/domain/`](./src/domain/): framework-independent overview selectors and priority logic.
- [`src/router.ts`](./src/router.ts): overview and asset-detail routes.
- [`src/style.css`](./src/style.css): application styles and responsive/accessibility treatments.

## Synthetic data

The dataset was generated specifically for this project from the documented data rules. It contains fictional operational records and is validated for entity relationships, reconciled assignments, priority consistency, time windows, and other operational consistency checks. It is local fixture data, not a connection to a production system.

## Validation

Run the available validation and build commands from the repository root:

```sh
npm run validate:data
npm run validate:overview
npm run build
```

`npm run validate:data` checks synthetic-data integrity and relationships. `npm run validate:overview` checks overview selectors, priority calculations, filters, and incomplete-telemetry behavior. `npm run build` runs TypeScript validation with `vue-tsc -b` and then creates the production build with Vite.

## Running locally

Install dependencies, then run the Vite development server:

```sh
npm install
npm run dev
```

The available package scripts are:

```sh
npm run dev
npm run build
npm run preview
npm run validate:data
npm run validate:overview
```

## Key test scenarios

With the development server running, open `/assets/<asset-id>` to inspect an asset detail:

- **AST-037 — critical, offline, assigned:** a critical safety risk and offline condition with critical in-progress work assigned to crew CRW-06.
- **AST-039 — high, restricted, unassigned:** a restricted asset with high-priority acknowledged work and no assigned crew; useful for reviewing the displayed intervention cue.
- **AST-026 — stable with unavailable telemetry:** the asset is online, but current production is unknown because telemetry is unavailable. The missing reading is not treated as zero.

## Accessibility

- Skip link to the main content, semantic page landmarks, and labelled sections/headings.
- Labelled region and period filters, keyboard-operable controls, and visible keyboard focus.
- Accessible table headers and caption, plus accessible names for icon-only or context-dependent links.
- Live announcements for filter results and status messaging for incomplete telemetry.
- Status conveyed with text as well as visual indicators; decorative icons are hidden from assistive technology.
- Reduced-motion preference is respected.

## Deployment

- Deployed application: **[Add deployment URL]**
- Repository: **[Add repository URL]**

## Case-study disclaimer

TerraVale Energy, FieldOps Command, all operating locations, data, records, crews, assets, and operational scenarios are fictional and were created for this case study. No client-specific or employer-specific confidential information is included. This disclosure belongs in repository documentation; it is intentionally not presented in the application UI.
