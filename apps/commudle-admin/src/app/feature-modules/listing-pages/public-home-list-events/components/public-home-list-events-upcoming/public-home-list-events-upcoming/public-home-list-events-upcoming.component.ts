import { AfterViewInit, Component, OnInit } from '@angular/core';
import { faCalendarDays, faLink } from '@fortawesome/free-solid-svg-icons';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { ICommunity } from 'apps/shared-models/community.model';
import { IEvent } from 'apps/shared-models/event.model';
import { IPageInfo } from 'apps/shared-models/page-info.model';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { SeoService } from 'apps/shared-services/seo.service';
import { removeHtmlTags } from '@commudle/shared-services';
import { ActivatedRoute } from '@angular/router';
import { EEventType } from '@commudle/shared-models';
@Component({
  selector: 'commudle-public-home-list-events-upcoming',
  templateUrl: './public-home-list-events-upcoming.component.html',
  styleUrls: ['./public-home-list-events-upcoming.component.scss'],
  standalone: false,
})
export class PublicHomeListEventsUpcomingComponent implements OnInit, AfterViewInit {
  community: ICommunity;
  upcomingEvents: IEvent[] = [];
  faCalendarDays = faCalendarDays;
  faLink = faLink;
  eventForSchema = [];
  page_info: IPageInfo;
  total: number;
  limit = 20;

  isLoadingUpcoming = true;
  showSpinner = false;
  EEventType = EEventType;

  constructor(
    private eventsService: EventsService,
    private seoService: SeoService,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.getUpcomingEvents();
  }

  ngAfterViewInit() {
    // TODO optimize this
    this.activatedRoute.fragment.subscribe((fragment) => {
      if (fragment) {
        setTimeout(() => {
          const element = document.querySelector('#' + fragment);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
            });
          }
        }, 500);
      }
    });
  }

  getUpcomingEvents() {
    this.showSpinner = true;
    this.eventsService.getEventsList('future', this.limit, this.page_info?.end_cursor).subscribe((data) => {
      if (data) {
        this.upcomingEvents = this.upcomingEvents.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
        this.total = data.total;
        this.page_info = data.page_info;
        this.isLoadingUpcoming = false;
        this.showSpinner = false;
        this.setSchema();
      }
    });
  }

  setSchema() {
    for (const event of this.upcomingEvents) {
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
        description: removeHtmlTags(event.description).substring(0, 200),
        image: event.header_image_path ? event.header_image_path : event.kommunity.logo_image_path.url,
        startDate: event.start_time,
        endDate: event.end_time,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/' + eventStatus,
        location: location,
        organizer: {
          '@type': 'Organization',
          name: event.kommunity.name,
          url: environment.app_url + '/communities/' + event.kommunity_slug,
        },
        offers: {
          '@type': 'Offer',
          name: event.name,
          url: environment.app_url + '/communities/' + event.kommunity_slug + '/events/' + event.slug,
        },
      });
    }

    this.seoService.setSchema(this.eventForSchema);
  }
}
