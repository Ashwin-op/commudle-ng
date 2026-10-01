import { Type } from '@angular/core';
import { SectionHero1Component } from './section-hero-1/section-hero-1.component';
import { SectionHero2Component } from './section-hero-2/section-hero-2.component';
import { SectionHero3Component } from './section-hero-3/section-hero-3.component';
import { SectionHero4Component } from './section-hero-4/section-hero-4.component';
import { SectionHero5Component } from './section-hero-5/section-hero-5.component';
import { SectionHero6Component } from './section-hero-6/section-hero-6.component';
import { SectionHero7Component } from './section-hero-7/section-hero-7.component';
import { SectionHero8Component } from './section-hero-8/section-hero-8.component';
import { SectionHero9Component } from './section-hero-9/section-hero-9.component';
import { SectionFeatureGrid1Component } from './section-feature-grid-1/section-feature-grid-1.component';
import { SectionFeatureGrid2Component } from './section-feature-grid-2/section-feature-grid-2.component';
import { SectionFeatureGrid3Component } from './section-feature-grid-3/section-feature-grid-3.component';
import { SectionIntroHighlights1Component } from './section-intro-highlights-1/section-intro-highlights-1.component';
import { SectionSteps1Component } from './section-steps-1/section-steps-1.component';
import { SectionShowcase1Component } from './section-showcase-1/section-showcase-1.component';
import { SectionFaq1Component } from './section-faq-1/section-faq-1.component';
import { SectionCta1Component } from './section-cta-1/section-cta-1.component';

export const SECTION_TYPES = {
  HERO_1: 'commudle-section-hero-1',
  HERO_2: 'commudle-section-hero-2',
  HERO_3: 'commudle-section-hero-3',
  HERO_4: 'commudle-section-hero-4',
  HERO_5: 'commudle-section-hero-5',
  HERO_6: 'commudle-section-hero-6',
  HERO_7: 'commudle-section-hero-7',
  HERO_8: 'commudle-section-hero-8',
  HERO_9: 'commudle-section-hero-9',
  FEATURE_GRID_1: 'commudle-section-feature-grid-1',
  FEATURE_GRID_2: 'commudle-section-feature-grid-2',
  FEATURE_GRID_3: 'commudle-section-feature-grid-3',
  INTRO_HIGHLIGHTS_1: 'commudle-section-intro-highlights-1',
  STEPS_1: 'commudle-section-steps-1',
  SHOWCASE_1: 'commudle-section-showcase-1',
  FAQ_1: 'commudle-section-faq-1',
  CTA_1: 'commudle-section-cta-1',
} as const;

export type SectionType = (typeof SECTION_TYPES)[keyof typeof SECTION_TYPES];

export const SECTION_COMPONENT_MAP: Partial<Record<SectionType, Type<any>>> = {
  [SECTION_TYPES.HERO_1]: SectionHero1Component,
  [SECTION_TYPES.HERO_2]: SectionHero2Component,
  [SECTION_TYPES.HERO_3]: SectionHero3Component,
  [SECTION_TYPES.HERO_4]: SectionHero4Component,
  [SECTION_TYPES.HERO_5]: SectionHero5Component,
  [SECTION_TYPES.HERO_6]: SectionHero6Component,
  [SECTION_TYPES.HERO_7]: SectionHero7Component,
  [SECTION_TYPES.HERO_8]: SectionHero8Component,
  [SECTION_TYPES.HERO_9]: SectionHero9Component,
  [SECTION_TYPES.FEATURE_GRID_1]: SectionFeatureGrid1Component,
  [SECTION_TYPES.FEATURE_GRID_2]: SectionFeatureGrid2Component,
  [SECTION_TYPES.FEATURE_GRID_3]: SectionFeatureGrid3Component,
  [SECTION_TYPES.INTRO_HIGHLIGHTS_1]: SectionIntroHighlights1Component,
  [SECTION_TYPES.STEPS_1]: SectionSteps1Component,
  [SECTION_TYPES.SHOWCASE_1]: SectionShowcase1Component,
  [SECTION_TYPES.FAQ_1]: SectionFaq1Component,
  [SECTION_TYPES.CTA_1]: SectionCta1Component,
};
