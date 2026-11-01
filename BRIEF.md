# FieldOps Command

## Confidentiality and fictionalization

FieldOps Command and TerraVale Energy are entirely fictional.

All company names, product names, regions, assets, crews, people, measurements, thresholds, financial values, events, and operational records in this project are synthetic. The application explores a common field-operations problem, but must not contain real client information, consulting-company information, proprietary architecture, source screenshots, source-system names, client-specific workflows, or copied interface designs.

## Product context

TerraVale Energy is a fictional operator managing distributed production assets across several operating regions.

Regional operations managers currently rely on multiple reports and disconnected sources to understand asset health, production performance, maintenance activity, safety risks, and field-work status.

Because operating conditions change throughout the day, a static morning work plan can quickly become outdated. Managers must rapidly distinguish conditions that need intervention from routine operating noise, understand why an asset requires attention, and coordinate the next step across regions, supervisors, and crews.

## Product premise

FieldOps Command is an operational attention-management product. It does not attempt to display every available data point. It helps a regional operations manager:

> **Where does management need to intervene, why, and what action should happen next?**

The experience supports the manager moving from **operating condition → priority → explanation → existing work → intervention**.

### Decisions made before and during the build

- **Before implementation:** Focus the product on the Regional Operations Manager and operational attention, not comprehensive telemetry. Keep prioritization rules-based and explainable rather than presenting it as autonomous AI.
- **During implementation:** Apply the selected region and time period consistently across the overview. Base the management signal on the largest known production gap and current priority context; do not imply historical priority movement when historical snapshots are unavailable. Treat missing telemetry as unknown, not zero.
- **During the current build increment:** Make Asset Detail a second-level decision-support view, ordered from priority explanation through supporting evidence, existing work and crew context, and an intervention cue. Acknowledgement and crew-assignment execution remain deferred; the current view does not record those actions.

## Users

### Primary user: **Regional Operations Manager**

The Regional Operations Manager:

- oversees multiple operating areas
- monitors asset and production performance
- manages operational risk and workflow exceptions
- coordinates supervisors and field crews
- balances safety, production, maintenance, and workforce considerations
- needs to identify changes that require intervention
- often reviews the dashboard during morning planning and throughout the operating day

The manager works across competing conditions and disconnected information sources while those conditions can change during the day. Rapid prioritization matters because it helps direct limited management attention to the region and assets that need a decision now, without making the manager search through undifferentiated telemetry.

Field supervisors and operators may be acknowledged as secondary context, but the MVP is designed for the Regional Operations Manager. The experience should not dilute its focus by trying to serve every operational role equally.

## Core user questions

The product must answer these questions in sequence:

1. What is the overall condition of operations?
2. What current signal requires management attention?
3. Which region or assets need attention?
4. Why are those assets prioritized?
5. What work is already underway?
6. What decision or intervention is required?

## End-to-end core flow

1. The manager opens the overview.
2. The manager reviews overall operating health and the current management signal.
3. The manager filters by region or time period.
4. The manager identifies a prioritized asset.
5. The manager opens the asset detail.
6. The manager reviews the priority explanation, supporting evidence, and existing work and crew context.
7. The manager reviews the intervention cue and determines the appropriate next step.
8. The manager reviews recent operational activity as supporting context.
9. Acknowledgement and crew-assignment execution are deferred in the current build increment.

## MVP screens

### 1. Operations Overview

The overview includes:

- operating-health summary
- assets requiring attention
- production versus fictional target
- assets offline
- open critical and high-priority exceptions
- crew-capacity context
- region filter
- time-period filter
- region comparison
- prioritized asset list

### 2. Asset Detail

Asset detail includes:

- asset identifier and region
- operating status
- priority level
- transparent priority explanation
- production versus target
- recent trend
- active exception or risk
- open work order
- assigned crew, if applicable
- last inspection
- recent operational events
- management intervention cue based on existing work and crew context

The current build presents the intervention context and next-step cue. Acknowledgement and crew-assignment execution are deferred and are not active workflows.

## Approved filters

### Region

- All Regions
- Red Mesa
- North Ridge
- Cypress Bend
- Lone Prairie

These regions are fictional.

### Time period

- Today
- Last 7 days
- Last 30 days

