import { IAttachedFile } from './attached-file.model';

export interface ICampaignAsset {
  id: number;
  headline: string; // the title
  description?: string;
  url: string;
  image: IAttachedFile;
  active?: boolean; // missing means active
}
