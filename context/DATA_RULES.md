# Synthetic Data Rules

These rules define the fictional local dataset to create in a later step. They do not constitute the dataset itself. Generate all records and values from scratch; do not use external operational data or connect to external systems.

## Synthetic entities

Use the following four entities. IDs must be unique, stable, and fictional (for example, `RGN-01`, `AST-001`, `WO-001`, and `CRW-01`). Names, dates, places, values, and events must all be synthetic.

### Regions

Create exactly four regions:

- `Red Mesa`
- `North Ridge`
- `Cypress Bend`
- `Lone Prairie`

Each region has a unique region ID and name. The 72 assets should be distributed evenly: 18 assets per region. Do not imply that these fictional regions correspond to real locations.

### Assets

Create 72 assets, with 18 in each region. Each asset record includes:

| Field | Rule |
|---|---|
| `assetId` | Unique asset identifier. |
| `assetName` | Fictional, readable name; no real facility or client terminology. |
| `regionId` | Required reference to one of the four region records. |
| `latitude`, `longitude` | Optional. Coordinates are unnecessary unless a later approved decision requires a map. If included, invent approximate coordinates and label them as fictional; do not use them to imply real facility locations. |
| `operatingStatus` | One of `online`, `offline`, or `restricted`. `offline` means production is zero for the current day; `restricted` may produce a positive amount. |
| `currentDailyProduction` | Non-negative synthetic production quantity for the as-of date, in a single consistent fictional unit; nullable only when current telemetry is unavailable or incomplete. Zero when offline only when zero is verified. |
| `targetDailyProduction` | Positive synthetic target quantity in the same unit. |
| `productionLast7Days` | Seven chronological daily production values, including the as-of date; a value may be null only when telemetry for that day is missing. The final value equals `currentDailyProduction`. |
| `productionLast30Days` | Thirty chronological daily production values, including the as-of date; a value may be null only when telemetry for that day is missing. The final seven values exactly equal `productionLast7Days`. |
| `downtimeHours` | Non-negative duration of the current uninterrupted downtime episode. Zero when online; positive for offline assets. A restricted asset may have either value. |
| `equipmentHealthStatus` | One of `healthy`, `watch`, `degraded`, or `unknown`. `unknown` is appropriate when available telemetry cannot support a reliable assessment. |
| `safetyRiskLevel` | One of `none`, `low`, `elevated`, or `critical`. |
| `lastInspectionDate` | ISO 8601 date; required for priority and overdue-inspection checks. |
| `telemetryStatus` | One of `available`, `incomplete`, or `unavailable`. |
| `openWorkOrderId` | Nullable reference to the asset's one active work order. Closed historical work orders are not referenced here. |
| `assignedCrewId` | Nullable reference to the crew assigned to the active work order, if any. Mirrors the work-order assignment. |
| `priorityLevel` | Derived from the rules-based priority model below: `Critical`, `High`, `Moderate`, or `Stable`. |
| `priorityScore` | Derived sum of applicable points. Supporting context only; never display as the sole explanation. |
| `priorityReasons` | One or more plain-language reasons corresponding to the applicable model conditions. A `Stable` asset may use the explicit reason `No current priority conditions met.` |

### Work orders

Create work orders as needed to support the required stories and operational mix. Each work-order record includes:

| Field | Rule |
|---|---|
| `workOrderId` | Unique work-order identifier. |
| `assetId` | Required reference to one asset. |
| `category` | One of `mechanical`, `electrical`, `instrumentation`, `inspection`, `environmental`, or `safety`. |
| `status` | One of `open`, `acknowledged`, `assigned`, `inProgress`, `blocked`, `completed`, or `cancelled`. The first five are active; the final two are closed. |
| `openedAt` | ISO 8601 timestamp, no later than the synthetic as-of timestamp. |
| `ageHours` | Derived elapsed hours from `openedAt` to the as-of timestamp; never independently authored. |
| `severity` | One of `critical`, `high`, `moderate`, or `low`. |
| `requiredSkill` | A skill value held by any crew eligible for this order, such as `mechanical`, `electrical`, `instrumentation`, `inspection`, `environmental`, or `safety`. |
| `assignedCrewId` | Nullable crew reference. Required for `assigned`, `inProgress`, or an assigned critical story; null for an unassigned order. |
| `estimatedDurationHours` | Positive synthetic number of hours. |

