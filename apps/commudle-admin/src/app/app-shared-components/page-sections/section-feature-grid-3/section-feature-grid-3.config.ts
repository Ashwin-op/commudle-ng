import { SectionIconKey } from '../shared/section-icons';

/**
 * Config for `commudle-section-feature-grid-3` — an image card grid. Each card
 * shows an optional photo at the top, an icon badge, a title and a
 * description. Distinct from `feature-grid-2` (icon only, no image).
 *
 * When an item has no `image`, the card renders icon-first and still lines up
 * with its neighbours.
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-feature-grid-3",
 *   "config": {
 *     "eyebrow": "WHO IT IS FOR",
 *     "heading": "Who runs Vibeathon Challenges",
 *     "items": [
 *       {
 *         "image": { "url": "https://…/communities.jpg", "alt": "A community meetup" },
 *         "icon": "users",
 *         "title": "Developer communities",
 *         "description": "Give members a reason to build together."
 *       }
 *     ]
 *   }
 * }
 * ```
 */
export interface IFeatureGrid3Item {
  image?: { url: string; alt: string };
  /** Icon key resolved through `SECTION_ICON_MAP`. */
  icon: SectionIconKey | string;
  title: string;
  description: string;
}

export interface IFeatureGrid3Config {
  eyebrow?: string;
  heading?: string;
  subtext?: string;
  items: IFeatureGrid3Item[];
  /**
   * Optional fragment id for a deep link to this section (e.g. `who-its-for`).
   * When set: rendered as the section root's `id`, and a hover-reveal `#`
   * permalink is added next to the heading. See
   * `.november/rules/section-fragment-links.md`. Ignored if `heading` is unset.
   */
  fragmentId?: string;
}
