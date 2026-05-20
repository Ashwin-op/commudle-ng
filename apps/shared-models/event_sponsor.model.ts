import { ISponsor } from './sponsor.model';

export interface IEventSponsor {
  id: number;
  sponsor: ISponsor;
  event_id: number;
  tier_name?: string;
  tier_priority?: number;
}

export interface IEventSponsorGroupedByTierName {
  tier_name: IEventSponsor[];
}
