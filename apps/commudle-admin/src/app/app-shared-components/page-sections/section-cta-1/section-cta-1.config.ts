/**
 * Config for `commudle-section-cta-1` — a centred closing call-to-action band
 * on a warm cream surface, with a heading, an optional supporting line and up
 * to two CTAs.
 *
 * The primary CTA renders as a `routerLink` when `primaryCta.routerLink` is
 * set; otherwise it renders as a button that emits `primaryCtaClick` so the
 * host page can wire in-page behaviour (e.g. scroll to a form).
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-cta-1",
 *   "config": {
 *     "heading": "Ready to launch your challenge?",
 *     "subtext": "Name it, share it, and watch your community build.",
 *     "primaryCta": { "label": "Create your challenge" },
 *     "secondaryCta": { "label": "Browse all builds", "routerLink": "/builds" }
 *   }
 * }
 * ```
 */
export interface ICta1Button {
  label: string;
  routerLink?: string;
  queryParams?: Record<string, string | number | boolean>;
}

export interface ICta1Config {
  heading: string;
  subtext?: string;
  primaryCta: ICta1Button;
  secondaryCta?: ICta1Button;
  /**
   * Optional fragment id for a deep link to this section (e.g. `get-started`).
   * When set: rendered as the section root's `id`, and a hover-reveal `#`
   * permalink is added next to the heading. See
   * `.november/rules/section-fragment-links.md`. Omit to render without one.
   */
  fragmentId?: string;
}
