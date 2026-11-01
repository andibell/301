import metadata from "../data/metadata.json" with { type: "json" };
import regions from "../data/regions.json" with { type: "json" };
import assets from "../data/assets.json" with { type: "json" };
import workOrders from "../data/workOrders.json" with { type: "json" };
import crews from "../data/crews.json" with { type: "json" };

export const ALL_REGIONS = "all";

export const ASSET_STATUSES = Object.freeze({
  online: "online",
  offline: "offline",
  restricted: "restricted",
});

export const PRIORITY_LEVELS = Object.freeze({
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  stable: "Stable",
});

export const ATTENTION_PRIORITY_LEVELS = Object.freeze([
  PRIORITY_LEVELS.critical,
  PRIORITY_LEVELS.high,
  PRIORITY_LEVELS.moderate,
]);

export const CREW_AVAILABILITY = Object.freeze({
  available: "available",
});

export const PERIODS = Object.freeze({
  today: Object.freeze({ label: "Today", days: 1, assetField: "currentDailyProduction" }),
  last7Days: Object.freeze({ label: "Last 7 days", days: 7, assetField: "productionLast7Days" }),
  last30Days: Object.freeze({ label: "Last 30 days", days: 30, assetField: "productionLast30Days" }),
});

export const PRIORITY_ORDER = Object.freeze({
  [PRIORITY_LEVELS.critical]: 4,
  [PRIORITY_LEVELS.high]: 3,
  [PRIORITY_LEVELS.moderate]: 2,
  [PRIORITY_LEVELS.stable]: 1,
});

export const PRIORITY_RULES = Object.freeze({
  criticalSafetyRisk: 8,
  offline: 6,
  majorProductionDeviation: 4,
  materialProductionDeviation: 2,
  downtimeAtLeast24Hours: 3,
  downtimeAtLeast8Hours: 2,
  overdueInspection: 2,
  agingHighSeverityWorkOrder: 3,
  missingTelemetry: 2,
  criticalScore: 10,
  highScore: 6,
  moderateScore: 3,
  materialDeviationPercent: 15,
  majorDeviationPercent: 30,
  overdueInspectionDays: 30,
  agingWorkOrderHours: 48,
});

export const OPEN_WORK_ORDER_STATUSES = new Set([
  "open",
  "acknowledged",
  "assigned",
  "inProgress",
  "blocked",
]);

function roundProduction(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export const overviewData = Object.freeze({
  metadata,
  regions,
  assets,
  workOrders,
  crews,
});

function assertKnownRegion(regionId, data) {
  if (regionId !== ALL_REGIONS && !data.regions.some((region) => region.regionId === regionId)) {
    throw new RangeError(`Unknown region filter: ${regionId}`);
  }
}

function assertKnownPeriod(periodId) {
  if (!Object.hasOwn(PERIODS, periodId)) {
    throw new RangeError(`Unknown period filter: ${periodId}`);
  }
}

export function getActiveRegion(regionId = ALL_REGIONS, data = overviewData) {
  assertKnownRegion(regionId, data);
  if (regionId === ALL_REGIONS) {
    return { regionId: ALL_REGIONS, name: "All Regions" };
  }
  return data.regions.find((region) => region.regionId === regionId);
}

export function getActivePeriod(periodId = "today") {
  assertKnownPeriod(periodId);
  return { periodId, ...PERIODS[periodId] };
}

export function selectAssets(data = overviewData, regionId = ALL_REGIONS) {
  assertKnownRegion(regionId, data);
  return regionId === ALL_REGIONS
    ? data.assets
    : data.assets.filter((asset) => asset.regionId === regionId);
}

function samplesForPeriod(asset, periodId) {
  const { assetField, days } = getActivePeriod(periodId);
  if (periodId === "today") {
    return [asset[assetField]];
  }
  return asset[assetField].slice(-days);
}

export function calculateProduction(assetsToSummarize, periodId = "today") {
  const { days } = getActivePeriod(periodId);
  const samples = assetsToSummarize.flatMap((asset) => samplesForPeriod(asset, periodId));
  const missingSamples = samples.filter((value) => value === null).length;
  const production = roundProduction(samples.reduce((sum, value) => sum + (value ?? 0), 0));
  const target = roundProduction(assetsToSummarize.reduce(
    (sum, asset) => sum + asset.targetDailyProduction * days,
    0,
  ));
  const complete = missingSamples === 0;

  return {
    production,
    target,
    attainmentPercent: complete && target > 0 ? (production / target) * 100 : null,
    complete,
    missingSamples,
    unit: overviewData.metadata.productionUnit,
  };
}

function latestValidProduction(asset) {
  const series = asset.productionLast30Days;
  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (series[index] !== null) {
      return {
        value: series[index],
        date: overviewData.metadata.productionDates[index],
        isCurrent: index === series.length - 1,
      };
    }
  }
  return null;
}

