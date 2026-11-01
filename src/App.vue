<script setup lang="ts">
import { RouterView } from "vue-router";
import { overviewData } from "./domain/overview.mjs";

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
        <span class="brand-mark" aria-hidden="true">TV</span>
        <span class="brand-copy">
          <span class="company-name">TerraVale Energy</span>
          <span class="product-name">FieldOps Command</span>
        </span>
      </RouterLink>
      <div class="topbar-context">
        <span class="environment-label">Fictional operations</span>
        <time :datetime="overviewData.metadata.asOfTimestamp">{{ operationalDate }}</time>
      </div>
    </header>
    <main id="main-content" class="main-content">
      <RouterView />
    </main>
    <footer class="app-footer">
      <span>FieldOps Command</span>
      <span>All operational records shown are synthetic.</span>
    </footer>
  </div>
</template>