An asset may have at most one active work order referenced by `openWorkOrderId`. Historical completed or cancelled orders may exist without being the asset's current open order. A work order's active status, assignment, and the asset's mirrored fields must reconcile.

### Crews

Create approximately 10 fictional crews; use exactly 10 for consistency when generating the dataset. Distribute them across all four regions (two or three crews per region). Each crew record includes:

| Field | Rule |
|---|---|
| `crewId` | Unique crew identifier. |
| `crewName` | Fictional crew name. |
| `regionId` | Required reference to one operating region. |
| `skillTypes` | Non-empty list selected from the work-order category skills. |
| `availability` | One of `available`, `assigned`, or `unavailable`. An unavailable crew cannot receive a new work order. |
| `currentAssignmentWorkOrderId` | Nullable reference to an active work order; must agree with work-order assignment. |
| `capacityStatus` | One of `available`, `limited`, or `full`. A full crew cannot receive a new assignment; limited means it can accept at most one new assignment only when explicitly represented as available under this model. |

For simple assignment behavior, a crew may own at most one active work order. An `available` crew must have no current assignment and cannot be full. An `assigned` crew must reference exactly one active order and cannot be available. `unavailable` crews cannot be selected for new work, whether or not they have a current assignment.

### Operational events

Create a chronological event history sufficient to explain recent changes and connect work to assets. Each event includes:

| Field | Rule |
|---|---|
| `eventId` | Unique event identifier. |
| `assetId` | Required reference to one asset. |
| `workOrderId` | Optional reference to a related work order. |
| `crewId` | Optional reference to a related crew. |
| `eventType` | One of `productionDeviation`, `shutdown`, `telemetryLoss`, `inspectionCompleted`, `workOrderOpened`, `crewAssigned`, `workAcknowledged`, or `assetReturnedToService`. |
| `occurredAt` | ISO 8601 timestamp within the synthetic coverage window and no later than the as-of timestamp. |
| `summary` | Concise, plain-language fictional description consistent with the event type and related records. |

Events describe recorded fictional activity. Do not infer that an event predicts a future outcome.

## Entity relationships

- Each asset belongs to exactly one region; each region has 18 assets.
- Each active work order belongs to exactly one asset. An asset may have zero or one active work order, plus any number of closed historical orders.
- Each active work order has zero or one assigned crew. Each crew has at most one active work order.
- An assigned crew must possess the work order's `requiredSkill`.
- The asset's `openWorkOrderId` and `assignedCrewId` mirror the active work order's ID and assigned crew. When there is no active order, both asset references are null.
- A crew's `currentAssignmentWorkOrderId` mirrors its assigned active work order. Historical events may reference a crew or closed work order without implying a current assignment.
- Each event references an existing asset; optional work-order and crew references, when present, must exist and be relevant to that asset or event.
- A region's assets, production, priority counts, and open-work counts are derived from its asset and work-order records, not separately authored totals.

## Calculations

### Production

- Store production as non-negative daily quantities in one consistent fictional unit.
- For each asset, current production is the final sample in its 30-day series and the final sample of its 7-day series.
- Target production is a per-day quantity and remains the comparison baseline for each day in the selected window.
- For `Today`, actual production is the as-of day's value and target is one daily target.
- For `Last 7 days` and `Last 30 days`, actual production is the sum of daily values in the window; target is daily target multiplied by the number of days in that window.
- Production attainment percentage is `actual / target * 100`. Production deviation percentage is `max(0, (target - actual) / target * 100)`. Do not cap displayed attainment at 100%; favorable performance may exceed target.
- Aggregate overview and region production by summing asset actuals and targets for the same selected period, then calculate attainment from those totals. Do not average asset percentages.
- If telemetry is unavailable or incomplete, retain only values explicitly supplied as available. Mark aggregate coverage as incomplete when missing values prevent a complete total; do not silently treat missing values as zero. Offline production is the intentional exception and is zero by definition.

### Work-order age and inspection

