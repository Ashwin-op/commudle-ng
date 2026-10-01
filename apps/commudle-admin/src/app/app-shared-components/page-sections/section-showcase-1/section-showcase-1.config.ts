/**
 * Config for `commudle-section-showcase-1` — a warm "see it in action" band:
 * a heading + intro on the left, a row of stats, a set of link chips
 * (e.g. past campaigns) and one or two CTAs.
 *
 * Rendered on a static cream surface, so all text uses theme-stable tokens.
 *
 * Sample config:
 * ```json
 * {
 *   "type": "commudle-section-showcase-1",
 *   "config": {
 *     "heading": "See what people are building",
 *     "subtext": "Communities, companies and creators run challenges all over the world.",
 *     "stats": [{ "value": "600,000+", "label": "Community members" }],
 *     "chipsLabel": "Past challenges",
 *     "chips": [{ "label": "VibeCheck", "routerLink": "/builds", "queryParams": { "campaign": "vibecheck" } }],
 *     "primaryCta": { "label": "Browse all builds", "routerLink": "/builds" },
 *     "secondaryCta": { "label": "Submit a build", "routerLink": "/builds/create" }
 *   }
 * }
 * ```
 */
export interface IShowcase1Stat {
  value: string;
  label: string;
}

export interface IShowcase1Chip {
  label: string;
  routerLink: string;
  queryParams?: Record<string, string | number | boolean>;
}

export interface IShowcase1Cta {
  label: string;
  /** Provide to navigate; omit to have the button emit `primaryCtaClick` instead (for in-page actions). */
  routerLink?: string;
  queryParams?: Record<string, string | number | boolean>;
}

/**
 * One logo slot in the brand strip, shown right under the intro text.
 * Omit `url` to render an empty, dashed-outline placeholder tile — use
 * this to reserve a spot for a logo that hasn't been supplied yet, without
 * fabricating a name/brand that isn't confirmed. Provide `routerLink` (and
 * optional `queryParams`) to make the logo a link — e.g. to that brand's
 * own Vibeathon Challenge submissions/gallery page.
 */
export interface IShowcase1Logo {
  /** Company/brand name — required once `url` is set (used as alt text); optional for a bare placeholder. */
  name?: string;
  /** Logo image URL. Omit for a placeholder tile. */
  url?: string;
  /**
   * Set when the logo itself is white/light-coloured and disappears on the
   * strip's default white tile — renders that one tile on a static dark
   * background instead so the logo stays visible regardless of the logo's
   * own colour.
   */
  dark?: boolean;
  /** Optional link target — e.g. that brand's Vibeathon gallery (`/builds?campaign=...`). Ignored for a placeholder tile. */
  routerLink?: string;
  queryParams?: Record<string, string | number | boolean>;
}

export interface IShowcase1Config {
  heading: string;
  subtext?: string;
  stats?: IShowcase1Stat[];
  chipsLabel?: string;
  chips?: IShowcase1Chip[];
  primaryCta: IShowcase1Cta;
  secondaryCta?: IShowcase1Cta;
  /** Optional label above the logo strip, e.g. "Built with". */
  logosLabel?: string;
  /** Optional row of brand logos (or placeholders — see `IShowcase1Logo`), rendered under `subtext`. */
  logos?: IShowcase1Logo[];
  /**
   * Optional fragment id for a deep link to this section (e.g. `see-in-action`).
   * When set: rendered as the section root's `id`, and a hover-reveal `#`
   * permalink is added next to the heading. See
   * `.november/rules/section-fragment-links.md`. Omit to render without one.
   */
  fragmentId?: string;
}
