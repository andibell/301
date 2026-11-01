<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  ALL_REGIONS,
  PERIODS,
  overviewData,
  selectOverview,
} from "../domain/overview.mjs";

const activeRegionId = ref<string>(ALL_REGIONS);
const activePeriodId = ref<"today" | "last7Days" | "last30Days">("today");

const overview = computed(() => selectOverview(
  overviewData,
  activeRegionId.value,
  activePeriodId.value,
));

const hasActiveFilters = computed(
  () => activeRegionId.value !== ALL_REGIONS || activePeriodId.value !== "today",
);

const filterState = computed(() => {
  const filters = [];
  if (activeRegionId.value !== ALL_REGIONS) {
    filters.push(`Region: ${overview.value.activeRegion.name}`);
  }
  if (activePeriodId.value !== "today") {
    filters.push(`Period: ${overview.value.activePeriod.label}`);
  }
  return filters.length > 0 ? filters.join(" · ") : "All regions · Today";
});

const statusClass = (status: string) => ({
  "status-critical": status === "Critical attention",
  "status-attention": status === "Needs attention",
  "status-watch": status === "Watch",
  "status-healthy": status === "On plan",
});

const priorityClass = (priority: string) => ({
  "priority-critical": priority === "Critical",
  "priority-high": priority === "High",
  "priority-moderate": priority === "Moderate",
});

const operatingStatusClass = (status: string) => ({
  [`table-status-${status}`]: ["online", "offline", "restricted"].includes(status),
});

const workStatusClass = (status: string) => (
  `work-status-${status.toLowerCase().replace(/\s+/g, "-")}`
);

const formatNumber = (value: number) => new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
}).format(value);

const formatPercent = (value: number | null) => value === null
  ? "Unavailable"
  : `${value.toFixed(1)}%`;

const formatVariance = (value: number | null) => {
  if (value === null) return "Telemetry incomplete";
  if (value === 0) return "On target";
  const direction = value > 0 ? "above" : "below";
  return `${Math.abs(value).toFixed(1)}% ${direction}`;
};

function resetFilters() {
  activeRegionId.value = ALL_REGIONS;
  activePeriodId.value = "today";
}
</script>

