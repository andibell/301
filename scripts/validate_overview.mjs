#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  ALL_REGIONS,
  calculateProduction,
  deriveAssetPriority,
  getActivePeriod,
  overviewData,
  selectAssets,
  selectCriticalAssets,
  selectHighPriorityAssets,
  selectOverview,
  selectProductionAttainmentPercentage,
  selectRegionSummaries,
  selectTotalAssets,
  selectTotalProduction,
  selectTotalProductionTarget,
} from "../src/domain/overview.mjs";

const overview = selectOverview();
assert.equal(overview.activeRegion.name, "All Regions");
assert.equal(overview.activePeriod.label, "Today");
assert.equal(overview.totalAssets, 72);
assert.equal(overview.production.production, 7155.5);
assert.equal(overview.production.target, 7495);
assert.equal(overview.production.complete, false);
assert.equal(overview.production.missingSamples, 1);
assert.equal(overview.production.attainmentPercent, null);
assert.equal(overview.offlineAssets, 2);
assert.equal(overview.criticalAssets, 2);
assert.equal(overview.highPriorityAssets, 5);
assert.equal(overview.assetsRequiringAttention, 9);
assert.equal(overview.openWorkOrders.length, 16);
assert.equal(overview.criticalHighWorkOrders, 6);
assert.equal(overview.availableCrews.length, 5);
assert.equal(overview.prioritizedAssets[0].assetId, "AST-037");
assert.equal(selectTotalProduction(), 7155.5);
assert.equal(selectTotalProductionTarget(), 7495);
assert.equal(selectProductionAttainmentPercentage(), null);
assert.equal(selectTotalAssets(), 72);
assert.equal(selectCriticalAssets().length, 2);
assert.equal(selectHighPriorityAssets().length, 5);

for (const asset of overviewData.assets) {
  const computed = deriveAssetPriority(asset);
  assert.equal(computed.priorityScore, asset.priorityScore, `${asset.assetId} priority score`);
  assert.equal(computed.priorityLevel, asset.priorityLevel, `${asset.assetId} priority level`);
  assert.deepEqual(computed.priorityReasons, asset.priorityReasons, `${asset.assetId} priority reasons`);
}

const periodValues = {
  today: { production: 7155.5, target: 7495, attainment: null },
  last7Days: { production: 51243.5, target: 52465, attainment: null },
  last30Days: { production: 220244.3, target: 224850, attainment: null },
};
for (const [periodId, expected] of Object.entries(periodValues)) {
  const result = calculateProduction(overviewData.assets, periodId);
  assert.equal(result.production, expected.production, `${periodId} production`);
  assert.equal(result.target, expected.target, `${periodId} target`);
  assert.equal(result.attainmentPercent, expected.attainment, `${periodId} attainment`);
  assert.equal(
    result.unit,
    periodId === "today"
      ? "fictional production units per day"
      : `fictional production units over ${periodId === "last7Days" ? 7 : 30} days`,
    `${periodId} production unit`,
  );
}

const regionByName = new Map(overviewData.regions.map((region) => [region.name, region.regionId]));
const redMesa = selectOverview(overviewData, regionByName.get("Red Mesa"));
assert.equal(redMesa.totalAssets, 18);
assert.equal(redMesa.production.production, 1938.6);
assert.equal(redMesa.production.target, 1878);
assert.equal(redMesa.production.attainmentPercent, (1938.6 / 1878) * 100);
assert.equal(redMesa.criticalAssets, 0);
assert.equal(redMesa.prioritizedAssets.length, 0);
assert.equal(redMesa.regionalSummaries.length, 1);
assert.match(redMesa.changeSummary.headline, /meeting target/);
assert.equal(redMesa.criticalHighWorkOrders, 0);

const cypressBend = selectOverview(overviewData, regionByName.get("Cypress Bend"));
assert.equal(cypressBend.totalAssets, 18);
assert.equal(cypressBend.production.production, 1542.3);
assert.equal(cypressBend.production.target, 1864);
assert.equal(cypressBend.criticalAssets, 2);
assert.equal(cypressBend.highPriorityAssets, 3);
assert.equal(cypressBend.criticalHighWorkOrders, 5);
assert.equal(cypressBend.regionalSummaries.length, 1);
assert.equal(cypressBend.changeSummary.regionId, regionByName.get("Cypress Bend"));
assert.match(cypressBend.changeSummary.headline, /Cypress Bend/);
assert.equal(overview.changeSummary.regionId, regionByName.get("Cypress Bend"));

const telemetryAsset = overviewData.assets.find((asset) => asset.telemetryStatus === "unavailable");
const telemetryPriority = deriveAssetPriority(telemetryAsset);
assert.equal(telemetryPriority.priorityLevel, "Stable");
assert.ok(telemetryPriority.priorityReasons.includes("Telemetry is unavailable."));

const criticalAsset = overviewData.assets.find((asset) => asset.assetId === "AST-037");
assert.equal(deriveAssetPriority(criticalAsset).priorityLevel, "Critical");
assert.ok(criticalAsset.assignedCrewId);

const assignableHighAsset = overviewData.assets.find((asset) => asset.assetId === "AST-040");
assert.equal(deriveAssetPriority(assignableHighAsset).priorityLevel, "High");
assert.equal(assignableHighAsset.assignedCrewId, null);
assert.ok(overview.availableCrews.some((crew) => crew.skillTypes.includes("instrumentation")));

const noResults = selectOverview(overviewData, regionByName.get("Red Mesa"))
  .prioritizedAssets.filter((asset) => asset.priorityLevel === "Critical");
assert.deepEqual(noResults, []);
assert.equal(selectAssets(overviewData, ALL_REGIONS).length, 72);
assert.equal(selectRegionSummaries(overviewData, "last30Days").length, 4);
assert.equal(getActivePeriod("last7Days").days, 7);
assert.throws(() => selectOverview(overviewData, "RGN-UNKNOWN"), RangeError);
assert.throws(() => selectOverview(overviewData, ALL_REGIONS, "last90Days"), RangeError);

console.log("Overview selector checks passed.");
console.log(`Today all regions: ${overview.production.production} / ${overview.production.target} units; telemetry coverage incomplete as expected.`);
console.log(`Today Red Mesa: ${redMesa.production.production} / ${redMesa.production.target} units (${redMesa.production.attainmentPercent.toFixed(1)}%); no Critical or attention assets.`);
console.log(`Today Cypress Bend: ${cypressBend.production.production} / ${cypressBend.production.target} units (${cypressBend.production.attainmentPercent.toFixed(1)}%); ${cypressBend.criticalAssets} Critical and ${cypressBend.highPriorityAssets} High.`);
