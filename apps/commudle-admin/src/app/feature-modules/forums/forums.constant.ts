import { ILengthBounds } from '@commudle/shared-validators';

/**
 * Character bounds for discussion fields, measured on trimmed input.
 *
 * Shared by the form validators and the character counters so the two can't drift, and
 * by the reply composer so a reply is held to the same body limit as a discussion.
 *
 * These are enforced client-side only — `UserMessage` has no length validation, so a
 * raw websocket frame bypasses them. See
 * `gdgapp/docs/FORUMS_SECURITY_AUDIT.md` finding 3.
 */
export const DISCUSSION_FIELD_LIMITS: Record<'subject' | 'message', ILengthBounds> = {
  subject: { min: 5, max: 120 },
  message: { min: 10, max: 1000 },
};
