/** Minimal channel shape returned as a category's featured channel */
export interface IFeaturedChannel {
  id: number;
  name: string;
  description: string;
}

export interface IChannelCategory {
  id: number;
  name: string;
  slug: string;
  /** Only returned by the category index endpoints */
  channels_count?: number;
  /** Only returned by the category index endpoints, null when the category is empty */
  featured_channel?: IFeaturedChannel;
}