- Calculate `ageHours` from `openedAt` to the fixed as-of timestamp; do not hand-enter a conflicting age.
- Use a fictional inspection interval of 30 calendar days. An inspection is overdue when the as-of date is later than `lastInspectionDate + 30 days`; the due date itself is not overdue.
- Count open work using the active statuses `open`, `acknowledged`, `assigned`, `inProgress`, and `blocked`. Exclude `completed` and `cancelled`.
- Counts of critical and high-priority exceptions are based on current derived asset priority, not work-order severity alone. Show work-order severity separately where relevant.

## Priority model

This is a deterministic fictional rules-based model, not machine learning, a prediction, or an autonomous decision. Compute priority from the current asset and active work-order facts. Add all applicable points; each condition contributes at most once.

| Condition | Points |
|---|---:|
| `safetyRiskLevel` is `critical` | +8 |
| `operatingStatus` is `offline` | +6 |
| Production deviation is at least 30% on the latest day with valid telemetry | +4 |
| Production deviation is at least 15% and below 30% | +2 |
| `downtimeHours` is at least 24 | +3 |
| `downtimeHours` is at least 8 and below 24 | +2 |
| Inspection is overdue under the 30-day rule | +2 |
| Active high- or critical-severity work order is at least 48 hours old | +3 |
| Telemetry is `incomplete` or `unavailable` | +2 |

For production scoring, use the latest day with valid telemetry in the fixed 30-day series. If the current day's production is missing, do not calculate deviation from that missing value; use the most recent valid day and label the supporting reason accordingly. Never infer zero production from missing telemetry. The score is a current snapshot and is not recalculated by the user's selected chart period.

Map the sum to levels as follows:

- **Critical:** score 10 or higher, or safety risk is critical.
- **High:** score 6–9.
- **Moderate:** score 3–5.
- **Stable:** score 0–2.

The critical-safety override makes a critical safety condition Critical regardless of arithmetic. The UI must show the level and plain-language reasons (for example, “Offline for 27 hours” or “Production is 34% below target”), not just the point total. If no condition applies, state that no current priority conditions were met.

Priority is a current snapshot. The region and time-period filters change production comparisons and trend display; they do not retroactively recalculate current safety, assignment, inspection, or work-order facts. Use the same priority rules for each region and asset.

## Thresholds

The following are fictional design thresholds selected for a comprehensible demonstration, not industry standards or safety guidance:

- Material production deviation: 15% below target.
- Major production deviation: 30% or more below target.
- Extended downtime: 8 hours; more significant downtime: 24 hours.
- Inspection interval: 30 calendar days.
- Aging high/critical work order: 48 elapsed hours.
- Crew capacity: a crew may carry at most one active assignment; full crews cannot receive new work.
- Priority score bands and safety override: as defined in the priority model.

Do not present these values as real-world operating policy.

## Time coverage

- Use the fixed synthetic as-of timestamp `2026-10-31T23:59:59Z`. It is a fixture reference point, not a claim about live operating time.
- Store event and work-order times as ISO 8601 UTC timestamps. Store dates as ISO 8601 dates.
- Provide 30 consecutive daily production samples per asset, inclusive of the as-of date: `2026-10-02` through `2026-10-31`.
- The seven-day window is `2026-10-25` through `2026-10-31`, inclusive.
- `Today` means `2026-10-31` in the synthetic fixture.
- Ensure work-order and event timestamps do not exceed the as-of timestamp. Keep historical inspection dates far enough back to demonstrate both current and overdue cases.
- All period filters use the same fixed fixture dates so results are stable across runs and do not depend on the machine clock.

## Reconciliation rules

- Overall production equals the sum of asset production for the selected period, considering only valid available values. Clearly mark totals incomplete if any included asset lacks the required data; never hide missingness or substitute zero for unknown.
- Each region's production, target, asset count, priority counts, and open-work counts equal aggregates of its own asset and work-order records. Overall figures equal the corresponding aggregates across all four regions.
- Each open-work count equals the number of related work-order records in active statuses. Critical/high exception counts use derived asset priorities.
- Asset `openWorkOrderId`, asset `assignedCrewId`, work-order `assetId` and `assignedCrewId`, and crew `currentAssignmentWorkOrderId` must agree. All references must resolve to valid records.
- A crew must have the required skill, be eligible by availability and capacity, and not already hold another active assignment before a new assignment. Unavailable or full crews cannot receive new work.
- Online assets have zero current downtime; offline assets have positive downtime and zero current production. Restricted assets may have positive production and downtime. Telemetry loss does not by itself imply an offline asset or zero production.
- Completed and cancelled work orders cannot be the asset's active open work order or a crew's current assignment. Active assigned/in-progress work must have a valid assigned crew; an unassigned active work order may have no crew.
- Recalculate priority score, level, and reasons from facts after any data or action-state change; do not maintain conflicting hand-authored priority values.
- Production-series dates must be ordered and contiguous. Seven-day values must exactly match the last seven values of the 30-day series.