<template>
  <div class="overview-page">
    <section class="page-heading" aria-labelledby="page-title">
      <div>
        <p class="eyebrow">Regional operations</p>
        <h1 id="page-title">Operations Overview</h1>
        <p class="page-description">
          Current operating health and the work that needs management attention.
        </p>
      </div>
      <div class="as-of">
        <span class="as-of-indicator" aria-hidden="true"></span>
        <span>Snapshot as of {{ overviewData.metadata.asOfTimestamp.slice(0, 10) }}</span>
      </div>
    </section>

    <section class="filter-bar" aria-label="Overview filters">
      <div class="filter-controls">
        <label class="filter-field">
          <span>Region</span>
          <select v-model="activeRegionId" name="region" aria-label="Filter by region">
            <option :value="ALL_REGIONS">All Regions</option>
            <option v-for="region in overviewData.regions" :key="region.regionId" :value="region.regionId">
              {{ region.name }}
            </option>
          </select>
        </label>
        <label class="filter-field">
          <span>Time period</span>
          <select v-model="activePeriodId" name="period" aria-label="Filter by time period">
            <option v-for="(period, periodId) in PERIODS" :key="periodId" :value="periodId">
              {{ period.label }}
            </option>
          </select>
        </label>
      </div>
      <div class="filter-state" aria-live="polite">
        <span class="filter-state-label">Showing</span>
        <span>{{ filterState }}</span>
        <button
          class="reset-button"
          type="button"
          :disabled="!hasActiveFilters"
          @click="resetFilters"
        >
          Reset filters
        </button>
      </div>
    </section>

    <section class="health-section" aria-labelledby="health-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">At a glance</p>
          <h2 id="health-heading">Operating health</h2>
        </div>
        <span class="section-context">{{ overview.activePeriod.label }} · {{ overview.activeRegion.name }}</span>
      </div>

      <div class="health-layout">
        <article class="production-panel">
          <div class="production-panel-top">
            <span class="metric-kicker">Production attainment</span>
            <span class="data-period">{{ overview.activePeriod.label }}</span>
          </div>
          <div class="production-value">
            <span class="production-actual">{{ formatNumber(overview.production.production) }}</span>
            <span class="production-divider">/</span>
            <span class="production-target">{{ formatNumber(overview.production.target) }}</span>
          </div>
          <div class="production-caption">
            <span>Actual</span>
            <span>Target</span>
            <span>{{ overview.production.unit.replace("fictional ", "") }}</span>
          </div>
          <p class="attainment-line">
            <strong>{{ formatPercent(overview.production.attainmentPercent) }}</strong>
            <span>of target</span>
          </p>
          <p v-if="!overview.production.complete" class="data-quality-note" role="status">
            Production total is incomplete: {{ overview.production.missingSamples }} reading
            <span v-if="overview.production.missingSamples !== 1">s</span>
            unavailable for this period.
          </p>
          <p v-else class="data-quality-note data-quality-complete">
            Complete telemetry for the selected period.
          </p>
        </article>

        <div class="supporting-metrics" aria-label="Supporting operating metrics">
          <article class="supporting-metric">
            <span class="supporting-label">Assets needing attention</span>
            <strong>{{ overview.assetsRequiringAttention }}</strong>
            <span class="supporting-detail">
              {{ overview.criticalAssets }} critical · {{ overview.highPriorityAssets }} high
            </span>
          </article>
          <article class="supporting-metric">
            <span class="supporting-label">Assets offline</span>
            <strong>{{ overview.offlineAssets }}</strong>
            <span class="supporting-detail">of {{ overview.totalAssets }} assets</span>
          </article>
          <article class="supporting-metric">
            <span class="supporting-label">Open critical / high work</span>
            <strong>{{ overview.criticalHighWorkOrders }}</strong>
            <span class="supporting-detail">orders on Critical or High assets</span>
          </article>
          <article class="supporting-metric">
            <span class="supporting-label">Available crew capacity</span>
            <strong>{{ overview.availableCrews.length }}</strong>
            <span class="supporting-detail">eligible crews in selected scope</span>
          </article>
        </div>
      </div>
    </section>

    <section class="change-section" aria-labelledby="change-heading" aria-live="polite">
      <div class="change-marker" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 3.5 2.4 20h19.2L12 3.5Z" />
          <path d="M12 9v5m0 3h.01" />
        </svg>
      </div>
      <div class="change-copy">
        <p class="eyebrow">Management signal</p>
        <h2 id="change-heading">{{ overview.changeSummary.headline }}</h2>
        <p>{{ overview.changeSummary.detail }}</p>
        <div class="change-context">
          <span>{{ overview.changeSummary.priorityContext }}</span>
          <span>{{ overview.changeSummary.exceptionContext }}</span>
        </div>
      </div>
      <p v-if="overview.changeSummary.incompleteTelemetry" class="change-caveat">
        Based on available telemetry
      </p>
    </section>

    <section class="regional-section" aria-labelledby="regional-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Risk by operating area</p>
          <h2 id="regional-heading">Regional performance</h2>
        </div>
        <span class="section-context">{{ overview.activePeriod.label }} production and current operational status</span>
      </div>

      <div class="region-list">
        <button
          v-for="region in overview.regionalSummaries"
          :key="region.regionId"
          class="region-row"
          :class="{ 'region-row-selected': activeRegionId === region.regionId }"
          type="button"
          :aria-pressed="activeRegionId === region.regionId"
          :aria-label="`Filter overview to ${region.name}, ${region.operationalStatus}, ${region.assetsRequiringAttention} ${region.assetsRequiringAttention === 1 ? 'asset' : 'assets'} need attention`"
          @click="activeRegionId = region.regionId"
        >
          <span class="region-identity">
            <span class="region-name">{{ region.name }}</span>
            <span class="region-status" :class="statusClass(region.operationalStatus)">
              <span class="region-status-mark" aria-hidden="true"></span>
              {{ region.operationalStatus }}
            </span>
          </span>
          <span class="region-performance">
            <span class="region-attainment">{{ formatPercent(region.attainmentPercent) }}</span>
            <span class="region-performance-label">production attainment</span>
          </span>
          <span class="region-stat">
            <strong>{{ region.assetsRequiringAttention }}</strong>
            <span>attention</span>
          </span>
          <span class="region-stat">
            <strong>{{ region.offlineAssets }}</strong>
            <span>offline</span>
          </span>
          <span class="region-stat">
            <strong>{{ region.openWorkOrders }}</strong>
            <span>open work</span>
          </span>
          <span class="region-stat region-crew-stat">
            <strong>{{ region.availableCrews }}</strong>
            <span>crews available</span>
          </span>
          <span class="region-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </span>
        </button>
        <p v-if="overview.regionalSummaries.some((region) => !region.complete)" class="region-data-note">
          Regional production attainment is unavailable where required telemetry is missing.
        </p>
      </div>
    </section>

    <section class="priority-section" aria-labelledby="priority-heading" aria-live="polite">
      <div class="section-heading priority-heading-row">
        <div>
          <p class="eyebrow">Intervention queue</p>
          <h2 id="priority-heading">Prioritized assets</h2>
          <p class="section-description">
            Ordered by the transparent operational priority rules; reasons are shown for every asset.
          </p>
        </div>
        <span class="queue-count">{{ overview.prioritizedAssets.length }} assets</span>
      </div>

      <div v-if="overview.prioritizedAssets.length === 0" class="empty-state" role="status">
        <span class="empty-state-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16.5 9" />
          </svg>
        </span>
        <div>
          <h3>No assets currently require attention in {{ overview.activeRegion.name }}</h3>
          <p>
            No Critical, High, or Moderate priorities match the current view.
            Reset filters to review all operating regions.
          </p>
        </div>
        <button class="secondary-button" type="button" @click="resetFilters">
          Reset filters
        </button>
      </div>

      <div v-else class="table-wrap">
        <table class="priority-table">
          <caption class="visually-hidden">
            Assets requiring attention for {{ overview.activeRegion.name }} and {{ overview.activePeriod.label }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Asset</th>
              <th scope="col">Priority</th>
              <th scope="col">Operating status</th>
              <th scope="col">Production variance</th>
              <th scope="col">Work status</th>
              <th scope="col">Primary reason</th>
              <th scope="col"><span class="visually-hidden">Asset detail</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in overview.prioritizedAssets" :key="asset.assetId">
              <th scope="row" class="asset-cell">
                <RouterLink class="asset-link" :to="{ name: 'asset-detail', params: { assetId: asset.assetId } }">
                  {{ asset.assetName }}
                </RouterLink>
                <span class="asset-region">{{ asset.regionName }} · {{ asset.assetId }}</span>
              </th>
              <td>
                <span class="priority-badge" :class="priorityClass(asset.priorityLevel)">
                  <span class="badge-dot" aria-hidden="true"></span>
                  {{ asset.priorityLevel }}
                </span>
              </td>
              <td>
                <span class="table-status" :class="operatingStatusClass(asset.operatingStatus)">
                  <span class="table-status-mark" aria-hidden="true"></span>
                  {{ asset.operatingStatus }}
                </span>
              </td>
              <td>
                <span :class="{ 'variance-negative': asset.variancePercent !== null && asset.variancePercent < 0, 'variance-positive': asset.variancePercent !== null && asset.variancePercent >= 0 }">
                  {{ formatVariance(asset.variancePercent) }}
                </span>
              </td>
              <td>
                <span class="work-status" :class="workStatusClass(asset.workOrderStatus)">
                  <span class="work-status-mark" aria-hidden="true"></span>
                  {{ asset.workOrderStatus }}
                </span>
              </td>
              <td class="reason-cell">{{ asset.primaryReason }}</td>
              <td class="detail-cell">
                <RouterLink
                  class="detail-link"
                  :to="{ name: 'asset-detail', params: { assetId: asset.assetId } }"
                  :aria-label="`View ${asset.assetName} asset detail`"
                >
                  View
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="priority-footnote">
        Priority is rules-based and explainable. Missing telemetry is not treated as zero production.
      </p>
    </section>
  </div>
</template>
