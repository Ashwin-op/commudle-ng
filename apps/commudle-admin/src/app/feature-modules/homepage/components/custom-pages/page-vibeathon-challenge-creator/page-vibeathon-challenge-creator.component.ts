import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
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
  faQrcode,
  faLightbulb,
  faLink,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
import { generate } from 'lean-qr';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SectionHero8Component } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-hero-8/section-hero-8.component';
import { IHero8Config } from 'apps/commudle-admin/src/app/app-shared-components/page-sections/section-hero-8/section-hero-8.config';

/** Production app URL — used to construct the two shareable campaign links. */
const APP_URL = 'https://www.commudle.com';

/** Minimum valid challenge name length (characters). */
const MIN_NAME_LENGTH = 3;

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
    SectionHero8Component,
    SharedComponentsModule,
  ],
  templateUrl: './page-vibeathon-challenge-creator.component.html',
  styleUrls: ['./page-vibeathon-challenge-creator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageVibeathonChallengeCreatorComponent implements OnInit, OnDestroy {
  /** Hero section configuration — static, matches the Vibeathon campaign branding. */
  readonly heroConfig: IHero8Config = {
    badge: '🚀 Create Your Vibeathon Challenge',
    headingLine1: 'Launch your challenge.',
    headingLine2: 'Inspire <span>builders.</span>',
    subtext: 'Create a Vibeathon Challenge on Commudle and invite your community to build, share and compete.',
  };

  /** Icon pack — all icons grouped in one readonly object per project convention. */
  readonly icons = {
    faGlobe,
    faCloudArrowUp,
    faCopy,
    faCheck,
    faArrowUpRightFromSquare,
    faDownload,
    faQrcode,
    faLightbulb,
    faLink,
    faRocket,
  };

  /** The campaign/challenge name entered by the user. */
  challengeName = '';

  /** Transient copy-success states (reset after 2 s). */
  copiedViewAll = false;
  copiedSubmit = false;

  private readonly destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;

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
    this.setPageMeta();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
   *  - HowTo           — describes the two-step flow (name → share), which
   *                      enables rich "how-to" snippets in Google Search.
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
        name: 'How to Create a Vibeathon Challenge',
        description:
          'Set up a Vibeathon Challenge on Commudle in two steps — name your challenge and share the generated links and QR code with your community.',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Name Your Challenge',
            text: 'Choose a unique and memorable name for your Vibeathon challenge. This name will appear in all participant-facing links.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Share Your Challenge',
            text: 'Copy the generated links and QR codes — one for viewing all submissions and one for submitting projects — and share them with your community.',
          },
        ],
      },
    ];

    this.seoService.setSchema(structuredData);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

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
