<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import assets from "../data/assets.json";
import regions from "../data/regions.json";
import workOrders from "../data/workOrders.json";

const props = defineProps<{ assetId: string }>();

const asset = computed(() => assets.find((record) => record.assetId === props.assetId));
const regionName = computed(
  () => regions.find((region) => region.regionId === asset.value?.regionId)?.name,
);
const openWorkOrder = computed(
  () => workOrders.find((order) => order.workOrderId === asset.value?.openWorkOrderId),
);
</script>

<template>
  <section class="asset-preview" aria-labelledby="asset-preview-title">
    <RouterLink class="back-link" :to="{ name: 'overview' }">← Back to Operations Overview</RouterLink>
    <template v-if="asset">
      <p class="eyebrow">Asset detail · {{ regionName }}</p>
      <h1 id="asset-preview-title">{{ asset.assetName }}</h1>
      <p class="page-description">
        {{ asset.assetId }} · {{ asset.operatingStatus }} · {{ asset.priorityLevel }} priority
      </p>
      <section class="preview-panel" aria-labelledby="reasons-title">
        <h2 id="reasons-title">Why this asset is prioritized</h2>
        <ul>
          <li v-for="reason in asset.priorityReasons" :key="reason">{{ reason }}</li>
        </ul>
        <p v-if="openWorkOrder">
          Open work: {{ openWorkOrder.category }} · {{ openWorkOrder.status }} · {{ openWorkOrder.severity }} severity
        </p>
      </section>
      <p class="preview-note">
        This is a focused asset-link destination. The full Asset Detail workflow is a separate implementation increment.
      </p>
    </template>
    <div v-else class="empty-state">
      <div>
        <h2 id="asset-preview-title">Asset not found</h2>
        <p>No fictional asset matches {{ assetId }}.</p>
      </div>
    </div>
  </section>
</template>
