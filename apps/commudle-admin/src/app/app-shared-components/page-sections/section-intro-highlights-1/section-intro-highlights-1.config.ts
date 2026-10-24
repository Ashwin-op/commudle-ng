import { SectionIconKey } from '../shared/section-icons';

/**
 * Config for `commudle-section-intro-highlights-1` — a two-column intro band:
 * a heading + explanatory paragraph on the left, and a short list of icon
 * highlights on the right. Good for a "What is X?" style section.
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-intro-highlights-1",
 *   "config": {
 *     "heading": "What is a Vibeathon Challenge?",
 *     "body": "A lightweight build competition you run with your community…",
 *     "highlights": [
 *       { "icon": "bolt", "title": "Set up in seconds", "text": "Just name your challenge." }
 *     ]
 *   }
 * }
 * ```
 */
export interface IIntroHighlights1Item {
  /** Icon key resolved through `SECTION_ICON_MAP`. */
  icon: SectionIconKey | string;
  title: string;
  text: string;
}

export interface IIntroHighlights1Config {
  heading: string;
  body: string;
  highlights: IIntroHighlights1Item[];
  /**
   * Optional fragment id for a deep link to this section (e.g. `what-is`).
   * When set: rendered as the section root's `id`, and a hover-reveal `#`
   * permalink is added next to the heading. See
   * `.november/rules/section-fragment-links.md`. Omit to render without one.
   */
  fragmentId?: string;
}
