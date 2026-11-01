# Session Log

## 2026-11-01 — Product planning and scaffolding

- **Session goal:** Establish the approved product brief and organized AI project context before application implementation.
- **Decisions:** FieldOps Command is an attention-management product for the Regional Operations Manager. Priorities must be explainable. Data rules must be documented before creating synthetic data. Application work remains out of scope until requested and approved.
- **Files changed:** `BRIEF.md`, `.copilot/instructions.md`, `context/PRODUCT_CONTEXT.md`, `context/DATA_RULES.md`, `context/DESIGN_DECISIONS.md`, `context/SESSION_LOG.md`.
- **Unresolved questions at session close:** Synthetic entity definitions, relationships, calculations, thresholds, time coverage, reconciliation rules, operational stories, and validation checks remained open; these were documented in the subsequent data-rules increment below.
- **Next step at session close:** Review the project context. Audit the repository and propose an application setup only when requested, without making changes before approval.

## 2026-11-01 — Synthetic data rules

- **Session goal:** Replace the data-rule placeholders with a complete synthetic model before generating any records.
- **Decisions:** Specify four regions, 72 assets, 10 crews, related work orders and events, deterministic priority points, fixed 30-day coverage, reconciliation rules, and validation checks. All thresholds are explicitly fictional and not real-world operating guidance.
- **Files changed:** `context/DATA_RULES.md`.
- **Unresolved questions:** None for defining the fixture; the actual records remained to be generated.
- **Next step:** Generate and validate local synthetic data when requested; do not connect it to the UI without a separate implementation prompt.

## 2026-11-01 — Synthetic data generation and validation

- **Session goal:** Generate local synthetic operational records from `context/DATA_RULES.md`, validate them, and leave the UI untouched.
- **Decisions:** Stored separate JSON files for metadata, regions, assets, work orders, crews, and events under `src/data/`. Used the fixed fictional as-of date and production windows specified in the data rules. Added a standard-library Python validator that derives priorities and checks IDs, relationships, periods, values, crew assignments, required stories, and regional patterns.
- **Files changed:** `src/data/metadata.json`, `src/data/regions.json`, `src/data/assets.json`, `src/data/workOrders.json`, `src/data/crews.json`, `src/data/events.json`, `scripts/validate_synthetic_data.py`, `context/SESSION_LOG.md`.
- **Unresolved questions:** None for the approved synthetic fixture. The data has not been connected to the application UI.
- **Next step:** Review the generated fixture and validation summary. Connect it to the UI only in a separately approved implementation step.

## 2026-11-01 — Operations Overview data selectors

- **Session goal:** Add a reusable transformation layer that computes overview values from the local synthetic records and verify the calculations without introducing visual styling.
- **Decisions:** Added framework-neutral ES module selectors in `src/domain/overview.mjs`; period windows are fixed by dataset metadata. Priority is recalculated from one centralized set of thresholds and status constants. Totals report known production and a completeness flag; attainment is `null` when the selected data window contains missing samples. Attention includes Critical, High, and Moderate assets. Regional comparisons remain available across all regions while selected overview values filter to the active region.
- **Files changed:** `src/domain/overview.mjs`, `scripts/validate_overview.mjs`, `context/SESSION_LOG.md`.
- **Unresolved questions:** No Vue application or overview component exists yet, so visual/component wiring is deferred. Selectors consume the local JSON and the deterministic validation script verifies overview-ready values.
- **Next step:** When the approved Vue application exists, consume `selectOverview` and the individual selectors in its overview composable or page; keep business calculations out of the template.
- **Validation:** `node scripts/validate_overview.mjs` passed selector, priority-reconciliation, period, region, empty-result, and incomplete-telemetry checks. `python3 scripts/validate_synthetic_data.py` passed the dataset integrity checks.