function isInspectionOverdue(asset) {
  const inspectionDate = new Date(`${asset.lastInspectionDate}T00:00:00Z`);
  const dueDate = new Date(inspectionDate);
  dueDate.setUTCDate(dueDate.getUTCDate() + PRIORITY_RULES.overdueInspectionDays);
  return new Date(overviewData.metadata.asOfTimestamp) > dueDate;
}

export function deriveAssetPriority(asset, data = overviewData) {
  let score = 0;
  const reasons = [];

  if (asset.safetyRiskLevel === "critical") {
    score += PRIORITY_RULES.criticalSafetyRisk;
    reasons.push("Critical safety risk is present.");
  }

  if (asset.operatingStatus === ASSET_STATUSES.offline) {
    score += PRIORITY_RULES.offline;
    reasons.push(`Asset is offline for ${asset.downtimeHours} hours.`);
  }

  const latest = latestValidProduction(asset);
  if (latest) {
    const deviationPercent = Math.max(
      0,
      ((asset.targetDailyProduction - latest.value) / asset.targetDailyProduction) * 100,
    );
    if (deviationPercent >= PRIORITY_RULES.majorDeviationPercent) {
      score += PRIORITY_RULES.majorProductionDeviation;
      reasons.push(
        `Production is ${deviationPercent.toFixed(0)}% below target${latest.isCurrent ? "" : ` on ${latest.date}`}.`,
      );
    } else if (deviationPercent >= PRIORITY_RULES.materialDeviationPercent) {
      score += PRIORITY_RULES.materialProductionDeviation;
      reasons.push(
        `Production is ${deviationPercent.toFixed(0)}% below target${latest.isCurrent ? "" : ` on ${latest.date}`}.`,
      );
    }
  }

  if (asset.downtimeHours >= 24) {
    score += PRIORITY_RULES.downtimeAtLeast24Hours;
    reasons.push(`Downtime has lasted ${asset.downtimeHours} hours.`);
  } else if (asset.downtimeHours >= 8) {
    score += PRIORITY_RULES.downtimeAtLeast8Hours;
    reasons.push(`Downtime has lasted ${asset.downtimeHours} hours.`);
  }

  if (isInspectionOverdue(asset)) {
    score += PRIORITY_RULES.overdueInspection;
    reasons.push("Inspection is overdue.");
  }

  const order = data.workOrders.find((workOrder) => workOrder.workOrderId === asset.openWorkOrderId);
  if (
    order
    && OPEN_WORK_ORDER_STATUSES.has(order.status)
    && ["high", "critical"].includes(order.severity)
    && order.ageHours >= PRIORITY_RULES.agingWorkOrderHours
  ) {
    score += PRIORITY_RULES.agingHighSeverityWorkOrder;
    reasons.push(`High-severity work order is ${order.ageHours} hours old.`);
  }

  if (["incomplete", "unavailable"].includes(asset.telemetryStatus)) {
    score += PRIORITY_RULES.missingTelemetry;
    reasons.push(
      asset.telemetryStatus === "unavailable"
        ? "Telemetry is unavailable."
        : "Telemetry is incomplete.",
    );
  }

  const level = asset.safetyRiskLevel === "critical" || score >= PRIORITY_RULES.criticalScore
    ? PRIORITY_LEVELS.critical
    : score >= PRIORITY_RULES.highScore
      ? PRIORITY_LEVELS.high
      : score >= PRIORITY_RULES.moderateScore
        ? PRIORITY_LEVELS.moderate
        : PRIORITY_LEVELS.stable;

  return {
    priorityScore: score,
    priorityLevel: level,
    priorityReasons: reasons.length > 0 ? reasons : ["No current priority conditions met."],
  };
}

export function calculateProductionAttainment(assetsToSummarize, periodId = "today") {
  return calculateProduction(assetsToSummarize, periodId).attainmentPercent;
}

export function selectTotalProduction(
  data = overviewData,
  regionId = ALL_REGIONS,
  periodId = "today",
) {
  return calculateProduction(selectAssets(data, regionId), periodId).production;
}

export function selectTotalProductionTarget(
  data = overviewData,
  regionId = ALL_REGIONS,
  periodId = "today",
) {
  return calculateProduction(selectAssets(data, regionId), periodId).target;
}

export function selectProductionAttainmentPercentage(
  data = overviewData,
  regionId = ALL_REGIONS,
  periodId = "today",
) {
  return calculateProductionAttainment(selectAssets(data, regionId), periodId);
}

export function selectTotalAssets(data = overviewData, regionId = ALL_REGIONS) {
  return selectAssets(data, regionId).length;
}

export function selectOfflineAssets(data = overviewData, regionId = ALL_REGIONS) {
  return selectAssets(data, regionId)
    .filter((asset) => asset.operatingStatus === ASSET_STATUSES.offline);
}

