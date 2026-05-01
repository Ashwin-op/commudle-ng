/**
 * Config for `commudle-section-hero-6` — builds-page campaign hero.
 *
 * Replaces the standard builds page hero whenever a campaign is active.
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-hero-6",
 *   "config": {
 *     "campaignName": "Build Challenge 2026",
 *     "heading": "Build. Compete. <span>Win.</span>",
 *     "subtext": "Submit your best project across AI, Web, Mobile and Design. Top builds win prizes and recognition.",
 *     "cta": { "label": "Submit your build", "routerLink": "/builds/new" },
 *     "submissionCount": 142
 *   }
 * }
 * ```
 */
export interface IHero6Config {
  /** Pill badge above the heading — e.g. "Build Challenge 2026" */
  campaignName: string;
  /** Main headline — HTML markup supported for inline emphasis */
  heading: string;
  /** Supporting subtitle — plain text */
  subtext: string;
  /** Primary CTA button */
  cta: { label: string; routerLink: string; queryParams?: Record<string, string | number | boolean> };
  /** Live submission count shown below the CTA — omit to hide */
  submissionCount?: number;
}
