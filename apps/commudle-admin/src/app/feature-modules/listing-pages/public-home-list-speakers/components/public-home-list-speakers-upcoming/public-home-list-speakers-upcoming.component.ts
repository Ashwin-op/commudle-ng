import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommunityGroupsService } from 'apps/commudle-admin/src/app/services/community-groups.service';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { ICommunity } from 'apps/shared-models/community.model';
import { IEvent } from 'apps/shared-models/event.model';
import { IPageInfo } from 'apps/shared-models/page-info.model';
import { EDbModels, EEventType } from '@commudle/shared-models';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { SeoService } from 'apps/shared-services/seo.service';
import { removeHtmlTags } from '@commudle/shared-services';

@Component({
  selector: 'commudle-public-home-list-speakers-upcoming',
  templateUrl: './public-home-list-speakers-upcoming.component.html',
  styleUrls: ['./public-home-list-speakers-upcoming.component.scss'],
  standalone: false,
})
export class PublicHomeListSpeakersUpcomingComponent implements OnInit {
  @Input() parentType = EDbModels.KOMMUNITY;
  community: ICommunity[] = [];
  communityGroup: ICommunityGroup;
  upcomingEvents: IEvent[] = [];
  showSpinner = false;
  pageInfo: IPageInfo;
  total: number;
  limit = 5;
  page_info: IPageInfo;
  eventForSchema = [];
  EEventType = EEventType;

  constructor(
    private eventsService: EventsService,
    private communityGroupsService: CommunityGroupsService,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
  ) {}

  ngOnInit(): void {
    if (this.parentType === EDbModels.KOMMUNITY) {
      this.getUpcomingEvents();
    } else if (this.parentType === EDbModels.COMMUNITY_GROUP) {
      this.activatedRoute.parent.data.subscribe((data) => {
        this.communityGroup = data.community_group;
        this.getCommunityGroupEvents();
      });
    }
  }

  getUpcomingEvents() {
    this.showSpinner = true;
    this.eventsService.getEventsList('future', this.limit, this.pageInfo?.end_cursor).subscribe((data) => {
      if (data) {
        this.upcomingEvents = this.upcomingEvents.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
        this.total = data.total;
        this.pageInfo = data.page_info;
        this.showSpinner = false;
        this.setSchema();
      }
    });
  }

  getCommunityGroupEvents() {
    this.showSpinner = true;
    this.communityGroupsService
      .pEvents(this.communityGroup.slug, this.limit, this.page_info?.end_cursor, 'future')
      .subscribe((data) => {
        this.upcomingEvents = this.upcomingEvents.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
        this.page_info = data.page_info;
        this.showSpinner = false;
        this.setSchema();
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
