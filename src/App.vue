<script setup lang="ts">
import { RouterView } from "vue-router";
import { overviewData } from "./domain/overview.mjs";
import terraValeLogo from "./assets/terraval-energy-logo.png";

const operationalDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeZone: "UTC",
}).format(new Date(overviewData.metadata.asOfTimestamp));
</script>

<template>
  <div class="app-frame">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="topbar">
      <RouterLink class="brand-lockup" to="/" aria-label="FieldOps Command Operations Overview">
        <img class="brand-logo" :src="terraValeLogo" alt="TerraVale Energy logo" />
        <span class="product-name">FieldOps Command</span>
      </RouterLink>
      <div class="topbar-context">
        <time :datetime="overviewData.metadata.asOfTimestamp">{{ operationalDate }}</time>
      </div>
    </header>
    <main id="main-content" class="main-content">
      <RouterView />
    </main>
    <footer class="app-footer">
      <span>FieldOps Command</span>
    </footer>
  </div>
</template>