## Required operational stories

The generated dataset must make these patterns discoverable from the overview and asset details:

- **Cypress Bend requires the most management attention.** It has the highest concentration of Critical and High assets and materially lower production attainment than the other regions. Explain this with a believable combination of under-target production, prolonged downtime, and active work orders rather than a single arbitrary score.
- **Red Mesa is comparatively healthy.** Most of its assets are Stable or Moderate, production is near or above target, and it has no Critical asset. A `Red Mesa` + `Critical` filter therefore produces no results.
- **North Ridge and Lone Prairie are mixed but manageable.** Each has a blend of healthy and attention-needed assets without matching Cypress Bend's concentration of risk.
- **Unavailable telemetry:** exactly one asset has `telemetryStatus: unavailable`; its current production and at least the current-day sample are unknown, not zero, and its priority explanation identifies unavailable telemetry. Keep this asset's operating status independently supportable (for example, online based on the latest confirmed status); do not infer a shutdown from telemetry loss. Other assets may have incomplete telemetry only if needed to explain an operational story.
- **Assigned critical case:** at least one Critical asset has a valid active work order assigned to an eligible non-unavailable crew; the crew, asset, and work-order references reconcile.
- **Actionable high case:** at least one High asset has an unassigned active work order and at least one currently available, not-full crew with the required skill. The asset must be eligible for assignment.
- **No-crew case:** at least one active work order has no eligible available crew, so the no-crew state can be demonstrated without assigning an unavailable crew.
- Include multiple work-order categories, severities, statuses, and ages; both available and unavailable/assigned crews; production deviation, shutdown, telemetry loss, inspection completion, work-order opening, crew assignment, work acknowledgement, and return-to-service event examples.
- Keep operational stories internally consistent. Do not hard-code dashboard aggregates separately from the records that produce them.

## Validation checks

Run these checks against any generated dataset before using it:

- **Duplicate IDs:** no duplicate region, asset, work-order, crew, or event IDs.
- **Orphaned records:** every foreign key resolves; event and work-order relationships are valid.
- **Region names:** every asset and crew references exactly one of the four approved fictional regions; no other region names occur.
- **Asset distribution:** exactly 72 assets total, exactly 18 per region; exactly 10 crews total when following this specification.
- **Percentages:** target production is positive; attainment and deviation are finite, non-negative percentages; deviation is not above 100% when calculated from non-negative actual production; missing telemetry never creates impossible values.
- **Production:** no negative samples or current production; null samples occur only with missing telemetry; current value equals the final daily sample, including null, where applicable; seven-day values match the final seven 30-day values; verified offline production is zero.
- **Status compatibility:** online assets have zero downtime; offline assets have positive downtime; active and closed work-order statuses have consistent crew and asset references.
- **Crew eligibility:** no crew has more than one active assignment; skill, availability, capacity, and assignment references are consistent.
- **Priority:** recomputed points, priority level, and plain-language reasons match the specified model; every asset has a non-empty reason list; every non-Stable condition has a reason that names the material condition.
- **Time coverage:** production has exactly 30 contiguous days, with the correct seven-day overlap; events and opened dates are not in the future relative to the synthetic as-of timestamp; derived ages are non-negative.
- **Required stories:** Cypress Bend has the greatest attention concentration and lower attainment; Red Mesa has no Critical assets; the telemetry-unavailable, assigned Critical, assignable High, no-crew, and empty-filter cases all exist.
- **Aggregate reconciliation:** overall and regional production, target, attainment, open-work, and priority counts recompute from underlying records and agree exactly (within numeric precision for derived percentages).
