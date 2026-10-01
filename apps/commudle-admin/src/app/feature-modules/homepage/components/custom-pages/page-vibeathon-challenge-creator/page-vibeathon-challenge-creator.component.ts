import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import gsap from 'gsap';
import { SeoService } from '@commudle/shared-services';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { NbButtonModule, NbInputModule } from '@commudle/theme';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faGlobe,
  faCloudArrowUp,
  faCopy,
  faCheck,
  faArrowUpRightFromSquare,
  faDownload,
  faLink,
  faHashtag,
} from '@fortawesome/free-solid-svg-icons';
import { generate } from 'lean-qr';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SectionHero9Component } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-hero-9/section-hero-9.component';
import { IHero9Config } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-hero-9/section-hero-9.config';
import { SectionIntroHighlights1Component } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-intro-highlights-1/section-intro-highlights-1.component';
import { IIntroHighlights1Config } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-intro-highlights-1/section-intro-highlights-1.config';
import { SectionSteps1Component } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-steps-1/section-steps-1.component';
import { ISteps1Config } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-steps-1/section-steps-1.config';
import { SectionFeatureGrid2Component } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-feature-grid-2/section-feature-grid-2.component';
import { IFeatureGrid2Config } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-feature-grid-2/section-feature-grid-2.config';
import { SectionFeatureGrid3Component } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-feature-grid-3/section-feature-grid-3.component';
import { IFeatureGrid3Config } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-feature-grid-3/section-feature-grid-3.config';
import { SectionShowcase1Component } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-showcase-1/section-showcase-1.component';
import { IShowcase1Config } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-showcase-1/section-showcase-1.config';
import { SectionFaq1Component } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-faq-1/section-faq-1.component';
import { IFaq1Config } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-faq-1/section-faq-1.config';
import { SectionCta1Component } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-cta-1/section-cta-1.component';
import { ICta1Config } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-cta-1/section-cta-1.config';

/** Production app URL — used to construct the two shareable campaign links. */
const APP_URL = 'https://www.commudle.com';

/** Minimum valid challenge name length (characters). */
const MIN_NAME_LENGTH = 3;

const HERO_VIDEO_URL = 'https://www.youtube.com/embed/822R8DWw0aM';

/** Hero photo — Commudle-hosted static asset (lighter variant). */
const HERO_IMAGE_URL =
  'https://json.commudle.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNWNMQ0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--d0d0e019b138774e0a8876d02645329d46b4a699/com_5c2520d901c45647_20260916125424.jpeg';

/** "How it works" step illustrations — Commudle-hosted static assets, one per step, in order. */
const HOW_IT_WORKS_IMAGES = [
  'https://json.commudle.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBL3NHQ0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--1d2d9d1380494cf5cd9b793977c74b4915aecc91/com_fa3bc07600f58944_20260915150912.png',
  'https://json.commudle.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBL3dHQ0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--892883194efd7152cdcad59a231f8e56fe875405/com_40b375391468031e_20260915150926.png',
  'https://json.commudle.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBLzBHQ0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--9617761cfb7e9a8c0273c5f215d62c0617f86d46/com_c655115a870d2506_20260915150938.png',
  'https://json.commudle.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBLzhHQ0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--abc4af4916b35a57ee272b9187dab76bf7a2bd31/com_85cc637e1eeda60e_20260915150948.png',
] as const;

/** Past-challenge partner logos — Commudle-hosted static assets, for the showcase logo strip. */
const PARTNER_LOGO_URLS = {
  gemini:
    'https://json.commudle.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNE1JQ0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--4a21f1910c632143803f0617ce7419321413e706/com_077bf2f15b5ba47b_20260916021019.png',
  agora:
    'https://json.commudle.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNEVJQ0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--b7c4a05847a9c74af7d3c2b2a69cecb86f5b1044/com_a7e020bf82f55a73_20260916020951.png',
  swytchcode:
    'https://json.commudle.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNElJQ0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--75e3841c24fe6292f05b8df7826df6c5359ca9a5/com_ebd97adfc9cb7c44_20260916021002.png',
} as const;

