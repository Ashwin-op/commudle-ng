import { IChannelCategory } from './channel-category.model';
import { ICommunityChannel } from './community-channel.model';

/**
 * A forum is a CommunityChannel with display_type 'forum'.
 *
 * `latest_message` is inherited from ICommunityChannel. The forums API populates it
 * with a preview of the most recent thread (id, subject, content, slug, created_at),
 * not a full user message.
 */
export interface IForum extends ICommunityChannel {
  /** Null when the forum has no category assigned */
  channel_category: IChannelCategory;
  total_discussions: number;
  total_replies: number;
}
