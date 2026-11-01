<script setup lang="ts">
import { computed, onBeforeUnmount, watchEffect } from "vue";
import { RouterLink } from "vue-router";
import assets from "../data/assets.json";
import crews from "../data/crews.json";
import events from "../data/events.json";
import metadata from "../data/metadata.json";
import regions from "../data/regions.json";
import workOrders from "../data/workOrders.json";
import {
  OPEN_WORK_ORDER_STATUSES,
  WORK_ORDER_STATUS_LABELS,
  deriveAssetPriority,
} from "../domain/overview.mjs";

const props = defineProps<{ assetId: string }>();

const asset = computed(() => assets.find((record) => record.assetId === props.assetId));
const region = computed(
  () => regions.find((record) => record.regionId === asset.value?.regionId),
);
const priority = computed(
  () => asset.value ? deriveAssetPriority(asset.value) : null,
);
const workOrder = computed(() => {
  const record = asset.value?.openWorkOrderId
    ? workOrders.find((item) => item.workOrderId === asset.value?.openWorkOrderId)
    : undefined;
  return record && OPEN_WORK_ORDER_STATUSES.has(record.status) ? record : undefined;
});
const assignedCrew = computed(() => {
  const crewId = workOrder.value?.assignedCrewId ?? asset.value?.assignedCrewId;
  return crewId ? crews.find((record) => record.crewId === crewId) : undefined;
});
const eligibleCrews = computed(() => {
  if (!asset.value || !workOrder.value || assignedCrew.value) return [];
  return crews.filter((crew) => (
    crew.regionId === asset.value?.regionId
    && crew.skillTypes.includes(workOrder.value?.requiredSkill ?? "")
    && crew.availability === "available"
    && crew.capacityStatus !== "full"
    && crew.currentAssignmentWorkOrderId === null
  ));
});
const assetEvents = computed(() => events
  .filter((event) => event.assetId === props.assetId)
  .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)));

const asOfDate = new Date(metadata.asOfTimestamp);
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});
const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

watchEffect(() => {
  document.title = asset.value
    ? `${asset.value.assetName} | Asset Detail | FieldOps Command`
    : "Asset not found | FieldOps Command";
});

onBeforeUnmount(() => {
  document.title = "FieldOps Command | TerraVale Energy";
});

const inspection = computed(() => {
  if (!asset.value) return null;
  const lastInspection = new Date(`${asset.value.lastInspectionDate}T00:00:00Z`);
  const dueDate = new Date(lastInspection);
  dueDate.setUTCDate(dueDate.getUTCDate() + 30);
  const overdue = asOfDate > dueDate;
  return {
    lastInspection,
    dueDate,
    overdue,
    daysOverdue: overdue
      ? Math.max(1, Math.ceil((asOfDate.getTime() - dueDate.getTime()) / 86_400_000))
      : 0,
  };
});

const production = computed(() => {
  if (!asset.value) return null;
  const actual = asset.value.currentDailyProduction;
  const target = asset.value.targetDailyProduction;
  const available = asset.value.telemetryStatus === "available" && actual !== null;
  const difference = available && actual !== null ? actual - target : null;
  const variancePercent = difference === null ? null : (difference / target) * 100;
  return {
    actual: available ? actual : null,
    target,
    difference,
    variancePercent,
  };
});

const trend = computed(() => {
  if (!asset.value) return null;
  const values = asset.value.productionLast7Days;
  const validReadings = values
    .map((value, index) => ({ value, date: metadata.productionDates.slice(-7)[index] }))
    .filter((reading): reading is { value: number; date: string } => reading.value !== null);
  if (validReadings.length === 0) {
    return { summary: "No recent production readings are available.", readings: 0 };
  }
  const first = validReadings[0];
  const latest = validReadings[validReadings.length - 1];
  const change = latest.value - first.value;
  const direction = change > 0 ? "increased" : change < 0 ? "decreased" : "was unchanged";
  const changeText = change === 0 ? "" : ` by ${numberFormatter.format(Math.abs(change))} units`;
  const currentReadingNote = values[values.length - 1] === null
    ? " The current-day reading is unavailable."
    : "";
  return {
    readings: validReadings.length,
    summary: `${direction}${changeText} from ${numberFormatter.format(first.value)} on ${dateFormatter.format(new Date(`${first.date}T00:00:00Z`))} to ${numberFormatter.format(latest.value)} on ${dateFormatter.format(new Date(`${latest.date}T00:00:00Z`))}.${currentReadingNote}`,
  };
});

