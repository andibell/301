export type RegionId = string;
export type PeriodId = "today" | "last7Days" | "last30Days";
export type PriorityLevel = "Critical" | "High" | "Moderate" | "Stable";

export interface ProductionResult {
  production: number;
  target: number;
  attainmentPercent: number | null;
  complete: boolean;
  missingSamples: number;
  unit: string;
}

export interface PrioritizedAsset {
  assetId: string;
  assetName: string;
  regionId: string;
  regionName: string;
  priorityLevel: PriorityLevel;
  priorityScore: number;
  priorityReasons: string[];
  primaryReason: string;
  operatingStatus: "online" | "offline" | "restricted";
  production: number;
  target: number;
  productionComplete: boolean;
  variancePercent: number | null;
  workOrderStatus: string;
  workOrderId: string | null;
}

export interface OverviewResult {
  activeRegion: { regionId: string; name: string };
  activePeriod: { periodId: PeriodId; label: string; days: number; assetField: string };
  production: ProductionResult;
  totalAssets: number;
  offlineAssets: number;
  assetsRequiringAttention: number;
  criticalAssets: number;
  highPriorityAssets: number;
  openWorkOrders: Array<Record<string, unknown>>;
  criticalHighWorkOrders: number;
  availableCrews: Array<Record<string, unknown>>;
  regionalSummaries: Array<{
    regionId: string;
    name: string;
    production: number;
    target: number;
    attainmentPercent: number | null;
    complete: boolean;
    totalAssets: number;
    offlineAssets: number;
    assetsRequiringAttention: number;
    criticalAssets: number;
    highPriorityAssets: number;
    openWorkOrders: number;
    criticalHighWorkOrders: number;
    availableCrews: number;
    operationalStatus: string;
  }>;
  changeSummary: {
    headline: string;
    detail: string;
    regionId: string | null;
    productionGap: number;
    priorityContext: string;
    exceptionContext: string;
    incompleteTelemetry: boolean;
  };
  prioritizedAssets: PrioritizedAsset[];
}

export const ALL_REGIONS: "all";
export const OPEN_WORK_ORDER_STATUSES: Set<string>;
export const WORK_ORDER_STATUS_LABELS: Record<string, string>;
export const overviewData: {
  metadata: { asOfTimestamp: string; productionUnit: string };
  regions: Array<{ regionId: string; name: string }>;
};
export const PERIODS: Record<PeriodId, { label: string; days: number; assetField: string }>;
export function getActiveRegion(regionId?: string): { regionId: string; name: string };
export function getActivePeriod(periodId?: PeriodId): { periodId: PeriodId; label: string; days: number; assetField: string };
export function calculateProduction(assets: unknown[], periodId?: PeriodId): ProductionResult;
export function deriveAssetPriority(asset: Record<string, unknown>): {
  priorityScore: number;
  priorityLevel: PriorityLevel;
  priorityReasons: string[];
};
export function selectOverview(data?: unknown, regionId?: string, periodId?: PeriodId): OverviewResult;
export function selectPrioritizedAssets(data?: unknown, regionId?: string, periodId?: PeriodId): PrioritizedAsset[];
