import { Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { IUser } from '@commudle/shared-models';
import { DiscussionService, removeHtmlTags } from '@commudle/shared-services';
import { NbMenuService } from '@commudle/theme';
import { faCalendar, faClockFour, faEllipsisVertical, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { DiscussionsService } from 'apps/commudle-admin/src/app/services/discussions.service';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { ICommunity } from 'apps/shared-models/community.model';
import { IDiscussion } from 'apps/shared-models/discussion.model';
import { EEventStatuses } from 'apps/shared-models/enums/event_statuses.enum';
import { IEvent } from 'apps/shared-models/event.model';
import { IEventUpdate } from 'apps/shared-models/event_update.model';
import { SeoService } from 'apps/shared-services/seo.service';
import * as moment from 'moment';
import * as momentTimezone from 'moment-timezone';
import { map } from 'rxjs';
import { EEventType } from '@commudle/shared-models';
import { EventDataFormEntityGroupsService } from 'apps/commudle-admin/src/app/services/event-data-form-entity-groups.service';
import { EventUpdatesService } from 'apps/commudle-admin/src/app/services/event-updates.service';
import { IEventDataFormEntityGroup } from 'apps/shared-models/event_data_form_enity_group.model';
import { ERegistationTypes } from 'apps/shared-models/enums/registration_types.enum';

@Component({
  selector: 'app-home-event',
  templateUrl: './home-event.component.html',
  styleUrls: ['./home-event.component.scss'],
  standalone: false,
})
export class HomeEventComponent implements OnInit, OnDestroy, AfterViewInit {
  moment = moment;
  momentTimezone = momentTimezone;
  EEventStatuses = EEventStatuses;

  community: ICommunity;
  event: IEvent;
  discussionChat: IDiscussion;

  hasUpdates = false;
  hasAgenda = false;
  hasSpeakers = false;
  hasCollaborationCommunities = false;
  hasVolunteers = false;
  hasOpenForms = false;
  hasInterestedMembers = false;
  hasSponsors = false;
  isBottomSheetOpen = false;
  activeSection = '';

  environment = environment;

  managedCommunities: ICommunity[] = [];

  subscriptions = [];

  isOrganizer = false;
  isLoading = true;
  isMenuSticky = false;
  faEllipsisVertical = faEllipsisVertical;
  faCalendar = faCalendar;
  faClockFour = faClockFour;
  faGlobe = faGlobe;
  interestedUsers: IUser[];
  interestedUsersCount: number;
  formsData: IEventDataFormEntityGroup[] = [];
  attendeeForms: IEventDataFormEntityGroup[] = [];
  speakersData: IUser[] = [];
  isSpeakersLoaded = false;
  isInterestedMembersLoaded = false;
  isAttendeeFormsLoaded = false;
  liveBlogUpdates: IEventUpdate[] = [];
  private schemaRendered = false;
  EEventType = EEventType;

  items: [{ title: string }];
  @ViewChild('updatesSection', { static: false }) updatesSectionRef: ElementRef<HTMLDivElement>;
  @ViewChild('descriptionSection', { static: false }) descriptionSectionRef: ElementRef<HTMLDivElement>;
  @ViewChild('agendaSection', { static: false }) agendaSectionRef: ElementRef<HTMLDivElement>;
  @ViewChild('speakersSection', { static: false }) speakersSectionRef: ElementRef<HTMLDivElement>;
  @ViewChild('sponsorsSection', { static: false }) sponsorsSectionRef: ElementRef<HTMLDivElement>;
  @ViewChild('collaborationCommunitiesSection', { static: false })
  collaborationCommunitiesSectionRef: ElementRef<HTMLDivElement>;
  @ViewChild('commentsSection', { static: false }) commentsSectionRef: ElementRef<HTMLDivElement>;
  @ViewChild('volunteersSection', { static: false }) volunteersSectionRef: ElementRef<HTMLDivElement>;
  @ViewChild('eventFormSection', { static: false }) eventFormSectionRef: ElementRef<HTMLDivElement>;
  @ViewChild('stickySentinel') stickySentinel!: ElementRef;

  private observer!: IntersectionObserver;
  private isBrowser: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private eventsService: EventsService,
    private communitiesService: CommunitiesService,
    private seoService: SeoService,
    private discussionsService: DiscussionsService,
    private discussionService: DiscussionService,
    private menuService: NbMenuService,
    private eventService: EventsService,
    private eventDataFormEntityGroupsService: EventDataFormEntityGroupsService,
    private eventUpdatesService: EventUpdatesService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.getEvent(params.event_id);
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.observer?.disconnect();
  }

  ngAfterViewInit() {
    this.initStickyObserver();
  }

  private setupStickyObserver(element: HTMLElement): void {
    this.observer?.disconnect();
    if (!this.isBrowser) {
      return;
    }
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.isMenuSticky = !entry.isIntersecting;
      },
      { root: null, threshold: 0 },
    );
    this.observer.observe(element);
  }

  private initStickyObserver(): void {
    setTimeout(() => {
      if (this.stickySentinel?.nativeElement) {
        this.setupStickyObserver(this.stickySentinel.nativeElement);
      }
    });
  }

  scroll(element: ElementRef<HTMLDivElement>, section = '') {
    this.activeSection = section;
    element.nativeElement.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
  }

  getEvent(eventId) {
    this.eventsService.pGetEvent(eventId).subscribe((event) => {
      this.event = event;
      this.isSpeakersLoaded = this.event.event_speakers_count === 0;
      this.fetchInterestedMembers();
      this.fetchOpenForms();
      this.fetchLiveBlogUpdates();
      this.isLoading = false;
      this.getCommunity(event.kommunity_id);
    });
  }

  private fetchLiveBlogUpdates() {
    this.eventUpdatesService.pGetEventUpdates(this.event.id, 20).subscribe((data) => {
      this.liveBlogUpdates = data.page?.reduce((acc, value) => [...acc, value.data], []) || [];
      if (this.schemaRendered) {
        this.setSchema();
      }
    });
  }

  fetchOpenForms() {
    this.eventDataFormEntityGroupsService.pGetPublicOpenDataForms(this.event.id).subscribe((data) => {
      if (data.event_data_form_entity_groups.length > 0) {
        this.formsData = data.event_data_form_entity_groups;
        this.attendeeForms = this.formsData.filter(
          (form) => form.registration_type.name === ERegistationTypes.ATTENDEE,
        );
        this.checkAndSetSchema();
        this.isAttendeeFormsLoaded = true;
      } else {
        this.isAttendeeFormsLoaded = true;
        this.checkAndSetSchema();
      }
    });
  }

  getCommunity(communityId) {
    this.communitiesService.getCommunityDetails(communityId).subscribe((community) => {
      this.community = community;
      this.isOrganizerCheck(this.community.slug);
      this.getDiscussionChat();

      this.seoService.setTags(
        `${this.event.name} | ${this.community.name}`,
        removeHtmlTags(this.event.description).substring(0, 200),
        this.event.header_image_path ? this.event.header_image_path : this.community.logo_image_path.url,
      );
      this.initStickyObserver();
    });
  }

  fetchInterestedMembers() {
    this.eventService.pGetEventsInterestedMembers(this.event.id).subscribe((res) => {
      this.interestedUsers = res.users;
      this.interestedUsersCount = res.total_count;
      this.isInterestedMembersLoaded = true;
      this.checkAndSetSchema();
    });
  }

  onSpeakersData(speakers: IUser[]) {
    this.speakersData = speakers;
    if (this.speakersData.length === this.event.event_speakers_count) {
      this.isSpeakersLoaded = true;
      this.checkAndSetSchema();
    }
  }

  private getPerformersSchema() {
    if (this.speakersData.length > 0) {
      return this.speakersData.map((speaker) => ({
        '@type': 'Person',
        name: speaker.name,
        url: speaker.username ? `${environment.app_url}/users/${speaker.username}` : '',
        image: speaker.avatar,
        jobTitle: speaker.designation,
      }));
    }
    return undefined;
  }

  private getOffersSchema() {
    if (this.attendeeForms.length > 0) {
      return this.attendeeForms.map((form) => ({
        '@type': 'Offer',
        name: form.name,
        url: `${environment.app_url}/fill-form/${form.data_form_entity_id}`,
        price: form.is_paid && form.paid_ticket_setting ? form.paid_ticket_setting.price / 100 : 0,
        priceCurrency: form.is_paid && form.paid_ticket_setting ? form.paid_ticket_setting.currency : 'INR',
        availability: 'https://schema.org/InStock',
      }));
    }

    return {
      '@type': 'Offer',
      name: this.event.name,
      url: `${environment.app_url}/communities/${this.community.slug}/events/${this.event.slug}`,
      price: 0,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    };
  }

  private checkAndSetSchema() {
    if (this.schemaRendered) {
      return;
    }
    if (
      this.community &&
      this.isInterestedMembersLoaded &&
      this.isSpeakersLoaded &&
      this.event.start_time &&
      this.isAttendeeFormsLoaded
    ) {
      this.schemaRendered = true;
      this.setSchema();
    }
  }

  setSchema() {
    const performers = this.getPerformersSchema();
    let location: object;
    let eventStatus: string;

    if (this.event.event_type === EEventType.OFFLINE || this.event.custom_agenda === true) {
      location = {
        '@type': 'Place',
        name: this.event.event_locations[0] ? this.event.event_locations[0].name : '',
        address: this.event.event_locations[0] ? this.event.event_locations[0].address : '',
      };
      eventStatus = 'OfflineEventAttendanceMode';
    } else {
      location = {
        '@type': 'VirtualLocation',
        url: `${environment.app_url}/communities/${this.event.kommunity_slug}/events/${this.event.slug}`,
      };
      eventStatus = 'OnlineEventAttendanceMode';
    }

    const schemaObject: any = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: this.event.name,
      description: this.event.description.replace(/<[^>]*>/g, '').substring(0, 200),
      image: this.event.header_image_path ? this.event.header_image_path : this.community?.logo_image_path?.url,

      startDate: this.event.start_time,
      endDate: this.event.end_time,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: `https://schema.org/${eventStatus}`,
      location,

      organizer: {
        '@type': 'Organization',
        name: this.community.name,
        url: `${environment.app_url}/communities/${this.community.slug}`,
      },

      offers: this.getOffersSchema(),

      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/JoinAction',
        userInteractionCount: this.interestedUsersCount || 0,
      },
    };

    if (this.liveBlogUpdates.length > 0) {
      schemaObject.subjectOf = {
        '@type': 'LiveBlogPosting',
        '@id': `${environment.app_url}/communities/${this.community.slug}/events/${this.event.slug}#live-updates`,
        coverageStartTime: this.event.start_time,
        coverageEndTime: this.event.end_time,
        url: `${environment.app_url}/communities/${this.community.slug}/events/${this.event.slug}`,
        liveBlogUpdate: this.liveBlogUpdates.map((update) => ({
          '@type': 'BlogPosting',
          datePublished: update.created_at,
          articleBody: (update.details || '').replace(/<[^>]*>/g, ''),
          image: update.images?.length ? update.images[0]?.url || update.images[0]?.i128 : undefined,
          author: {
            '@type': 'Organization',
            name: this.community.name,
          },
        })),
      };
    }

    // Only add performer if it exists (clean conditional property)
    if (performers && performers.length > 0) {
      schemaObject.performer = performers;
    }

    this.seoService.setSchema(schemaObject);
  }

  isOrganizerCheck(community) {
    this.subscriptions.push(
      this.communitiesService.userManagedCommunities$.subscribe((data: ICommunity[]) => {
        if (data.find((cSlug) => cSlug.slug === community) !== undefined) {
          this.isOrganizer = true;
        }
      }),
    );
  }

  getDiscussionChat() {
    this.discussionsService.pGetOrCreateForEventChat(this.event.id).subscribe((data) => {
      this.discussionChat = data;
      if (this.isOrganizer) {
        this.setContextMenu();
      }
    });
  }

  setContextMenu() {
    this.updateContextMenu();
    this.handleContextMenuItemClick();
  }

  handleContextMenuItemClick() {
    this.subscriptions.push(
      this.menuService
        .onItemClick()
        .pipe(map(({ item }) => item.title))
        .subscribe((menuItemTitle) => {
          if (menuItemTitle === 'Turn OFF Comments' || menuItemTitle === 'Turn ON Comments') {
            this.toggleDiscussionOpen();
          }
        }),
    );
  }

  toggleDiscussionOpen() {
    this.discussionService.toggleDiscussionOpen(this.discussionChat.id).subscribe((value: boolean) => {
      this.discussionChat.open = value;
      this.updateContextMenu();
    });
  }

  updateContextMenu() {
    this.items = [{ title: this.discussionChat.open ? 'Turn OFF Comments' : 'Turn ON Comments' }];
  }

  openBottomSheet() {
    this.isBottomSheetOpen = true;
  }

  closeBottomSheet() {
    this.isBottomSheetOpen = false;
  }
}
