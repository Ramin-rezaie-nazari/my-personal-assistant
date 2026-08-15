export type PriceSourceKind = 'web_store' | 'marketplace' | 'retailer' | 'manual';
export type PriceTrend = 'rising' | 'falling' | 'stable' | 'insufficient_data';

export type NormalizedPrice = {
  productKey: string;
  title: string;
  sourceId: string;
  sourceKind: PriceSourceKind;
  url?: string;
  currency: string;
  amount: number;
  unit?: string;
  unitPrice?: number;
  city?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'unknown';
  observedAt: Date;
};

export type PriceSnapshot = NormalizedPrice & {
  snapshotId: string;
};

export type PriceInsight = {
  productKey: string;
  current: number | null;
  average7d: number | null;
  average30d: number | null;
  min30d: number | null;
  max30d: number | null;
  changeVs7d: number | null;
  changeVs30d: number | null;
  trend: PriceTrend;
  buyScore: number;
  recommendation: 'buy_now' | 'wait' | 'watch' | 'unavailable';
};
