import { SectionIconKey } from '../shared/section-icons';

/**
 * Config for `commudle-section-steps-1` — a numbered "how it works" band.
 * Renders each step as a card with a number badge, an icon, a title and a
 * short description, laid out in a responsive 1 / 2 / N-column grid with a
 * subtle connector line on large screens.
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-steps-1",
 *   "config": {
 *     "eyebrow": "HOW IT WORKS",
 *     "heading": "From idea to winners in four steps",
 *     "steps": [
 *       { "icon": "tag", "title": "Name your challenge", "text": "Pick a memorable name." }
 *     ]
 *   }
 * }
 * ```
 */
export interface ISteps1Item {
  /** Icon key resolved through `SECTION_ICON_MAP`. */
  icon: SectionIconKey | string;
  title: string;
  text: string;
  /** Optional illustration shown above the icon/title/text. Omit for the plain icon-only card. */
  image?: { url: string; alt: string };
}

export interface ISteps1Config {
  eyebrow?: string;
  heading?: string;
  subtext?: string;
  steps: ISteps1Item[];
  /**
   * Optional fragment id for a deep link to this section (e.g. `how-it-works`).
   * When set: rendered as the section root's `id`, and a hover-reveal `#`
   * permalink is added next to the heading. See
   * `.november/rules/section-fragment-links.md`. Ignored if `heading` is unset.
   */
  fragmentId?: string;
}
