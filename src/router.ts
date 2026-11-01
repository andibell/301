import { createRouter, createWebHistory } from "vue-router";
import OperationsOverview from "./views/OperationsOverview.vue";
import AssetDetailPreview from "./views/AssetDetailPreview.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "overview",
      component: OperationsOverview,
    },
    {
      path: "/assets/:assetId",
      name: "asset-detail",
      component: AssetDetailPreview,
      props: true,
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      redirect: { name: "overview" },
    },
  ],
});

export default router;
