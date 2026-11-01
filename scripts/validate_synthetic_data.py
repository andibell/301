#!/usr/bin/env python3
"""Validate the fictional FieldOps Command dataset and print a concise summary."""

import json
import math
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
AS_OF = datetime(2026, 10, 31, 23, 59, 59, tzinfo=timezone.utc)
REGION_NAMES = ("Red Mesa", "North Ridge", "Cypress Bend", "Lone Prairie")
ACTIVE = {"open", "acknowledged", "assigned", "inProgress", "blocked"}
CLOSED = {"completed", "cancelled"}
PRIORITIES = ("Critical", "High", "Moderate", "Stable")


def load(name):
    with (DATA / name).open(encoding="utf-8") as file:
        return json.load(file)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def parse_date(value):
    return date.fromisoformat(value)


def parse_datetime(value):
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    require(parsed.tzinfo is not None, f"Timestamp lacks timezone: {value}")
    return parsed.astimezone(timezone.utc)


def priority_for(asset, work_order_by_id):
    score = 0
    reasons = []
    safety = asset["safetyRiskLevel"]
    if safety == "critical":
        score += 8
        reasons.append("Critical safety risk is present.")
    if asset["operatingStatus"] == "offline":
        score += 6
        reasons.append(f"Asset is offline for {asset['downtimeHours']} hours.")

    valid_samples = [
        value for value in asset["productionLast30Days"] if value is not None
    ]
    latest = valid_samples[-1] if valid_samples else None
    if latest is not None:
        deviation = max(
            0, (asset["targetDailyProduction"] - latest)
            / asset["targetDailyProduction"] * 100
        )
        attainment = latest / asset["targetDailyProduction"] * 100
        require(math.isfinite(deviation) and 0 <= deviation <= 100, f"Impossible deviation {asset['assetId']}")
        require(math.isfinite(attainment) and attainment >= 0, f"Impossible attainment {asset['assetId']}")
        if deviation >= 30:
            score += 4
            reasons.append(f"Production is {deviation:.0f}% below target.")
        elif deviation >= 15:
            score += 2
            reasons.append(f"Production is {deviation:.0f}% below target.")

    downtime = asset["downtimeHours"]
    if downtime >= 24:
        score += 3
        reasons.append(f"Downtime has lasted {downtime} hours.")
    elif downtime >= 8:
        score += 2
        reasons.append(f"Downtime has lasted {downtime} hours.")

    overdue = AS_OF.date() > (parse_date(asset["lastInspectionDate"]) + timedelta(days=30))
    if overdue:
        score += 2
        reasons.append("Inspection is overdue.")

    order_id = asset["openWorkOrderId"]
    order = work_order_by_id.get(order_id)
    if order and order["status"] in ACTIVE and order["severity"] in {"high", "critical"} and order["ageHours"] >= 48:
        score += 3
        reasons.append(f"High-severity work order is {order['ageHours']} hours old.")

    if asset["telemetryStatus"] in {"incomplete", "unavailable"}:
        score += 2
        reasons.append(
            "Telemetry is unavailable." if asset["telemetryStatus"] == "unavailable"
            else "Telemetry is incomplete."
        )

    level = (
        "Critical" if safety == "critical" or score >= 10
        else "High" if score >= 6
        else "Moderate" if score >= 3
        else "Stable"
    )
    return score, level, reasons or ["No current priority conditions met."]


