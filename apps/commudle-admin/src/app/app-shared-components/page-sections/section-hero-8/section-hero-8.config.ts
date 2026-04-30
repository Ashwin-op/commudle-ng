/**
 * Config for `commudle-section-hero-8` — light two-column challenge launch hero.
 *
 * A clean white-background two-column hero with an optional pill badge above
 * a two-line heading (accent word/phrase via HTML span), a subtitle, optional
 * CTA buttons, and a decorative trophy visual on the right column.
 * Intended for campaign/challenge creation or launch pages.
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-hero-8",
 *   "config": {
 *     "badge": "🚀 Create Your Vibeathon Challenge",
 *     "headingLine1": "Launch your challenge.",
 *     "headingLine2": "Inspire <span>builders.</span>",
 *     "subtext": "Create a Vibeathon Challenge on Commudle and invite your community to build, share and compete.",
 *     "primaryCta": { "label": "Get Started", "routerLink": "/builds/create" }
 *   }
 * }
 * ```
 */
export interface IHero8Config {
  /**
   * Optional pill badge rendered above the heading.
   * Supports emoji prefix, e.g. "🚀 Create Your Vibeathon Challenge".
   */
  badge?: string;

  /** First heading line — plain text, rendered in primary body colour. */
  headingLine1: string;

  /**
   * Second heading line — HTML markup supported.
   * Wrap accent word(s) in a `<span>` to render them in primary-600 colour.
   * Example: `"Inspire <span>builders.</span>"`
   */
  headingLine2: string;

  /** Supporting subtitle — plain text. */
  subtext: string;

  /** Optional primary (filled) CTA button. */
  primaryCta?: { label: string; routerLink: string };

  /** Optional secondary (outline) CTA button. */
  secondaryCta?: { label: string; routerLink: string };
}
