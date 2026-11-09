import { IChannelCategory } from './channel-category.model';
import { ICommunityChannel } from './community-channel.model';

/**
 * A forum is a CommunityChannel with display_type 'forum'.
 *
 * `latest_message` is inherited from ICommunityChannel. The forums API populates it
 * with a preview of the most recent thread (id, subject, content, slug, created_at),
 * not a full user message.
 */
/** Ordering options supported by the forums index endpoint */
export enum EForumSort {
  /** Newest forum first */
  LATEST = 'latest',
  /** Most recently replied-to first */
  ACTIVITY = 'activity',
}

export interface IForum extends ICommunityChannel {
  /** Null when the forum has no category assigned */
  channel_category: IChannelCategory;
  total_discussions: number;
  total_replies: number;
  /**
   * Newest activity including replies, and the value EForumSort.ACTIVITY orders by.
   * Null when nothing has been posted yet.
   */
  last_activity_at?: string;
}
