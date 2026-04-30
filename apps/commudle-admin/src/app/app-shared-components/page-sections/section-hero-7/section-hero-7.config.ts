/**
 * Config for `commudle-section-hero-7` — campaign build-submission page header.
 *
 * Sits above the build submission form. Shares the same visual language as
 * section-hero-6 (dark background, amber glow) to maintain campaign continuity.
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-hero-7",
 *   "config": {
 *     "campaignName": "Build Challenge 2026",
 *     "heading": "Tell us what you <span>built.</span>",
 *     "subtext": "Fill in the details below and submit your project. The community is waiting to see what you've created."
 *   }
 * }
 * ```
 */
export interface IHero7Config {
  /** Blinking amber badge above the heading — matches hero-6 campaign badge */
  campaignName: string;
  /** Main headline — HTML markup supported for inline accent */
  heading: string;
  /** Supporting subtitle — plain text */
  subtext: string;
}