@Component({
  selector: 'commudle-page-vibeathon-challenge-creator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NbButtonModule,
    NbInputModule,
    FontAwesomeModule,
    SharedComponentsModule,
    SectionHero9Component,
    SectionIntroHighlights1Component,
    SectionSteps1Component,
    SectionFeatureGrid2Component,
    SectionFeatureGrid3Component,
    SectionShowcase1Component,
    SectionFaq1Component,
    SectionCta1Component,
  ],
  templateUrl: './page-vibeathon-challenge-creator.component.html',
  styleUrls: ['./page-vibeathon-challenge-creator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageVibeathonChallengeCreatorComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Hero — photo hero with a "watch video" popup CTA. Primary CTA scrolls to the form. */
  readonly heroConfig: IHero9Config = {
    badge: '🚀 Create Your Vibeathon Challenge',
    headingLine1: 'Launch your challenge.',
    headingLine2: 'Inspire <span>builders.</span>',
    subtext: 'Create a Vibeathon Challenge on Commudle and invite your community to build, share and compete.',
    primaryCta: { label: 'Create Your Challenge' },
    videoCta: { label: 'Watch a 2-min video', videoUrl: HERO_VIDEO_URL },
    image: { url: HERO_IMAGE_URL, alt: 'Builders collaborating around a laptop on Commudle' },
    floatingAccents: [
      { icon: 'code', label: 'Build' },
      { icon: 'users', label: 'Collaborate' },
      { icon: 'rocket' },
      { icon: 'trophy' },
    ],
  };

  /** "What is a Vibeathon Challenge?" intro band. */
  readonly introConfig: IIntroHighlights1Config = {
    heading: 'What is a Vibeathon Challenge?',
    body:
      'A Vibeathon Challenge is a lightweight build competition you run with your community. You pick a theme and a ' +
      'timeframe, share one link, and people submit what they build on Commudle. Everyone can browse the submissions ' +
      'and vote for their favourites — no signup needed to look around.',
    highlights: [
      { icon: 'bolt', title: 'Set up in seconds', text: 'Just name your challenge — there are no forms to configure.' },
      {
        icon: 'shareNodes',
        title: 'One link to share',
        text: 'Plus a downloadable QR code for events, slides and posters.',
      },
      {
        icon: 'globe',
        title: 'Open by default',
        text: 'Submissions and community voting are public and shareable.',
      },
    ],
    fragmentId: 'what-is-a-vibeathon-challenge',
  };

  /** "How it works" — four steps, mirrored into the HowTo JSON-LD in setStructuredData(). */
  readonly howItWorksConfig: ISteps1Config = {
    eyebrow: 'HOW IT WORKS',
    heading: 'From idea to winners in four steps',
    fragmentId: 'how-it-works',
    steps: [
      {
        icon: 'tag',
        title: 'Name your challenge',
        text: 'Pick a memorable name. That is the whole setup.',
        image: { url: HOW_IT_WORKS_IMAGES[0], alt: 'Naming your Vibeathon Challenge' },
      },
      {
        icon: 'shareNodes',
        title: 'Share the link & QR',
        text: 'Drop the submission link in your community, on slides, or on a poster with the QR code.',
        image: { url: HOW_IT_WORKS_IMAGES[1], alt: 'Sharing the challenge link and QR code' },
      },
      {
        icon: 'users',
        title: 'Your community builds & submits',
        text: 'Participants add their projects on Commudle Builds, with links, screenshots and updates.',
        image: { url: HOW_IT_WORKS_IMAGES[2], alt: 'Community members building and submitting projects' },
      },
      {
        icon: 'trophy',
        title: 'Explore & vote for the best',
        text: 'Share the gallery link so everyone can see every submission and vote for their favourites.',
        image: { url: HOW_IT_WORKS_IMAGES[3], alt: 'Exploring submissions and voting for favourites' },
      },
    ],
  };

  /** "Who runs Vibeathon Challenges" — image card grid. */
  readonly whoItsForConfig: IFeatureGrid3Config = {
    eyebrow: 'WHO IT IS FOR',
    heading: 'Who runs Vibeathon Challenges',
    fragmentId: 'who-its-for',
    items: [
      {
        icon: 'users',
        title: 'Developer communities',
        description: 'Give members a low-pressure reason to build together and show their work.',
      },
      {
        icon: 'rocket',
        title: 'DevRel & product teams',
        description: 'Run a themed build challenge around a launch, an API, or an SDK.',
      },
      {
        icon: 'graduationCap',
        title: 'Colleges & student clubs',
        description: 'Host a mini-hackathon without standing up any infrastructure.',
      },
      {
        icon: 'building',
        title: 'Companies & internal teams',
        description: 'Run internal build days and hack weeks with a shareable submissions page.',
      },
    ],
  };

  /** "Everything a challenge needs" — icon feature grid. */
  readonly whatYouGetConfig: IFeatureGrid2Config = {
    eyebrow: 'WHAT YOU GET',
    heading: "Everything a challenge needs, nothing it doesn't",
    fragmentId: 'what-you-get',
    items: [
      {
        icon: 'link',
        title: 'Shareable link & QR code',
        description: 'One link to collect submissions, with a downloadable QR for events and slides.',
      },
      {
        icon: 'globe',
        title: 'Public submissions gallery',
        description: 'Every project in one place — links, screenshots and progress updates.',
      },
      {
        icon: 'trophy',
        title: 'Community voting',
        description: 'Let the community vote for their favourite builds to surface winners.',
      },
      {
        icon: 'check',
        title: 'No signup to browse',
        description: 'Anyone can open the gallery and explore submissions without an account.',
      },
      {
        icon: 'code',
        title: 'Built on Commudle Builds',
        description: "Submissions live on participants' Commudle profiles and keep working after the challenge.",
      },
      {
        icon: 'bolt',
        title: 'Free to run',
        description: 'Create a challenge and start collecting builds at no cost.',
      },
    ],
  };

  /** "Anyone can run a build challenge on Commudle" — stats, brand logos, past-challenge chips and CTA. */
  readonly runChallengeConfig: IShowcase1Config = {
    heading: 'Anyone can run a build challenge on Commudle',
    subtext:
      'From individual communities, college clubs, startups to global platforms, teams use Commudle to run ' +
      'Vibeathon build and buildathon challenges with techies of the world.',
    fragmentId: 'run-a-challenge',
    chipsLabel: 'Past challenges',
    chips: [
      { label: 'VibeCheck', routerLink: '/builds', queryParams: { campaign: 'vibecheck' } },
      { label: 'Build with Agora', routerLink: '/builds', queryParams: { campaign: 'buildwithagora' } },
      { label: 'Build with SwytchCode', routerLink: '/builds', queryParams: { campaign: 'buildwithswytchcode' } },
    ],
    // No routerLink → the button emits primaryCtaClick, which the page wires to scrollToForm().
    primaryCta: { label: 'Start your own Vibeathon' },
    logos: [
      { name: 'Gemini', url: PARTNER_LOGO_URLS.gemini, routerLink: '/builds', queryParams: { campaign: 'vibecheck' } },
      {
        name: 'Agora',
        url: PARTNER_LOGO_URLS.agora,
        routerLink: '/builds',
        queryParams: { campaign: 'buildwithagora' },
      },
      // SwytchCode's logo is white/light — render its tile dark so it stays visible.
      {
        name: 'SwytchCode',
        url: PARTNER_LOGO_URLS.swytchcode,
        dark: true,
        routerLink: '/builds',
        queryParams: { campaign: 'buildwithswytchcode' },
      },
    ],
  };

  /** Closing CTA — primary scrolls to the form (no routerLink → emits primaryCtaClick). */
  readonly ctaConfig: ICta1Config = {
    heading: 'Ready to launch your challenge?',
    subtext: 'Name it, share it, and watch your community build.',
    primaryCta: { label: 'Create your challenge' },
    secondaryCta: { label: 'Browse all builds', routerLink: '/builds' },
    fragmentId: 'get-started',
  };

  /** FAQ section config — `commudle-faq` inside emits the FAQPage JSON-LD. */
  faqConfig: IFaq1Config = {
    eyebrow: 'FAQ',
    heading: 'Frequently Asked Questions',
    subtext: 'Everything you need to know about running a Vibeathon Challenge.',
    helpText: 'Still have questions? We’re here to help.',
    helpCta: { label: 'Contact us', routerLink: '/policies/contact-us' },
    fragmentId: 'faq',
    faqs: [],
  };

  /** Icon pack for the challenge-creator tool below. */
  readonly icons = {
    faGlobe,
    faCloudArrowUp,
    faCopy,
    faCheck,
    faArrowUpRightFromSquare,
    faDownload,
    faLink,
    faHashtag,
  };

  /** The campaign/challenge name entered by the user. */
  challengeName = '';

  /** Transient copy-success states (reset after 2 s). */
  copiedViewAll = false;
  copiedSubmit = false;

  /**
   * Refs for the featured (step 1) card's decorative animation — purely
   * visual, GSAP-driven. See ngAfterViewInit / ngOnDestroy.
   */
  @ViewChild('featuredWrap') private featuredWrapRef?: ElementRef<HTMLElement>;
  @ViewChild('featuredGlow') private featuredGlowRef?: ElementRef<HTMLElement>;

  private readonly destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;
  private glowTween?: gsap.core.Tween;
  private entranceTween?: gsap.core.Tween;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly seoService: SeoService,
    private readonly footerService: FooterService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ── Computed properties ────────────────────────────────────────────────────

  /** True once the user has typed a name of MIN_NAME_LENGTH characters or more. */
  get isNameValid(): boolean {
    return this.challengeName.trim().length >= MIN_NAME_LENGTH;
  }

  private get encodedName(): string {
    return encodeURIComponent(this.challengeName.trim());
  }

  /** Full URL for the "view all projects" page. */
  get viewAllUrl(): string {
    return `${APP_URL}/builds?campaign=${this.encodedName}`;
  }

  /** Full URL for the "submit your project" page. */
  get submitUrl(): string {
    return `${APP_URL}/builds/create?campaign=${this.encodedName}`;
  }

  /** Shortened display URL (no protocol) shown inside the link cards. */
  get viewAllDisplayUrl(): string {
    return `commudle.com/builds?campaign=${this.encodedName}`;
  }

  /** Shortened display URL (no protocol) shown inside the link cards. */
  get submitDisplayUrl(): string {
    return `commudle.com/builds/create?campaign=${this.encodedName}`;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.setFaq();
    this.setPageMeta();
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.animateFeaturedCard();
  }

  ngOnDestroy(): void {
    this.glowTween?.kill();
    this.entranceTween?.kill();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Smoothly scrolls the page to the challenge-name input. Used by the closing
   * CTA — it does not navigate, and has no effect on the tool's own state.
   */
  scrollToForm(): void {
    if (!this.isBrowser) return;
    document.getElementById('challengeNameInput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  /** Called on every keystroke in the challenge-name input. */
  onNameChange(): void {
    this.cdr.markForCheck();
    if (this.isNameValid && this.isBrowser) {
      // setTimeout ensures Angular has rendered the *ngIf canvases before we paint.
      setTimeout(() => {
        this.renderQR('view');
        this.renderQR('submit');
      }, 100);
    }
  }

  /** Copy the "view all" URL to clipboard; show tick feedback for 2 s. */
  copyViewAllUrl(): void {
    if (!this.isBrowser) return;
    navigator.clipboard.writeText(this.viewAllUrl).then(() => {
      this.copiedViewAll = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copiedViewAll = false;
        this.cdr.markForCheck();
      }, 2000);
    });
  }

  /** Copy the "submit project" URL to clipboard; show tick feedback for 2 s. */
  copySubmitUrl(): void {
    if (!this.isBrowser) return;
    navigator.clipboard.writeText(this.submitUrl).then(() => {
      this.copiedSubmit = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copiedSubmit = false;
        this.cdr.markForCheck();
      }, 2000);
    });
  }

  /**
   * Download the rendered QR canvas as a PNG file.
   * @param target Which QR to download: 'view' (view-all URL) or 'submit' (submit URL).
   */
  downloadQR(target: 'view' | 'submit'): void {
    if (!this.isBrowser) return;
    const canvasId = target === 'view' ? 'vibeathon-qr-view' : 'vibeathon-qr-submit';
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;

    const safeSlug = this.challengeName.trim().toLowerCase().replace(/\s+/g, '-');
    const link = document.createElement('a');
    link.download = `${safeSlug}-${target}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ── SEO ────────────────────────────────────────────────────────────────────

  private setPageMeta(): void {
    this.seoService.setTags(
      'Create Your Vibeathon Challenge | Commudle',
      'Launch a Vibeathon Challenge on Commudle. Name your challenge, generate shareable links and QR codes, and invite your community to build, share and compete.',
      'https://commudle.com/assets/images/commudle-logo-192.png',
    );
    this.setStructuredData();
  }

  /**
   * Injects JSON-LD structured data for this page.
   *
   * Two schema types are combined:
   *  - WebApplication  — describes the challenge-creator tool itself.
   *  - HowTo           — describes the four-step flow (name → share → build →
   *                      vote), mirroring the visible "How it works" section,
   *                      which enables rich "how-to" snippets in Google Search.
   *
   * The FAQPage schema for this page is emitted separately by the
   * `commudle-faq` component (`SeoService.setSchema` appends, so both coexist).
   */
  private setStructuredData(): void {
    const structuredData = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Vibeathon Challenge Creator',
        description:
          'Create a Vibeathon Challenge on Commudle. Generate shareable links and QR codes to invite your community to build, share and compete.',
        url: 'https://www.commudle.com/vibeathon-challenge',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        provider: {
          '@type': 'Organization',
          name: 'Commudle',
          url: 'https://www.commudle.com',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to Run a Vibeathon Challenge',
        description:
          'Run a Vibeathon Challenge on Commudle in four steps — name your challenge, share the link and QR code, let your community build and submit, then explore submissions and vote for the best.',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Name your challenge',
            text: 'Choose a unique and memorable name for your Vibeathon challenge. This name will appear in all participant-facing links.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Share the link & QR',
            text: 'Copy the generated submission link and QR code and share them with your community, on slides, or on a poster.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Your community builds & submits',
            text: 'Participants add their projects on Commudle Builds with links, screenshots and progress updates.',
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Explore & vote for the best',
            text: 'Share the gallery link so everyone can browse every submission and vote for their favourites.',
          },
        ],
      },
    ];

    this.seoService.setSchema(structuredData);
  }

  /** Populates the FAQ list rendered by `commudle-faq` (which also emits FAQPage JSON-LD). */
  private setFaq(): void {
    this.faqConfig = {
      ...this.faqConfig,
      faqs: [
      {
        question: 'What is a Vibeathon Challenge?',
        answer:
          'A Vibeathon Challenge is a build competition you run with your community on Commudle. You name it, share a link, and people submit their projects. The community can browse every submission and vote for their favourites.',
      },
      {
        question: 'Is it free to run a Vibeathon Challenge?',
        answer: 'Yes. Creating a challenge and collecting submissions is free.',
      },
      {
        question: 'Do participants need a Commudle account?',
        answer:
          'Anyone can browse the submissions gallery without an account. Submitting a project requires a free Commudle account so the build stays on the participant’s profile.',
      },
      {
        question: 'How long should a challenge run?',
        answer:
          'That is up to you — anywhere from a weekend to a few weeks. There is no fixed timer; you decide when to stop sharing the submission link and announce winners.',
      },
      {
        question: 'How does voting work?',
        answer:
          'Share the “view all projects” link. Community members open the gallery and vote for the builds they like best.',
      },
      {
        question: 'Can I use this for an internal or private hackathon?',
        answer:
          'Yes. The submission and gallery links are shareable, so you can keep them within your team or community.',
      },
      {
        question: 'How is this different from the full Hackathon Management Platform?',
        answer:
          'Vibeathon Challenges are for lightweight, community-run build competitions with zero setup. For registration forms, team shortlisting, mentors, judges, and sponsor management, use the Hackathon Management Platform.',
      },
      {
        question: 'Where do the submitted projects live?',
        answer:
          'On Commudle Builds, linked to each participant’s profile, so they keep working after the challenge ends.',
      },
      ],
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Purely decorative GSAP animation for the featured (step 1) card:
   *  - a one-off entrance (fade + rise + gentle scale) on load
   *  - a slow, continuous colour cycle on the blurred gradient glow behind it
   *
   * The glow animates via a `hue-rotate` filter, not `transform: rotate` —
   * rotating that (blurred, inset-negative) box grows its effective
   * bounding box every frame, which the browser counts as scrollable
   * overflow on `.page-body` and shows as a scrollbar. `filter` is
   * paint-only and never affects layout, so it can't do that.
   *
   * Skipped entirely when the visitor has requested reduced motion — the
   * card still renders, just without the animation.
   */
  private animateFeaturedCard(): void {
    const wrap = this.featuredWrapRef?.nativeElement;
    const glow = this.featuredGlowRef?.nativeElement;
    if (!wrap) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    this.entranceTween = gsap.fromTo(
      wrap,
      { opacity: 0, y: 20, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power2.out' },
    );

    if (glow) {
      this.glowTween = gsap.fromTo(
        glow,
        { filter: 'blur(28px) hue-rotate(0deg)' },
        { filter: 'blur(28px) hue-rotate(360deg)', duration: 16, repeat: -1, ease: 'none' },
      );
    }
  }

  /**
   * Renders a QR code onto the appropriate canvas.
   * @param target 'view' paints the view-all URL; 'submit' paints the submit URL.
   * Uses lean-qr's `generate` + `toCanvas` API (same pattern as the rest of the codebase).
   */
  private renderQR(target: 'view' | 'submit'): void {
    const canvasId = target === 'view' ? 'vibeathon-qr-view' : 'vibeathon-qr-submit';
    const url = target === 'view' ? this.viewAllUrl : this.submitUrl;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    // Dark-mode fix: white background is applied via CSS `background: #ffffff`
    // on the canvas element in the SCSS (sits behind the transparent QR pixels).
    const qrCode = generate(url);
    qrCode.toCanvas(canvas);
  }
}
