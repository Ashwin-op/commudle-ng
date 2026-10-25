export interface IMinMaxRange {
  min: number;
  max: number;
}

export interface ICampaignEstimate {
  daily_impressions: IMinMaxRange;
  daily_spend: IMinMaxRange;
  budget: number;
  price_per_impression: number;
  end_date: string | null;
  remaining_days: number | null;
  required_daily_impressions: number | null;
  delivery_status: ECampaignDeliveryStatus;
}

// no_end_date: no pacing verdict is possible, only the daily ranges
export type ECampaignDeliveryStatus = 'deliverable' | 'borderline' | 'undeliverable' | 'no_end_date';