export function selectAssetsRequiringAttention(data = overviewData, regionId = ALL_REGIONS) {
  return selectAssets(data, regionId)
    .map((asset) => ({ ...asset, ...deriveAssetPriority(asset, data) }))
    .filter((asset) => ATTENTION_PRIORITY_LEVELS.includes(asset.priorityLevel));
}

export function selectCriticalAndHighAssets(data = overviewData, regionId = ALL_REGIONS) {
  return selectAssetsRequiringAttention(data, regionId)
    .filter((asset) => [
      PRIORITY_LEVELS.critical,
      PRIORITY_LEVELS.high,
    ].includes(asset.priorityLevel));
}

export function selectCriticalAssets(data = overviewData, regionId = ALL_REGIONS) {
  return selectAssetsRequiringAttention(data, regionId)
    .filter((asset) => asset.priorityLevel === PRIORITY_LEVELS.critical);
}

export function selectHighPriorityAssets(data = overviewData, regionId = ALL_REGIONS) {
  return selectAssetsRequiringAttention(data, regionId)
    .filter((asset) => asset.priorityLevel === PRIORITY_LEVELS.high);
}

export function selectOpenWorkOrders(data = overviewData, regionId = ALL_REGIONS) {
  const regionAssetIds = new Set(selectAssets(data, regionId).map((asset) => asset.assetId));
  return data.workOrders.filter(
    (order) => regionAssetIds.has(order.assetId) && OPEN_WORK_ORDER_STATUSES.has(order.status),
  );
}

export function selectAvailableCrews(data = overviewData, regionId = ALL_REGIONS) {
  assertKnownRegion(regionId, data);
  return data.crews.filter(
    (crew) => (regionId === ALL_REGIONS || crew.regionId === regionId)
      && crew.availability === CREW_AVAILABILITY.available
      && crew.capacityStatus !== "full",
  );
}

export function selectPrioritizedAssets(data = overviewData, regionId = ALL_REGIONS) {
  return selectAssetsRequiringAttention(data, regionId).sort((left, right) => (
    PRIORITY_ORDER[right.priorityLevel] - PRIORITY_ORDER[left.priorityLevel]
    || right.priorityScore - left.priorityScore
    || left.assetId.localeCompare(right.assetId)
  ));
}

export function selectRegionSummaries(data = overviewData, periodId = "today") {
  getActivePeriod(periodId);
  return data.regions.map((region) => {
    const regionAssets = selectAssets(data, region.regionId);
    const priorities = regionAssets.map((asset) => deriveAssetPriority(asset, data));
    const openWorkOrders = selectOpenWorkOrders(data, region.regionId);
    const availableCrews = selectAvailableCrews(data, region.regionId);
    const production = calculateProduction(regionAssets, periodId);

    return {
      regionId: region.regionId,
      name: region.name,
      ...production,
      totalAssets: regionAssets.length,
      offlineAssets: regionAssets.filter((asset) => asset.operatingStatus === "offline").length,
      assetsRequiringAttention: priorities.filter((priority) => ATTENTION_PRIORITY_LEVELS.includes(priority.priorityLevel)).length,
      criticalAssets: priorities.filter((priority) => priority.priorityLevel === PRIORITY_LEVELS.critical).length,
      highPriorityAssets: priorities.filter((priority) => priority.priorityLevel === PRIORITY_LEVELS.high).length,
      openWorkOrders: openWorkOrders.length,
      availableCrews: availableCrews.length,
    };
  });
}

export function selectOverview(data = overviewData, regionId = ALL_REGIONS, periodId = "today") {
  const activeRegion = getActiveRegion(regionId, data);
  const activePeriod = getActivePeriod(periodId);
  const filteredAssets = selectAssets(data, regionId);
  const priorities = filteredAssets.map((asset) => deriveAssetPriority(asset, data));

  return {
    activeRegion,
    activePeriod,
    production: calculateProduction(filteredAssets, periodId),
    totalAssets: filteredAssets.length,
    offlineAssets: selectOfflineAssets(data, regionId).length,
    assetsRequiringAttention: priorities.filter((priority) => ATTENTION_PRIORITY_LEVELS.includes(priority.priorityLevel)).length,
    criticalAssets: priorities.filter((priority) => priority.priorityLevel === PRIORITY_LEVELS.critical).length,
    highPriorityAssets: priorities.filter((priority) => priority.priorityLevel === PRIORITY_LEVELS.high).length,
    openWorkOrders: selectOpenWorkOrders(data, regionId),
    availableCrews: selectAvailableCrews(data, regionId),
    regionalSummaries: selectRegionSummaries(data, periodId),
    prioritizedAssets: selectPrioritizedAssets(data, regionId),
  };
}
