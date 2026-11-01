# FieldOps Command

## Confidentiality and fictionalization

FieldOps Command and TerraVale Energy are entirely fictional.

All company names, product names, regions, assets, crews, people, measurements, thresholds, financial values, events, and operational records in this project are synthetic. The application explores a common field-operations problem, but must not contain real client information, consulting-company information, proprietary architecture, source screenshots, source-system names, client-specific workflows, or copied interface designs.

## Product context

TerraVale Energy is a fictional operator managing distributed production assets across several operating regions.

Regional operations managers currently rely on multiple reports and disconnected sources to understand asset health, production performance, maintenance activity, safety risks, and field-work status.

Because operating conditions change throughout the day, a static morning work plan can quickly become outdated. Managers need a clear way to identify deteriorating conditions, understand why an asset requires intervention, and coordinate action.

## Product premise

FieldOps Command is an operational attention-management product. It does not attempt to display every available data point. It helps a regional operations manager:

> **See where intervention is needed, understand why, and move work forward before operating performance deteriorates.**

## Users

### Primary user: Regional Operations Manager

The Regional Operations Manager:

- oversees multiple operating areas
- monitors asset and production performance
- manages operational risk and workflow exceptions
- coordinates supervisors and field crews
- balances safety, production, maintenance, and workforce considerations
- needs to identify changes that require intervention
- often reviews the dashboard during morning planning and throughout the operating day

Field supervisors and operators may be acknowledged as secondary context, but the MVP is designed for the Regional Operations Manager. The experience should not dilute its focus by trying to serve every operational role equally.

## Core user questions

The product must answer these questions in sequence:

1. What is the overall condition of operations?
2. What changed since the previous review?
3. Which region or assets need attention?
4. Why are those assets prioritized?
5. What work is already underway?
6. What decision or intervention is required?

## End-to-end core flow

1. The manager opens the overview.
2. The manager reviews overall operating health and changes.
3. The manager filters by region or time period.
4. The manager identifies a prioritized asset.
5. The manager opens the asset detail.
6. The manager reviews the priority explanation, operational context, open work, and recent events.
7. The manager acknowledges the issue or assigns a fictional crew.
8. The interface updates the action status and provides confirmation.

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
- acknowledge or assign-action workflow

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

The manager can:

- filter the overview
- sort or inspect prioritized assets
- open an asset detail
- acknowledge an exception
- assign an available fictional crew
- return to the overview and see the updated state

## Required system states

Design and implement:

- default populated state
- loading state
- no filtered results
- no currently critical assets
- unavailable or incomplete telemetry
- action success
- action failure
- asset already assigned
- no crew available

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
2. Changes requiring attention
3. Regional concentration of risk
4. Prioritized assets
5. Asset-level explanation
6. Action and confirmation

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
