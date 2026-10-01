/**
 * Config for `commudle-section-hero-9` — light two-column hero with a photo
 * and an optional "watch video" secondary CTA.
 *
 * Left column: optional pill badge, a two-line heading (accent word(s) via an
 * HTML `<span>` in `headingLine2`), a subtitle, a primary CTA and an optional
 * video CTA that opens the video in an `nb-dialog` popup. Right column: a
 * photo in a rounded frame with a soft glow behind it.
 *
 * The primary CTA renders as a `routerLink` when `primaryCta.routerLink` is
 * set; otherwise it renders as a button that emits `primaryCtaClick` so the
 * host page can wire up in-page behaviour (e.g. scroll to a form).
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-hero-9",
 *   "config": {
 *     "badge": "🚀 Create Your Vibeathon Challenge",
 *     "headingLine1": "Launch your challenge.",
 *     "headingLine2": "Inspire <span>builders.</span>",
 *     "subtext": "Create a Vibeathon Challenge on Commudle and invite your community to build, share and compete.",
 *     "primaryCta": { "label": "Create Your Challenge" },
 *     "videoCta": { "label": "Watch a 2-min video", "videoUrl": "https://www.youtube.com/embed/VIDEO_ID" },
 *     "image": { "url": "https://…/hero.jpg", "alt": "Builders collaborating around a laptop" },
 *     "floatingAccents": [
 *       { "icon": "code", "label": "Build" },
 *       { "icon": "users", "label": "Collaborate" },
 *       { "icon": "rocket" },
 *       { "icon": "trophy" }
 *     ]
 *   }
 * }
 * ```
 */
import { SectionIconKey } from '../shared/section-icons';

export interface IHero9FloatingAccent {
  /** Icon key resolved through `SECTION_ICON_MAP`. */
  icon: SectionIconKey | string;
  /** Optional label — present renders a pill chip (icon + text); absent renders an icon-only badge. */
  label?: string;
}

export interface IHero9Config {
  /** Optional pill badge rendered above the heading. Emoji prefix supported. */
  badge?: string;

  /** First heading line — plain text. */
  headingLine1: string;

  /**
   * Second heading line — HTML supported. Wrap accent word(s) in a `<span>`
   * to render them in the primary accent colour.
   */
  headingLine2: string;

  /** Supporting subtitle — plain text. */
  subtext: string;

  /**
   * Primary CTA. Provide `routerLink` to navigate, or omit it to have the
   * button emit `primaryCtaClick` instead (for in-page actions).
   */
  primaryCta: { label: string; routerLink?: string; queryParams?: Record<string, string | number | boolean> };

  /** Optional secondary CTA that opens `videoUrl` in an nb-dialog popup. */
  videoCta?: { label: string; videoUrl: string };

  /** Optional hero photo for the right column. */
  image?: { url: string; alt: string };

  /**
   * Optional floating icon/text accents around the photo — up to 4, cycling
   * through 4 preset corner positions by index. Purely decorative
   * (`aria-hidden`), hidden below `lg`, and only rendered when `image` is
   * also set. Each one gently floats via GSAP — see the component.
   */
  floatingAccents?: IHero9FloatingAccent[];
}