function formatNumber(value: number | null | undefined) {
  return value === null || value === undefined ? "Unknown" : numberFormatter.format(value);
}

function formatVariance(difference: number | null, percent: number | null) {
  if (difference === null || percent === null) return "Unavailable";
  if (difference === 0) return "On target";
  const relation = difference > 0 ? "above target" : "below target";
  return `${numberFormatter.format(Math.abs(difference))} units (${numberFormatter.format(Math.abs(percent))}%) ${relation}`;
}

function formatStatus(status: string) {
  const formatted = status.replace(/([a-z])([A-Z])/g, "$1 $2");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function reasonEvidence(reason: string) {
  if (!asset.value || !production.value || !inspection.value) return "";
  const record = asset.value;
  if (reason.includes("safety risk")) {
    return `Recorded safety risk: ${formatStatus(record.safetyRiskLevel)}.`;
  }
  if (reason.includes("Production is")) {
    return `Current production is ${formatNumber(production.value.actual)} of ${formatNumber(production.value.target)} units per day.`;
  }
  if (reason.includes("offline")) {
    return `Operating status: ${formatStatus(record.operatingStatus)}; downtime: ${numberFormatter.format(record.downtimeHours)} hours.`;
  }
  if (reason.includes("Downtime")) {
    return `${numberFormatter.format(record.downtimeHours)} hours of current downtime.`;
  }
  if (reason.includes("Inspection")) {
    return `Last inspection: ${dateFormatter.format(inspection.value.lastInspection)}.`;
  }
  if (reason.includes("work order")) {
    return workOrder.value
      ? `${workOrder.value.workOrderId}, ${workOrder.value.severity} severity, ${workOrder.value.ageHours} hours old.`
      : "";
  }
  if (reason.includes("Telemetry")) {
    return `Telemetry status: ${formatStatus(record.telemetryStatus)}; current production is not treated as zero.`;
  }
  return "";
}

const interventionCue = computed(() => {
  if (!asset.value) return "";
  if (assignedCrew.value && workOrder.value) {
    return `Work is already assigned to ${assignedCrew.value.crewName}.`;
  }
  if (workOrder.value && eligibleCrews.value.length > 0) {
    return workOrder.value.status === "acknowledged"
      ? "The issue is acknowledged; work remains unassigned and an eligible crew is available."
      : "This asset has unassigned work requiring intervention. An eligible crew is available.";
  }
  if (workOrder.value) {
    return workOrder.value.status === "acknowledged"
      ? "The issue is acknowledged, but no eligible crew is currently available."
      : "This asset has unassigned work, but no eligible crew is currently available.";
  }
  return "No open work currently requires assignment.";
});

const statusClass = computed(() => {
  if (!asset.value) return "";
  return {
    "detail-status-critical": asset.value.priorityLevel === "Critical",
    "detail-status-attention": asset.value.priorityLevel === "High"
      || asset.value.priorityLevel === "Moderate",
    "detail-status-stable": asset.value.priorityLevel === "Stable",
  };
});
</script>

<template>
  <div class="asset-detail">
    <RouterLink class="back-link" :to="{ name: 'overview' }">
      <span aria-hidden="true">←</span> Back to Operations Overview
    </RouterLink>

    <template v-if="asset && priority && production && inspection && trend">
      <header class="detail-identity">
        <div class="detail-identity-heading">
          <p class="eyebrow">Asset Detail <span aria-hidden="true">·</span> {{ region?.name }}</p>
          <h1 id="asset-detail-title">{{ asset.assetName }}</h1>
          <p class="detail-asset-id">{{ asset.assetId }} <span aria-hidden="true">·</span> {{ region?.name }}</p>
        </div>
        <div class="detail-statuses" aria-label="Current asset status">
          <span class="detail-status" :class="`detail-operating-${asset.operatingStatus}`">
            {{ formatStatus(asset.operatingStatus) }}
          </span>
          <span class="detail-status" :class="statusClass">{{ asset.priorityLevel }} priority</span>
          <span v-if="assignedCrew" class="detail-status detail-status-assigned">
            Assigned to {{ assignedCrew.crewName }}
          </span>
          <span v-else-if="workOrder" class="detail-status detail-status-unassigned">Work unassigned</span>
        </div>
        <p class="detail-as-of">Snapshot as of {{ dateFormatter.format(asOfDate) }} UTC</p>
      </header>

      <section
        class="detail-section priority-explanation"
        :class="{ 'priority-explanation-critical': asset.priorityLevel === 'Critical' }"
        aria-labelledby="priority-explanation-heading"
      >
        <div class="detail-section-heading">
          <div>
            <p class="eyebrow">Priority explanation</p>
            <h2 id="priority-explanation-heading">Why this asset is prioritized</h2>
          </div>
          <span class="detail-priority-level" :class="statusClass">{{ asset.priorityLevel }}</span>
        </div>
        <ul class="priority-reasons">
          <li v-for="reason in priority.priorityReasons" :key="reason">
            <span class="priority-reason-text">
              {{ reason === "No current priority conditions met." ? "No current priority conditions." : reason }}
            </span>
            <span v-if="reasonEvidence(reason)" class="priority-reason-evidence">{{ reasonEvidence(reason) }}</span>
          </li>
        </ul>
      </section>

      <section class="detail-section evidence-section" aria-labelledby="evidence-heading">
        <div class="detail-section-heading">
          <div>
            <p class="eyebrow">Supporting evidence</p>
            <h2 id="evidence-heading">Production and condition</h2>
          </div>
          <span class="telemetry-label" :class="`telemetry-${asset.telemetryStatus}`">
            Telemetry {{ formatStatus(asset.telemetryStatus) }}
          </span>
        </div>
        <p v-if="asset.telemetryStatus !== 'available'" class="telemetry-warning" role="status">
          Current telemetry is {{ asset.telemetryStatus }}. Production is unknown, not zero; operating status remains {{ formatStatus(asset.operatingStatus) }}.
        </p>
        <dl class="evidence-grid">
          <div class="evidence-production">
            <dt>Production today / target</dt>
            <dd>
              <span v-if="production.actual !== null">
                {{ formatNumber(production.actual) }} / {{ formatNumber(production.target) }}
                <span class="evidence-unit">units per day</span>
              </span>
              <span v-else>Unknown / {{ formatNumber(production.target) }} units per day</span>
            </dd>
          </div>
          <div>
            <dt>Variance</dt>
            <dd>{{ formatVariance(production.difference, production.variancePercent) }}</dd>
          </div>
          <div class="evidence-trend">
            <dt>Recent production trend</dt>
            <dd>
              {{ trend.summary }}
              <span class="evidence-supporting">{{ trend.readings }} of 7 daily readings available</span>
            </dd>
          </div>
          <div>
            <dt>Downtime</dt>
            <dd>{{ numberFormatter.format(asset.downtimeHours) }} hours</dd>
          </div>
          <div>
            <dt>Equipment health</dt>
            <dd>{{ formatStatus(asset.equipmentHealthStatus) }}</dd>
          </div>
          <div>
            <dt>Safety risk</dt>
            <dd>{{ formatStatus(asset.safetyRiskLevel) }}</dd>
          </div>
          <div>
            <dt>Last inspection</dt>
            <dd>{{ dateFormatter.format(inspection.lastInspection) }}</dd>
          </div>
          <div>
            <dt>Inspection status</dt>
            <dd :class="{ 'evidence-attention': inspection.overdue }">
              {{ inspection.overdue ? `Overdue by ${inspection.daysOverdue} days` : `Within 30-day interval · due ${dateFormatter.format(inspection.dueDate)}` }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="detail-section work-section" aria-labelledby="work-heading">
        <div class="detail-section-heading">
          <div>
            <p class="eyebrow">Existing work</p>
            <h2 id="work-heading">Work order and crew</h2>
          </div>
        </div>
        <template v-if="workOrder">
          <dl class="work-order-grid">
            <div><dt>Work order</dt><dd>{{ workOrder.workOrderId }}</dd></div>
            <div><dt>Category</dt><dd>{{ formatStatus(workOrder.category) }}</dd></div>
            <div><dt>Severity</dt><dd :class="{ 'evidence-critical': workOrder.severity === 'critical' }">{{ formatStatus(workOrder.severity) }}</dd></div>
            <div><dt>Status</dt><dd>{{ WORK_ORDER_STATUS_LABELS[workOrder.status] }}</dd></div>
            <div><dt>Opened</dt><dd>{{ dateTimeFormatter.format(new Date(workOrder.openedAt)) }} UTC</dd></div>
            <div><dt>Age</dt><dd>{{ workOrder.ageHours }} hours</dd></div>
            <div><dt>Required skill</dt><dd>{{ formatStatus(workOrder.requiredSkill) }}</dd></div>
            <div><dt>Estimated duration</dt><dd>{{ numberFormatter.format(workOrder.estimatedDurationHours) }} hours</dd></div>
            <div v-if="assignedCrew"><dt>Assigned crew</dt><dd>{{ assignedCrew.crewName }}</dd></div>
          </dl>
          <div v-if="!assignedCrew && eligibleCrews.length > 0" class="eligible-crew">
            <h3>Eligible available crew</h3>
            <ul>
              <li v-for="crew in eligibleCrews" :key="crew.crewId">
                <strong>{{ crew.crewName }}</strong>
                <span>{{ crew.skillTypes.map(formatStatus).join(", ") }} · {{ formatStatus(crew.capacityStatus) }} capacity</span>
              </li>
            </ul>
          </div>
        </template>
        <p v-else class="no-work-state">No open work recorded</p>
      </section>

      <section class="intervention-section" aria-labelledby="intervention-heading">
        <div>
          <p class="eyebrow">Management intervention</p>
          <h2 id="intervention-heading">Decision status</h2>
        </div>
        <p>{{ interventionCue }}</p>
        <span class="intervention-next-step">
          {{ workOrder && !assignedCrew ? "Appropriate next action: assign an eligible crew." : assignedCrew ? "No assignment action is currently required." : "Review condition and priority evidence; no assignment action is available." }}
        </span>
      </section>

      <section class="detail-section activity-section" aria-labelledby="activity-heading">
        <div class="detail-section-heading">
          <div>
            <p class="eyebrow">Recent activity</p>
            <h2 id="activity-heading">Operational events</h2>
          </div>
        </div>
        <ol v-if="assetEvents.length > 0" class="event-list">
          <li v-for="event in assetEvents" :key="event.eventId" class="event-item">
            <time :datetime="event.occurredAt">{{ dateTimeFormatter.format(new Date(event.occurredAt)) }} UTC</time>
            <div>
              <p>{{ event.summary }}</p>
              <span v-if="event.workOrderId || event.crewId" class="event-related">
                <span v-if="event.workOrderId">Work order {{ event.workOrderId }}</span>
                <span v-if="event.workOrderId && event.crewId" aria-hidden="true"> · </span>
                <span v-if="event.crewId">
                  {{ crews.find((crew) => crew.crewId === event.crewId)?.crewName ?? event.crewId }}
                </span>
              </span>
            </div>
          </li>
        </ol>
        <p v-else class="no-events-state">No recent operational events recorded.</p>
      </section>
    </template>

    <section v-else class="asset-not-found" aria-labelledby="asset-not-found-title">
      <p class="eyebrow">Asset Detail</p>
      <h1 id="asset-not-found-title">Asset not found</h1>
      <p>No asset matches {{ assetId }}.</p>
      <RouterLink class="back-link" :to="{ name: 'overview' }">Return to Operations Overview</RouterLink>
    </section>
  </div>
</template>
