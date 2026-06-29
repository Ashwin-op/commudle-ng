/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  EDbModels,
  EHackathonRegistrationStatus,
  IFaq,
  IHackathonTeam,
  IRound,
  ICommunity,
} from '@commudle/shared-models';
import {
  FaqService,
  ILogoTint,
  LogoTintService,
  onSponsorStripGradientEnter,
  onSponsorStripGradientLeave,
  onSponsorStripGradientMove,
  RoundService,
  SeoService,
  removeHtmlTags,
} from '@commudle/shared-services';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { DiscussionsService } from 'apps/commudle-admin/src/app/services/discussions.service';
import { HackathonResponseGroupService } from 'apps/commudle-admin/src/app/services/hackathon-response-group.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IDiscussion } from 'apps/shared-models/discussion.model';
import { IHackathonSponsorGroupedByTierName } from 'apps/shared-models/hackathon-sponsor';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { IContactInfo } from 'apps/shared-models/contact-info.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import * as moment from 'moment';
import * as momentTimezone from 'moment-timezone';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { faPencil, faSackDollar, faCircleQuestion, faLink, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faLinkedin, faInstagram, faTwitter, faGithub } from '@fortawesome/free-brands-svg-icons';
@Component({
  selector: 'commudle-public-hackathon-details',
  templateUrl: './public-hackathon-details.component.html',
  styleUrls: ['./public-hackathon-details.component.scss'],
  standalone: false,
})
export class PublicHackathonDetailsComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  community: ICommunity;
  EDbModels = EDbModels;
  hackathonSponsorGroupedByTierName: IHackathonSponsorGroupedByTierName;
  sponsorLogoTints: Record<number, ILogoTint> = {};
  faqs: IFaq[];
  discussionChat: IDiscussion;
  rounds: IRound[];
  moment = moment;
  momentTimezone = momentTimezone;
  userTeamDetails: IHackathonTeam[];
  subscriptions: Subscription[] = [];
  EHackathonRegistrationStatus = EHackathonRegistrationStatus;
  hrgId: number;
  isOrganizer = false;
  hackathonStatus: string;
  hackathonSocial: IContactInfo;
  icons = {
    faPencil,
    faSackDollar,
    faCircleQuestion,
    faLink,
    faFacebook,
    faLinkedin,
    faInstagram,
    faTwitter,
    faGithub,
    faGlobe,
  };

  onSponsorStripGradientEnter = onSponsorStripGradientEnter;
  onSponsorStripGradientMove = onSponsorStripGradientMove;
  onSponsorStripGradientLeave = onSponsorStripGradientLeave;

  tierPriorityComparator = (a: { value: any[] }, b: { value: any[] }): number => {
    const priorityA = a.value?.[0]?.tier_priority;
    const priorityB = b.value?.[0]?.tier_priority;
    return priorityA - priorityB;
  };

  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private faqService: FaqService,
    private discussionsService: DiscussionsService,
    private roundService: RoundService,
    private authWatchService: LibAuthwatchService,
    private hrgService: HackathonResponseGroupService,
    private communitiesService: CommunitiesService,
    private seoService: SeoService,
    private logoTintService: LogoTintService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        this.community = data.community;
        this.setSeoService();
        this.calculateHackathonDatesStatus();
        this.getSponsors();
        this.getFaqs();
        this.getDiscussionChat();
        this.getRounds();
        this.isOrganizerCheck();
        this.getHackathonSocial();
      }),
    );
    this.getHackathonResponseGroup();
    this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser) => {
      if (currentUser) {
        this.getHackathonCurrentRegistrationDetails();
      }
    });
    this.checkFragment();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkFragment() {
    this.activatedRoute.fragment.subscribe((fragment) => {
      if (fragment) {
        this.updateSeoForFragment(fragment);
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          });
        }
      } else {
        this.setSeoService();
      }
    });
  }

  updateSeoForFragment(fragment: string) {
    const bannerImage = this.hackathon?.banner_image?.url || 'https://commudle.com/assets/images/commudle-logo192.png';
    switch (fragment) {
      case 'updates':
        this.seoService.setTags(
          `Updates | ${this.hackathon.name}`,
          `Latest updates for ${this.hackathon.name} hackathon by ${this.community.name}`,
          bannerImage,
        );
        break;
      case 'sponsors':
        this.seoService.setTags(
          `Sponsors | ${this.hackathon.name}`,
          `Sponsors supporting ${this.hackathon.name} hackathon by ${this.community.name}`,
          bannerImage,
        );
        break;
      case 'faq':
        this.seoService.setTags(
          `FAQ | ${this.hackathon.name}`,
          `Frequently asked questions about ${this.hackathon.name} hackathon by ${this.community.name}`,
          bannerImage,
        );
        break;
      case 'collaborations':
        this.seoService.setTags(
          `Collaborations | ${this.hackathon.name}`,
          `Community collaborations for ${this.hackathon.name} hackathon by ${this.community.name}`,
          bannerImage,
        );
        break;
      case 'comments':
        this.seoService.setTags(
          `Comments | ${this.hackathon.name}`,
          `Discussion and comments for ${this.hackathon.name} hackathon by ${this.community.name}`,
          bannerImage,
        );
        break;
      default:
        this.setSeoService();
        break;
    }
  }

  getHackathonResponseGroup() {
    this.hrgService.pShowHackathonResponseGroup(this.hackathon.id).subscribe((data) => {
      if (data) this.hrgId = data.id;
    });
  }

  getSponsors() {
    this.subscriptions.push(
      this.hackathonService.pIndexSponsors(this.hackathon.id).subscribe((data) => {
        this.hackathonSponsorGroupedByTierName = data;
        this.resolveSponsorLogoTints();
      }),
    );
  }

  private resolveSponsorLogoTints(): void {
    const sponsors = Object.values(this.hackathonSponsorGroupedByTierName ?? {}).flat();
    if (!sponsors.length) {
      return;
    }

    this.logoTintService
      .resolveTints(
        sponsors.map((hackathonSponsor) => ({
          id: hackathonSponsor.id,
          logo: { logo_image: hackathonSponsor.sponsor.logo },
        })),
      )
      .then((tints) => {
        this.sponsorLogoTints = tints;
      });
  }

  getFaqs() {
    this.subscriptions.push(
      this.faqService.pIndexFaqs(this.hackathon.id, EDbModels.HACKATHON).subscribe((data) => {
        this.faqs = data;
        if (this.faqs && this.faqs.length > 0) {
          this.setSchema();
        }
      }),
    );
  }

  getDiscussionChat() {
    this.subscriptions.push(
      this.discussionsService.PublicGetOrCreateForHackathon(this.hackathon.id).subscribe((data) => {
        this.discussionChat = data;
      }),
    );
  }

  getRounds() {
    this.subscriptions.push(
      this.roundService.pIndexRounds(this.hackathon.id, EDbModels.HACKATHON).subscribe((data) => {
        this.rounds = data;
      }),
    );
  }

  getHackathonCurrentRegistrationDetails() {
    this.subscriptions.push(
      this.hackathonService
        .getHackathonCurrentRegistrationDetails(this.hackathon.id)
        .subscribe((data: IHackathonTeam[]) => {
          if (data) {
            this.userTeamDetails = data;
          }
        }),
    );
  }

  isOrganizerCheck() {
    this.subscriptions.push(
      this.communitiesService.userManagedCommunities$.subscribe((data: ICommunity[]) => {
        if (data.find((cSlug) => cSlug.slug === this.community.slug) !== undefined) {
          this.isOrganizer = true;
        } else {
          this.isOrganizer = false;
        }
      }),
    );
  }

  getHackathonSocial(): void {
    this.subscriptions.push(
      this.hackathonService.showHackathonContactInfo(this.hackathon.id).subscribe((data) => {
        this.hackathonSocial = data;
      }),
    );
  }

  calculateHackathonDatesStatus() {
    const currentDate = new Date();
    const hackathonApplicationStartDate = new Date(this.hackathon.application_start_date);
    const hackathonApplicationEndDate = new Date(this.hackathon.application_end_date);
    if (currentDate < hackathonApplicationStartDate) {
      this.hackathonStatus = 'Upcoming';
    } else if (currentDate >= hackathonApplicationStartDate && currentDate <= hackathonApplicationEndDate) {
      this.hackathonStatus = 'Outgoing';
    } else if (currentDate > hackathonApplicationEndDate) {
      this.hackathonStatus = 'Closed';
    }
  }

  setSchema() {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: this.faqs.map((faq: { question: string; answer: string }) => {
        return {
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        };
      }),
    };

    this.seoService.setSchema(faqSchema);
  }

  setSeoService() {
    this.seoService.setTags(
      this.hackathon.name + ' by ' + this.community.name,
      removeHtmlTags(this.hackathon.description),
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }
}
