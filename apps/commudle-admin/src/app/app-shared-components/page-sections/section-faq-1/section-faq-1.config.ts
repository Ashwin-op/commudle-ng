import { IFaq } from '@commudle/shared-models';

/**
 * Config for `commudle-section-faq-1` — a two-column FAQ band: an intro rail
 * on the left (eyebrow, heading, supporting line, optional "still have
 * questions" link) and the shared `commudle-faq` accordion on the right.
 *
 * The `commudle-faq` component emits the `FAQPage` JSON-LD for these
 * entries, so nothing extra is needed on the host page for structured data.
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-faq-1",
 *   "config": {
 *     "eyebrow": "FAQ",
 *     "heading": "Frequently Asked Questions",
 *     "subtext": "Everything you need to know about running a Vibeathon Challenge.",
 *     "helpText": "Still have questions? We’re here to help.",
 *     "helpCta": { "label": "Contact us", "routerLink": "/contact-us" },
 *     "faqs": [{ "question": "…", "answer": "…" }]
 *   }
 * }
 * ```
 */
export interface IFaq1Config {
  eyebrow?: string;
  heading?: string;
  subtext?: string;
  helpText?: string;
  helpCta?: { label: string; routerLink: string };
  faqs: IFaq[];
  /**
   * Optional fragment id for a deep link to this section (e.g. `faq`). When
   * set: rendered as the section root's `id`, and a hover-reveal `#`
   * permalink is added next to the heading. See
   * `.november/rules/section-fragment-links.md`. Ignored if `heading` is unset.
   */
  fragmentId?: string;
}
