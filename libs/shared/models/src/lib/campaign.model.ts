import { IUser } from './user.model';
import { ICampaignType } from './campaign-type.model';
import { ICampaignAsset } from './campaign-asset.model';
import { IPurchaseOrder } from './purchase-order.model';
import { INote } from './note.model';
import { ICampaignStats } from './campaign-stats.model';

// a paid wallet top-up that funded the campaign, it carries the tax invoice
export interface ICampaignTopUp {
  purchase_order_uuid: string;
  invoice_number: string;
  currency: string;
  // minor units
  amount_paid: number;
  tax_amount: number;
  total_credited: number;
  paid_at: string;
}

export interface ICampaign {
  id: string;
  name: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  start_time: Date;
  end_time: Date;
  start_date: Date;
  end_date: Date;
  budget: number;
  currency_type: string;
  campaign_type_id: number;
  created_at: Date;
  updated_at: Date;
  tags: string[];
  main_newsletter_id: number;
  start_at: string;
  end_at: string;
  status: ECampaignStatus;
  locations: [];
  communities: [];
  user: IUser;
  campaign_type: ICampaignType;
  campaign_assets: ICampaignAsset[];
  purchase_order?: IPurchaseOrder;
  unapproved_reasons?: INote[];
  cta_label?: string;
  statsOverview?: ICampaignStats;
  top_ups?: ICampaignTopUp[];
}

export enum ECampaignStatus {
  // INCOMPLETE = 'incomplete',
  // SUBMITTED = 'submitted',
  DRAFT = 'draft',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUIRED = 'changes_required',
  LIVE = 'live',
  COMPLETE = 'complete',
  PENDING_PAYMENT = 'pending_payment',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  RESUMED = 'resumed',
}

export interface ICampaignChangeLogEntry {
  item_type: 'Campaign' | 'CampaignAsset';
  item_id: number;
  field: string;
  old_value: string | boolean | null;
  new_value: string | boolean | null;
  changed_at: string;
  changed_by: string;
  changed_by_name?: string;
  changed_by_username?: string;
}
