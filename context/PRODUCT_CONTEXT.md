# Product Context

## Purpose

FieldOps Command is a fictional operational attention-management product for TerraVale Energy. It helps managers see where intervention is needed, understand why, and move work forward before operating performance deteriorates. It prioritizes meaningful operational attention rather than displaying every available data point.

## Primary user

The Regional Operations Manager oversees multiple operating areas and balances asset performance, operational risk, maintenance, safety, and workforce considerations. Field supervisors and operators are secondary context; the MVP is designed for the manager.

## Core questions

1. What is the overall condition of operations?
2. What changed since the previous review?
3. Which region or assets need attention?
4. Why are those assets prioritized?
5. What work is already underway?
6. What decision or intervention is required?

## Core flow

Open the overview; review operating health and changes; filter by region or time period; identify and open a prioritized asset; review its priority explanation, context, open work, and recent events; acknowledge the issue or assign a fictional crew; then see the updated status and confirmation.

## MVP boundaries

The MVP consists of an Operations Overview and Asset Detail. The overview covers operating health, attention needs, production versus target, offline assets, critical and high-priority exceptions, crew capacity, region and time-period filters, regional comparison, and prioritized assets. Asset detail covers identity and region, status and priority, reasons for priority, production and trend, active risk, open work, crew assignment, inspection, recent events, and acknowledge or assign actions.

Required states include populated, loading, no filtered results, no currently critical assets, unavailable or incomplete telemetry, action success and failure, already assigned asset, and no crew available.

No backend is required for the MVP. Use local synthetic data; persist action state only if needed to demonstrate the workflow. Exact synthetic data rules must be documented before creating the dataset.

## Approved terminology

- Product: **FieldOps Command**
- Fictional company: **TerraVale Energy**
- Primary user: **Regional Operations Manager**
- Main overview: **Operations Overview**
- Detail view: **Asset Detail**
- Regions: **All Regions**, **Red Mesa**, **North Ridge**, **Cypress Bend**, **Lone Prairie**
- Time periods: **Today**, **Last 7 days**, **Last 30 days**
- Priority: explainable operational prioritization, not autonomous AI

All names and records are fictional. Use status language that is understandable and do not imply predictive accuracy or unexplained algorithmic certainty.

## Explicitly excluded functionality

- Comprehensive telemetry display that exposes every available data point without prioritization
- A backend or connection to production systems or external operational APIs
- A data set created before the separate data rules are documented
- Equal-priority experiences for every operational role
- Unexplained algorithmic scores or claims about predictive accuracy
- Maps that do not support a specific decision
- Copied interface designs, source-system references, or client-specific workflows
- Unapproved features or scope beyond the MVP
