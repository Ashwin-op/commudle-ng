/**
 * Config for `commudle-section-feature-grid-2` — icon feature grid.
 *
 * A white-background responsive card grid (1 / 2 / 3 columns) where each
 * card carries an icon, a title, and a short description. Distinct from
 * `feature-grid-1`, which has no icon support. Suitable for "what you get"
 * / "who it's for" style sections on public/display pages.
 *
 * `icon` is a short key resolved through the component's internal icon
 * lookup (see `ICON_MAP` in the component) — not a raw icon object — so
 * the config stays plain content with no Angular/FontAwesome imports.
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-feature-grid-2",
 *   "config": {
 *     "eyebrow": "WHAT YOU GET",
 *     "heading": "Everything a challenge needs",
 *     "subtext": "No setup, no infrastructure.",
 *     "items": [
 *       { "icon": "link", "title": "Shareable link & QR", "description": "One link to collect submissions." }
 *     ]
 *   }
 * }
 * ```
 */
import { SectionIconKey } from '../shared/section-icons';

export interface IFeatureGrid2Item {
  /** Icon key resolved through `SECTION_ICON_MAP`. Falls back to a dot when unknown. */
  icon: SectionIconKey | string;
  title: string;
  description: string;
}

export interface IFeatureGrid2Config {
  /** Optional uppercase eyebrow above the heading. */
  eyebrow?: string;
  /** Optional section heading. */
  heading?: string;
  /** Optional supporting line below the heading. */
  subtext?: string;
  items: IFeatureGrid2Item[];
  /**
   * Optional fragment id for a deep link to this section (e.g. `what-you-get`).
   * When set: rendered as the section root's `id`, and a hover-reveal `#`
   * permalink is added next to the heading. See
   * `.november/rules/section-fragment-links.md`. Ignored if `heading` is unset.
   */
  fragmentId?: string;
}