## Priority model

The synthetic priority model should be explainable and must not be portrayed as autonomous AI. Priority may be influenced by fictional combinations of:

- safety risk
- production deviation
- downtime duration
- equipment-health condition
- work-order age
- inspection status
- crew availability

The application must explain the material reasons behind a priority. It must not present a mysterious score without supporting context.

## Core actions

In the current build, the manager can:

- filter the overview
- review prioritized assets
- open an asset detail
- review the priority explanation, supporting evidence, existing work, crew context, and intervention cue

## Required system states

The product should account for:

- default populated state
- loading state
- no filtered results
- no currently critical assets
- unavailable or incomplete telemetry
- action success
- action failure
- asset already assigned
- no crew available

Action success and failure states apply when acknowledgement or assignment execution is implemented; they are not part of the current build increment.

## Synthetic data

All application data must be generated from scratch. Create enough fictional data to produce:

- meaningful regional differences
- a discoverable region that needs attention
- both healthy and unhealthy assets
- several exception types
- varying crew capacity
- trends across the specified periods
- at least one empty-state filter combination

Exact data rules will be documented separately before the dataset is created. Do not create the dataset until those rules are documented.

## Information hierarchy

1. Overall operating health
2. Current management concern
3. Regional concentration of risk
4. Prioritized assets
5. Asset-level priority explanation
6. Supporting operational evidence
7. Existing work and crew context
8. Management intervention
9. Recent operational activity

This order puts management attention first: it moves from the operating picture to the reason and context for a decision, rather than attempting to expose comprehensive telemetry or every operational record at once.

## Scope boundaries

FieldOps Command is a **focused decision-support experience**, not a replacement for operational systems of record. The MVP intentionally does not attempt to provide:

- comprehensive asset management
- full work-order management
- workforce scheduling
- predictive maintenance
- autonomous AI recommendations
- GIS/map-based dispatch
- real-time production-system integration
- enterprise authentication or authorization
- backend persistence
- replacement of operational systems of record

It uses a fixed synthetic snapshot and local application data to demonstrate prioritization and decision context. It does not connect to live operating systems or persist management actions in a backend.

## Experience and visual direction

### Concept

**Operational clarity in a changing environment.**

The interface should feel credible, calm, focused, precise, actionable, and suitable for operational leadership. It should not resemble a marketing website.

### Visual principles

- desktop orientation with strong tablet support
- compact but readable information density
- clear numerical hierarchy
- restrained neutral surfaces
- one primary operational blue
- amber for attention
- red reserved for genuinely critical conditions
- green reserved for verified healthy or completed states
- strong alignment
- deliberate spacing
- minimal decorative imagery
- status represented through text and iconography in addition to color

### Design anti-patterns

Avoid:

- generic four-card dashboard layouts without an operational narrative
- giant KPI cards
- excessive rounded containers
- decorative gradients
- glassmorphism
- large marketing-style hero areas
- arbitrary chart collections
- red and green as the only status indicators
- unexplained algorithmic scores
- maps that do not help a decision
- dense tables without prioritization
- invented claims about predictive accuracy

## Responsive intent

- **Primary:** desktop and laptop
- **Secondary:** tablet
- **Graceful fallback:** small mobile screens

At small widths, information should stack in priority order without horizontal page scrolling.

## Accessibility

- semantic heading hierarchy
- keyboard-operable filters and actions
- visible focus states
- sufficient text and status contrast
- accessible names for charts and controls
- state not communicated through color alone
- readable tables or accessible list alternatives
- status updates announced appropriately
- reduced-motion support if motion is introduced

## Technical direction

Use the existing project stack if one has already been established. If the project has not been scaffolded, propose a minimal modern web stack before installing anything.

The application should use:

- component-based architecture
- local synthetic JSON or TypeScript data
- understandable routing
- no backend requirement for the MVP
- persisted local action state only if necessary for demonstrating the workflow

## Success criteria

Within 30 seconds, a first-time Regional Operations Manager should be able to identify:

- overall operational condition
- which region needs attention
- which assets are highest priority
- why an asset is prioritized

Within 60 seconds, the manager should be able to:

- open a priority
- understand the supporting context
- assign or acknowledge an action
- see confirmation that the action was recorded
