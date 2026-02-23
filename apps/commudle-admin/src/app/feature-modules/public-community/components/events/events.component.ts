import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import * as momentTimezone from 'moment-timezone';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { ICommunity } from 'apps/shared-models/community.model';
import { IEvent } from 'apps/shared-models/event.model';
import { SeoService } from 'apps/shared-services/seo.service';
import { removeHtmlTags } from '@commudle/shared-services';
import { faCalendarCheck, faCalendarDays, faMapPin } from '@fortawesome/free-solid-svg-icons';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { EEventType } from '@commudle/shared-models';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  standalone: false,
})
export class EventsComponent implements OnInit {
  moment = moment;
  momentTimezone = momentTimezone;
  community: ICommunity;
  events: IEvent[] = [];
  isLoadingPastEvents = true;
  isLoadingUpcomingEvents = true;
  isLoading = true;

  eventForSchema = [];

  upcomingEvents = [];
  pastEvents = [];
  faMapPin = faMapPin;
  faCalendarDays = faCalendarDays;
  faCalendarCheck = faCalendarCheck;
  EEventType = EEventType;
  pastEventsCount = 0;

  count = 9;
  page = 1;
  total = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private eventsService: EventsService,
    private seoService: SeoService,
    private router: Router,
  ) {}

  ngOnInit() {
    const params = this.activatedRoute.snapshot.queryParams;
    if (Object.keys(params).length > 0) {
      if (params.page) {
        this.page = Number(params.page);
      }
    }

    this.activatedRoute.parent.data.subscribe((data) => {
      this.community = data.community;
      this.getUpcomingEvents();
      this.getPastEvents();
    });
  }

  getPastEvents() {
    this.isLoadingPastEvents = true;
    this.eventsService.pGetCommunityEvents('past', this.community.id, this.page, this.count).subscribe((data) => {
      this.pastEvents = data.values;
      this.pastEventsCount = data.total;
      this.isLoadingPastEvents = false;
      if (!this.isLoadingUpcomingEvents && !this.isLoadingPastEvents) {
        this.setSchema();
        this.setMetaTags();
      }
      this.total = data.total;
      this.page = data.page;
      this.count = data.count;
      this.isLoading = false;
    });
  }

  onPastEventsPageChange(page: number) {
    this.page = page;
    this.router.navigate([], { queryParams: { page: this.page } });
    this.getPastEvents();
  }

  getUpcomingEvents() {
    this.isLoadingUpcomingEvents = true;
    this.eventsService.pGetCommunityEvents('future', this.community.id).subscribe((data) => {
      this.upcomingEvents = data.values;
      this.isLoadingUpcomingEvents = false;
      if (!this.isLoadingUpcomingEvents && !this.isLoadingPastEvents) {
        this.setSchema();
        this.setMetaTags();
      }
    });
  }

  private setMetaTags() {
    const upcomingNames = this.upcomingEvents.map((event) => event.name).join(', ');

    let description = `Explore all events by ${this.community?.name}. Join now to stay updated.`;

    if (this.upcomingEvents?.length > 0 && this.pastEventsCount > 0) {
      description = `${this.community?.name} has ${upcomingNames} in upcoming events and ${this.pastEventsCount} past events. Join now to stay updated.`;
    } else if (this.upcomingEvents?.length > 0) {
      description = `${this.community?.name} has ${upcomingNames} in upcoming events. Join now to stay updated.`;
    } else if (this.pastEventsCount > 0) {
      description = `${this.community?.name} has organized ${this.pastEventsCount} past events. Join now to stay updated.`;
    }

    this.seoService.setTags(`Events | ${this.community?.name}`, description);
  }

  setSchema() {
    const events = [...this.upcomingEvents, ...this.pastEvents];
    if (events.length > 0) {
      this.eventForSchema = [];

      for (const event of events) {
        let location: object, eventStatus: string;
        if (event.event_type === EEventType.OFFLINE || event.custom_agenda === true) {
          location = {
            '@type': 'Place',
            name: event.event_locations[0] ? event.event_locations[0].name : '',
            address: event.event_locations[0] ? event.event_locations[0].address : '',
          };
          eventStatus = 'OfflineEventAttendanceMode';
        } else {
          location = {
            '@type': 'VirtualLocation',
            url: environment.app_url + '/communities/' + event.kommunity_slug + '/events/' + event.slug,
          };
          eventStatus = 'OnlineEventAttendanceMode';
        }
        this.eventForSchema.push({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: event.name,
          image: event.header_image_path ? event.header_image_path : this.community.logo_image_path.url,
          description: removeHtmlTags(event.description).substring(0, 200),
          startDate: event.start_time,
          endDate: event.end_time,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/' + eventStatus,
          location: location,
          organizer: {
            '@type': 'Organization',
            name: this.community.name,
            url: environment.app_url + '/communities/' + this.community.slug,
          },
          performer: {
            '@type': 'PerformingGroup',
            name: this.community.name,
          },
          offers: {
            '@type': 'Offer',
            name: event.name,
            url: environment.app_url + '/communities/' + this.community.slug + '/events/' + event.slug,
          },
        });
      }

      this.seoService.setSchema(this.eventForSchema);
    }
  }
}