def main():
    metadata = load("metadata.json")
    regions = load("regions.json")
    assets = load("assets.json")
    orders = load("workOrders.json")
    crews = load("crews.json")
    events = load("events.json")
    require(metadata["fictional"] is True, "Dataset must be explicitly marked fictional")
    require(parse_datetime(metadata["asOfTimestamp"]) == AS_OF, "Unexpected dataset as-of timestamp")
    production_dates = [parse_date(value) for value in metadata["productionDates"]]
    require(len(production_dates) == 30, "Expected 30 production dates")
    require(all(
        later - earlier == timedelta(days=1)
        for earlier, later in zip(production_dates, production_dates[1:])
    ), "Production dates are not consecutive")
    require(production_dates[-1] == AS_OF.date(), "Production series does not end on the as-of date")
    require(metadata["timeWindows"]["today"] == [production_dates[-1].isoformat()], "Incorrect Today window")
    require(metadata["timeWindows"]["last7Days"] == [value.isoformat() for value in production_dates[-7:]], "Incorrect 7-day window")
    require(metadata["timeWindows"]["last30Days"] == [value.isoformat() for value in production_dates], "Incorrect 30-day window")

    for label, records, key in (
        ("region", regions, "regionId"),
        ("asset", assets, "assetId"),
        ("work order", orders, "workOrderId"),
        ("crew", crews, "crewId"),
        ("event", events, "eventId"),
    ):
        ids = [record[key] for record in records]
        require(len(ids) == len(set(ids)), f"Duplicate {label} IDs")

    region_ids = {record["regionId"] for record in regions}
    require({record["name"] for record in regions} == set(REGION_NAMES), "Invalid region names")
    require(len(assets) == 72, f"Expected 72 assets, found {len(assets)}")
    require(len(crews) == 10, f"Expected 10 crews, found {len(crews)}")

    asset_by_id = {asset["assetId"]: asset for asset in assets}
    order_by_id = {order["workOrderId"]: order for order in orders}
    crew_by_id = {crew["crewId"]: crew for crew in crews}
    region_by_id = {region["regionId"]: region for region in regions}
    require(all(asset["regionId"] in region_ids for asset in assets), "Asset has invalid region")
    require(all(crew["regionId"] in region_ids for crew in crews), "Crew has invalid region")

    region_counts = Counter(asset["regionId"] for asset in assets)
    require(all(region_counts[rid] == 18 for rid in region_ids), "Expected 18 assets per region")

    active_by_asset = defaultdict(list)
    assigned_by_crew = defaultdict(list)
    for order in orders:
        require(order["assetId"] in asset_by_id, f"Orphan work order {order['workOrderId']}")
        require(order["status"] in ACTIVE | CLOSED, f"Invalid status for {order['workOrderId']}")
        require(order["category"] in {"mechanical", "electrical", "instrumentation", "inspection", "environmental", "safety"}, f"Invalid category for {order['workOrderId']}")
        require(order["severity"] in {"critical", "high", "moderate", "low"}, f"Invalid severity for {order['workOrderId']}")
        require(order["requiredSkill"] in {"mechanical", "electrical", "instrumentation", "inspection", "environmental", "safety"}, f"Invalid skill for {order['workOrderId']}")
        opened = parse_datetime(order["openedAt"])
        require(opened <= AS_OF, f"Future work order {order['workOrderId']}")
        expected_age = (AS_OF - opened).total_seconds() / 3600
        require(abs(order["ageHours"] - expected_age) < 0.02, f"Incorrect age for {order['workOrderId']}")
        require(order["estimatedDurationHours"] > 0, f"Invalid duration for {order['workOrderId']}")
        require(math.isfinite(order["ageHours"]) and order["ageHours"] >= 0, f"Invalid age for {order['workOrderId']}")
        if order["status"] in ACTIVE:
            active_by_asset[order["assetId"]].append(order)
        if order["assignedCrewId"] is not None:
            crew = crew_by_id.get(order["assignedCrewId"])
            require(crew is not None, f"Orphan crew on {order['workOrderId']}")
            require(order["requiredSkill"] in crew["skillTypes"], f"Crew lacks skill for {order['workOrderId']}")
            if order["status"] in ACTIVE:
                assigned_by_crew[crew["crewId"]].append(order)
        if order["status"] in {"assigned", "inProgress"}:
            require(order["assignedCrewId"] is not None, f"Assigned order lacks crew: {order['workOrderId']}")
        if order["status"] in CLOSED:
            require(order["assignedCrewId"] is None, f"Closed order retains assignment: {order['workOrderId']}")

    for asset in assets:
        require(asset["operatingStatus"] in {"online", "offline", "restricted"}, f"Invalid asset status {asset['assetId']}")
        require(asset["telemetryStatus"] in {"available", "incomplete", "unavailable"}, f"Invalid telemetry {asset['assetId']}")
        require(asset["targetDailyProduction"] > 0, f"Invalid target {asset['assetId']}")
        require(math.isfinite(asset["targetDailyProduction"]), f"Non-finite target {asset['assetId']}")
        require(asset["downtimeHours"] >= 0, f"Negative downtime {asset['assetId']}")
        require(asset["safetyRiskLevel"] in {"none", "low", "elevated", "critical"}, f"Invalid safety risk {asset['assetId']}")
        require(asset["equipmentHealthStatus"] in {"healthy", "watch", "degraded", "unknown"}, f"Invalid equipment health {asset['assetId']}")
        require(len(asset["productionLast30Days"]) == 30, f"Wrong 30-day count {asset['assetId']}")
        require(len(asset["productionLast7Days"]) == 7, f"Wrong 7-day count {asset['assetId']}")
        require(asset["productionLast30Days"][-7:] == asset["productionLast7Days"], f"Series mismatch {asset['assetId']}")
        values = asset["productionLast30Days"]
        require(all(value is None or value >= 0 for value in values), f"Negative production {asset['assetId']}")
        require(all(value is None or math.isfinite(value) for value in values), f"Non-finite production {asset['assetId']}")
        require(all(value is not None for value in values) or asset["telemetryStatus"] != "available", f"Missing available telemetry {asset['assetId']}")
        require(asset["currentDailyProduction"] == values[-1], f"Current production mismatch {asset['assetId']}")
        require(asset["telemetryStatus"] != "unavailable" or values[-1] is None, f"Unavailable telemetry has a current reading {asset['assetId']}")
        require(asset["operatingStatus"] != "offline" or (asset["downtimeHours"] > 0 and asset["currentDailyProduction"] == 0), f"Offline mismatch {asset['assetId']}")
        require(asset["operatingStatus"] != "online" or asset["downtimeHours"] == 0, f"Online downtime mismatch {asset['assetId']}")
        parse_date(asset["lastInspectionDate"])
        require(len(asset["priorityReasons"]) > 0, f"Missing priority reasons {asset['assetId']}")
        require(len(active_by_asset[asset["assetId"]]) <= 1, f"Multiple active orders for {asset['assetId']}")
        order_id = asset["openWorkOrderId"]
        if order_id is None:
            require(not active_by_asset[asset["assetId"]], f"Active order not referenced by {asset['assetId']}")
            require(asset["assignedCrewId"] is None, f"Orphan asset assignment {asset['assetId']}")
        else:
            order = order_by_id.get(order_id)
            require(order is not None and order["assetId"] == asset["assetId"] and order["status"] in ACTIVE, f"Invalid open order on {asset['assetId']}")
            require(asset["assignedCrewId"] == order["assignedCrewId"], f"Asset assignment mismatch {asset['assetId']}")
        score, level, reasons = priority_for(asset, order_by_id)
        require(asset["priorityScore"] == score, f"Priority score mismatch {asset['assetId']}")
        require(asset["priorityLevel"] == level, f"Priority level mismatch {asset['assetId']}")
        require(asset["priorityReasons"] == reasons, f"Priority reasons mismatch {asset['assetId']}")

    for crew in crews:
        assigned = assigned_by_crew[crew["crewId"]]
        require(len(assigned) <= 1, f"Multiple active assignments for {crew['crewId']}")
        require(bool(crew["skillTypes"]), f"Crew has no skills {crew['crewId']}")
        require(crew["availability"] in {"available", "assigned", "unavailable"}, f"Invalid availability {crew['crewId']}")
        order_id = crew["currentAssignmentWorkOrderId"]
        require((order_id is None) == (len(assigned) == 0), f"Crew assignment mismatch {crew['crewId']}")
        if order_id is not None:
            require(assigned[0]["workOrderId"] == order_id, f"Wrong crew order {crew['crewId']}")
            require(crew["availability"] == "assigned", f"Assigned crew availability mismatch {crew['crewId']}")
        if crew["availability"] == "available":
            require(order_id is None and crew["capacityStatus"] != "full", f"Ineligible available crew {crew['crewId']}")
        require(crew["capacityStatus"] in {"available", "limited", "full"}, f"Invalid capacity {crew['crewId']}")

    for event in events:
        require(event["assetId"] in asset_by_id, f"Orphan event {event['eventId']}")
        require(event["workOrderId"] is None or event["workOrderId"] in order_by_id, f"Orphan event work order {event['eventId']}")
        require(event["crewId"] is None or event["crewId"] in crew_by_id, f"Orphan event crew {event['eventId']}")
        if event["workOrderId"] is not None:
            require(order_by_id[event["workOrderId"]]["assetId"] == event["assetId"], f"Event/work-order asset mismatch {event['eventId']}")
        if event["eventType"] == "crewAssigned":
            require(event["crewId"] is not None and order_by_id[event["workOrderId"]]["assignedCrewId"] == event["crewId"], f"Invalid crew assignment event {event['eventId']}")
        occurred = parse_datetime(event["occurredAt"])
        require(datetime(2026, 10, 2, tzinfo=timezone.utc) <= occurred <= AS_OF, f"Event outside coverage {event['eventId']}")
        require(event["eventType"] in {"productionDeviation", "shutdown", "telemetryLoss", "inspectionCompleted", "workOrderOpened", "crewAssigned", "workAcknowledged", "assetReturnedToService"}, f"Invalid event type {event['eventId']}")
        require(bool(event["summary"]), f"Empty event summary {event['eventId']}")

    unavailable = [asset for asset in assets if asset["telemetryStatus"] == "unavailable"]
    require(len(unavailable) == 1, f"Expected one telemetry exception, found {len(unavailable)}")
    require(any(asset["priorityLevel"] == "Critical" and asset["assignedCrewId"] for asset in assets), "Missing assigned Critical asset")
    eligible_skills = {
        skill for crew in crews
        if crew["availability"] == "available" and crew["capacityStatus"] != "full"
        for skill in crew["skillTypes"]
    }
    require(any(
        asset["priorityLevel"] == "High"
        and asset["openWorkOrderId"]
        and order_by_id[asset["openWorkOrderId"]]["assignedCrewId"] is None
        and order_by_id[asset["openWorkOrderId"]]["requiredSkill"] in eligible_skills
        for asset in assets
    ), "Missing assignable High asset")
    available_skills = {
        skill for crew in crews
        if crew["availability"] == "available" and crew["capacityStatus"] != "full"
        for skill in crew["skillTypes"]
    }
    require(any(
        order["status"] in ACTIVE and order["assignedCrewId"] is None
        and order["requiredSkill"] not in available_skills
        for order in orders
    ), "Missing no-crew case")
    required_event_types = {
        "productionDeviation", "shutdown", "telemetryLoss", "inspectionCompleted",
        "workOrderOpened", "crewAssigned", "workAcknowledged", "assetReturnedToService",
    }
    require(required_event_types <= {event["eventType"] for event in events}, "Missing required operational event type")

    by_region = defaultdict(list)
    for asset in assets:
        by_region[asset["regionId"]].append(asset)
    totals = {}
    for rid, group in by_region.items():
        available_values = [a["currentDailyProduction"] for a in group if a["currentDailyProduction"] is not None]
        actual = sum(available_values)
        target = sum(a["targetDailyProduction"] for a in group)
        incomplete = any(a["currentDailyProduction"] is None for a in group)
        totals[region_by_id[rid]["name"]] = (actual, target, actual / target * 100, incomplete)

    priority_counts = Counter(asset["priorityLevel"] for asset in assets)
    region_priorities = {
        region_by_id[rid]["name"]: Counter(asset["priorityLevel"] for asset in group)
        for rid, group in by_region.items()
    }
    attention_counts = {
        name: counts["Critical"] + counts["High"]
        for name, counts in region_priorities.items()
    }
    require(region_priorities["Red Mesa"]["Critical"] == 0, "Red Mesa must have no Critical assets")
    require(attention_counts["Cypress Bend"] > max(attention_counts[name] for name in REGION_NAMES if name != "Cypress Bend"), "Cypress Bend must have the highest attention concentration")
    require(totals["Cypress Bend"][2] < min(totals[name][2] for name in REGION_NAMES if name != "Cypress Bend"), "Cypress Bend must have the lowest production attainment")
    severity_counts = Counter(
        order["severity"] for order in orders if order["status"] in ACTIVE
    )
    availability_counts = Counter(crew["availability"] for crew in crews)
    print(f"Validation passed: {len(assets)} assets, {len(orders)} work orders, {len(crews)} crews, {len(events)} events.")
    print("Assets by region: " + ", ".join(f"{region_by_id[rid]['name']} {region_counts[rid]}" for rid in region_by_id))
    print("Today production vs target by region:")
    overall_actual = sum(
        asset["currentDailyProduction"]
        for asset in assets
        if asset["currentDailyProduction"] is not None
    )
    overall_target = sum(asset["targetDailyProduction"] for asset in assets)
    overall_incomplete = any(asset["currentDailyProduction"] is None for asset in assets)
    overall_coverage = "incomplete telemetry" if overall_incomplete else "complete telemetry"
    print(f"  All Regions: {overall_actual:.1f} / {overall_target:.1f} units ({overall_actual / overall_target * 100:.1f}%; {overall_coverage})")
    for name in REGION_NAMES:
        actual, target, pct, incomplete = totals[name]
        coverage = "incomplete telemetry" if incomplete else "complete telemetry"
        print(f"  {name}: {actual:.1f} / {target:.1f} units ({pct:.1f}%; {coverage})")
    print("Assets by priority: " + ", ".join(f"{level} {priority_counts[level]}" for level in PRIORITIES))
    print("Critical/high assets by region: " + ", ".join(f"{name} {attention_counts[name]}" for name in REGION_NAMES))
    print("Open work orders by severity: " + ", ".join(f"{level} {severity_counts[level]}" for level in ("critical", "high", "moderate", "low")))
    print("Crew availability: " + ", ".join(f"{key} {availability_counts[key]}" for key in ("available", "assigned", "unavailable")))
    print(f"Telemetry exceptions: {len(unavailable)} unavailable, {sum(a['telemetryStatus'] == 'incomplete' for a in assets)} incomplete")
    print(f"Date coverage: {production_dates[0]} through {production_dates[-1]} ({len(production_dates)} days)")


if __name__ == "__main__":
    try:
        main()
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise SystemExit(f"Dataset validation failed: {error}")
