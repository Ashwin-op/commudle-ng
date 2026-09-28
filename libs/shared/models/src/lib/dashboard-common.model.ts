export interface IDashboardDistributionItem {
  name: string;
  count: number;
  percentage: number;
}

// Live Traffic
export interface IDashboardLiveVisitors {
  live_count: number;
  last_30_min_count: number;
}

// Live Traffic
export interface IDashboardTopPage {
  url: string;
  page_title: string;
  views: number;
}

export interface IDashboardMetricWithGrowth {
  value: number;
  growth_percent: number;
}

export interface IDashboardCountWithGrowth {
  count: number;
  growth: number;
}
