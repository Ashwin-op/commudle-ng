/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { environment } from '@commudle/shared-environments';
import { EHackathonRegistrationStatus, ICommunity, IHackathonTeam } from '@commudle/shared-models';
import { AuthService, removeHtmlTags, SeoService } from '@commudle/shared-services';
import { faFacebookF, faGithub, faLinkedinIn, faTwitter } from '@fortawesome/free-brands-svg-icons';
import {
  faArrowTrendUp,
  faAward,
  faChalkboardTeacher,
  faCircleQuestion,
  faGlobe,
  faHandshake,
  faHashtag,
  faInfoCircle,
  faLaptopCode,
  faSackDollar,
  faStar,
  faUser,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { HackathonJudgeService } from 'apps/commudle-admin/src/app/services/hackathon-judge.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IContactInfo } from 'apps/shared-models/contact-info.model';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-public-hackathon-homepage',
  templateUrl: './public-hackathon-homepage.component.html',
  styleUrls: ['./public-hackathon-homepage.component.scss'],
  standalone: false,
})
export class PublicHackathonHomepageComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  hackathon: IHackathon;
  community: ICommunity;
  contactInfo: IContactInfo;
  icons = {
    faLinkedinIn,
    faTwitter,
    faFacebookF,
    faGlobe,
    faGithub,
    faInfoCircle,
    faHashtag,
    faStar,
    faSackDollar,
    faCircleQuestion,
    faAward,
    faUser,
    faLaptopCode,
    faArrowTrendUp,
    faHandshake,
    faUserTie,
    faChalkboardTeacher,
    faTrophy,
  };
  isLoading = true;
  showBannerImage = false;
  activeFragment: string;
  userTeamDetails: IHackathonTeam[];
  EHackathonRegistrationStatus = EHackathonRegistrationStatus;
  environment = environment;
  hasDashboardAndChannelAccess = false;
  hasCollaborationCommunities = false;
  userRoles = {
    is_judge: false,
    is_speaker: false,
    is_mentor: false,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private router: Router,
    private seoService: SeoService,
    private authService: AuthService,
    private hackathonJudgeService: HackathonJudgeService,
  ) {}

  ngOnInit() {
    this.checkFragment();
    this.getHackathonAndCommunity();
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateHeaderVariation();
      }
    });

    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser) => {
      if (currentUser) {
        this.getHackathonCurrentRegistrationDetails();
        this.getUserRoles();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  getHackathonAndCommunity() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        this.community = data.community;
        this.updateHeaderVariation();
        this.getContactInfo();
        this.setSeoService();
        this.setSchema();
      }),
    );
  }

  checkFragment() {
    this.activatedRoute.fragment.subscribe((fragment) => {
      if (fragment) {
        this.activeFragment = fragment;
      } else {
        this.activeFragment = '';
      }
    });
  }

  getContactInfo() {
    this.subscriptions.push(
      this.hackathonService.showHackathonContactInfo(this.hackathon.id).subscribe((data) => {
        this.contactInfo = data;
        this.isLoading = false;
      }),
    );
  }
  updateHeaderVariation() {
    const url = this.router.url.split('?')[0]; // Remove query parameters
    const value = url.split(this.hackathon.slug)[1];
    if (value) {
      this.showBannerImage = true;
    } else {
      this.showBannerImage = false;
    }
  }

  getHackathonCurrentRegistrationDetails() {
    this.subscriptions.push(
      this.hackathonService
        .getHackathonCurrentRegistrationDetails(this.hackathon.id)
        .subscribe((data: IHackathonTeam[]) => {
          if (data) {
            this.userTeamDetails = data;
            if (
              this.userTeamDetails.some((team) => team.registration_status === EHackathonRegistrationStatus.ACCEPTED)
            ) {
              this.hasDashboardAndChannelAccess = true;
            }
          }
        }),
    );
  }

  setSeoService() {
    this.seoService.setTags(
      this.hackathon.name + ' by ' + this.community.name,
      removeHtmlTags(this.hackathon.description),
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  setSchema() {
    if (this.hackathon.start_date) {
      let location: any;
      let eventAttendanceMode: string;

      const baseUrl =
        environment.app_url + '/communities/' + this.community.slug + '/hackathons/' + this.hackathon.slug;

      if (this.hackathon.hackathon_location_type === 'hybrid') {
        eventAttendanceMode = 'https://schema.org/MixedEventAttendanceMode';

        location = [
          {
            '@type': 'Place',
            name: this.hackathon.location_name,
            address: this.hackathon.location_address,
          },
          {
            '@type': 'VirtualLocation',
            url: baseUrl,
          },
        ];
      } else if (this.hackathon.hackathon_location_type === 'offline') {
        eventAttendanceMode = 'https://schema.org/OfflineEventAttendanceMode';
        location = {
          '@type': 'Place',
          name: this.hackathon.location_name,
          address: this.hackathon.location_address,
        };
      } else {
        eventAttendanceMode = 'https://schema.org/OnlineEventAttendanceMode';
        location = {
          '@type': 'VirtualLocation',
          url: baseUrl,
        };
      }

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: this.hackathon.name,
        description: removeHtmlTags(this.hackathon.description).substring(0, 200),
        image: this.hackathon.banner_image?.url || this.community.logo_image_path?.i64,
        startDate: this.hackathon.start_date,
        endDate: this.hackathon.end_date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: eventAttendanceMode,
        location: location,
        organizer: {
          '@type': 'Organization',
          name: this.community.name,
          url: environment.app_url + '/communities/' + this.community.slug,
        },
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/RegisterAction',
          userInteractionCount: this.hackathon.number_of_participants || 0,
        },
      };

      this.seoService.setSchema(schema);
    }
  }

  getUserRoles() {
    this.subscriptions.push(
      this.hackathonJudgeService.getUserRoles(this.hackathon.id).subscribe((roles) => {
        this.userRoles = roles;
      }),
    );
  }
}
