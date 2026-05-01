import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { APP_SHOWCASE_STATS, SeoService } from '@commudle/shared-services';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SharedComponentsModule as LibSharedComponentsModule } from '@commudle/shared-components';
import { IFaq } from '@commudle/shared-models';
import { NbButtonModule } from '@commudle/theme';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faRocket,
  faUsers,
  faTrophy,
  faChartLine,
  faCode,
  faUserPlus,
  faBullhorn,
  faCheck,
  faBuilding,
  faGraduationCap,
  faPlus,
  faChartBar,
  faCalendar,
  faLock,
  faUser,
  faCogs,
  faEnvelope,
  faHeadset,
  faClipboardList,
  faDollarSign,
  faMousePointer,
  faEye,
  faLightbulb,
  faUniversity,
  faChevronLeft,
  faChevronRight,
  faHashtag,
} from '@fortawesome/free-solid-svg-icons';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'commudle-page-hackathon-management-platform',
  standalone: true,
  imports: [
    CommonModule,
    SharedComponentsModule,
    LibSharedComponentsModule,
    NbButtonModule,
    FontAwesomeModule,
    RouterModule,
  ],
  templateUrl: './page-hackathon-management-platform.component.html',
  styleUrls: ['./page-hackathon-management-platform.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHackathonManagementPlatformComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private intersectionObserver?: IntersectionObserver;

  @ViewChild('heroSection', { static: false }) heroSection?: ElementRef;

  // Image sources with WebP support and responsive sizing

  // FontAwesome icons
  faRocket = faRocket;
  faUsers = faUsers;
  faTrophy = faTrophy;
  faChartLine = faChartLine;
  faCode = faCode;
  faUserPlus = faUserPlus;
  faBullhorn = faBullhorn;
  faCheck = faCheck;
  faBuilding = faBuilding;
  faGraduationCap = faGraduationCap;
  faPlus = faPlus;
  faChartBar = faChartBar;
  faCalendar = faCalendar;
  faLock = faLock;
  faUser = faUser;
  faCogs = faCogs;
  faEnvelope = faEnvelope;
  faHeadset = faHeadset;
  faClipboardList = faClipboardList;
  faDollarSign = faDollarSign;
  faHashtag = faHashtag;
  faTarget = faMousePointer;
  readonly appShowcaseStats = APP_SHOWCASE_STATS;
  faMousePointer = faMousePointer;
  faEye = faEye;
  faLightbulb = faLightbulb;
  faUniversity = faUniversity;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;

  hackathonImages = staticAssets.hackathon_platform;

  // FAQ data
  faqs: IFaq[] = [];

  constructor(private seoService: SeoService, private footerService: FooterService) {}

  ngOnInit(): void {
    this.setPageMeta();
    this.footerService.changeFooterStatus(true);
    this.setFaq();
  }

  private setFaq(): void {
    this.faqs = [
      {
        question: 'What is included in the Commudle Hackathon Management Platform?',
        answer:
          'Our platform includes end-to-end tools right from registration forms, team shortlisting, mentor & judge onboarding, online assessment, team dashboard, mentor dashboard, project submission, project display, posting project updates, sponsor management, team profiles and most importantly email communications to everyone.',
      },
      {
        question: 'How can I host my first hackathon?',
        answer:
          'If are already on a subscription plan then you will find the Hackathon management dashboard inside your community dashboard.',
      },
      {
        question: 'How much does it cost to host a hackathon on Commudle?',
        answer:
          'The hackathons come bundled within the community suite. You can begin easily by subscribing to one of our plans and unlock all unlimited features.',
      },
      {
        question: 'Can I customize the hackathon landing pages for my brand?',
        answer:
          'Yes! You can add custom branding like a banner image, custom description, tailored registration forms, list prizes, tracks, problem statements etc. on the page as per your liking. The core page structure remains the same because it helps in a higher visibility on search engines and is easy for the users to grasp.',
      },
      {
        question: 'How does the mentoring & judging system work?',
        answer:
          'The mentoring and judging system has options to customize the evaluation criteria for each round. Multiple mentors and teams can interact with each other during these evaluations. The marks allocated to the teams then translate into a leaderboard on the admin dashboard.',
      },
      {
        question: 'What are Commudle Managed Hackathons?',
        answer:
          'If you are looking to organize a standalone public hackathon for your business then we work closely with your team to manage the hackathon end-to-end for you, right from creating the problem statements to project submissions, evaluations and finding winners.',
      },
      {
        question: 'Can participants form teams on the platform?',
        answer: 'The team leader can manage their teams by adding or removing teammates as per their discretion.',
      },
      {
        question: 'How are analytics on your platform more insightful?',
        answer:
          'Apart from the basic geographical and demographical analytics like location, experience, gender, etc. each participant maintains a profile on Commudle which is not just limited to hackathon participation. The analytics displayed by Commudle are far more accurate and they add on to the community building aspect for your brand because they sign up for a hackathon but remain a member for a longer time. You can keep engaging with them along.',
      },
    ];
  }

  private setPageMeta(): void {
    // Set comprehensive SEO meta tags
    this.seoService.setTags(
      'Hackathon Management Platform - Host, Sponsor & Participate | Commudle',
      'Complete hackathon management platform for hosts, sponsors, and participants. Create, manage, and promote hackathons with ease. Join 500K+ developers.',
      'https://commudle.com/assets/images/commudle-logo-192.png',
    );

    // Set comprehensive structured data for search engines
    this.setStructuredData();
  }

  /**
   * Set structured data for search engines
   */
  private setStructuredData(): void {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Commudle Hackathon Management Platform',
      description: 'Comprehensive platform for creating, managing, and participating in hackathons',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      provider: {
        '@type': 'Organization',
        name: 'Commudle',
        url: 'https://www.commudle.com',
      },
    };

    this.seoService.setSchema(structuredData);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}
