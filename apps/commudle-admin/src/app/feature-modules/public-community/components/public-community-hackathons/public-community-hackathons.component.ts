import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EDbModels, ICommunity } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { environment } from '@commudle/shared-environments';

@Component({
  selector: 'commudle-public-community-hackathons',
  templateUrl: './public-community-hackathons.component.html',
  styleUrls: ['./public-community-hackathons.component.scss'],
})
export class PublicCommunityHackathonsComponent implements OnInit, OnDestroy {
  EDbModels = EDbModels;
  subscriptions: Subscription[] = [];
  community: ICommunity;
  upcomingHackathons: IHackathon[];
  pastHackathons: IHackathon[];
  moment = moment;
  seoDescription: string;
  schemaForHackathon = [];
  environment = environment;

  constructor(
    private hackathonService: HackathonService,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.community = data.community;
        this.fetchHackathonIndex();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  fetchHackathonIndex() {
    this.getUpcomingHackathons();
    this.getPastHackathons();
  }

  getUpcomingHackathons() {
    this.subscriptions.push(
      this.hackathonService.pIndexHackathons(this.community.id, EDbModels.KOMMUNITY, 'future').subscribe((data) => {
        this.upcomingHackathons = data.values;
        this.setSeoService();
        this.setSchema(this.upcomingHackathons);
      }),
    );
  }

  getPastHackathons() {
    this.subscriptions.push(
      this.hackathonService.pIndexHackathons(this.community.id, EDbModels.KOMMUNITY, 'past').subscribe((data) => {
        this.pastHackathons = data.values;
        this.setSeoService();
        this.setSchema(this.pastHackathons);
      }),
    );
  }

  setSeoService() {
    if (this.upcomingHackathons.length > 0 && this.upcomingHackathons[0].start_date) {
      const startDate = new Date(this.upcomingHackathons[0].start_date);
      const date = startDate.toDateString();
      this.seoDescription =
        'Participate in hackathons by ' +
        this.community.name +
        ' Upcoming hackathon ' +
        this.upcomingHackathons[0].name +
        ' on ' +
        date;
    } else {
      this.seoDescription = 'Participate in hackathons by ' + this.community.name;
    }

    this.seoService.setTags(
      'Hackathons - ' + this.community.name,
      this.seoDescription,
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  setSchema(hackathons) {
    for (const hackathon of hackathons) {
      if (hackathon.start_date) {
        let location: object, hackathonStatus: string;
        if (hackathon.hackathon_location_type === 'offline') {
          location = {
            '@type': 'Place',
            name: hackathon.location_name,
            address: hackathon.location_address,
          };
          hackathonStatus = 'OfflineEventAttendanceMode';
        } else {
          location = {
            '@type': 'VirtualLocation',
            url: environment.app_url + '/communities/' + hackathon.community.slug + '/hackathons/' + hackathon.slug,
          };
          hackathonStatus = 'OnlineEventAttendanceMode';
        }
        this.schemaForHackathon.push({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: hackathon.name,
          description: hackathon.description.replace(/<[^>]*>/g, '').substring(0, 200),
          image: hackathon.banner_image ? hackathon.banner_image.url : this.community?.logo_image_path.url,
          startDate: hackathon.start_date,
          endDate: hackathon.end_date,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/' + hackathonStatus,
          location: location,
          organizer: {
            '@type': 'Organization',
            name: hackathon.name,
            url: environment.app_url + '/communities/' + hackathon.community.slug,
          },
        });
      }
    }
    this.seoService.setSchema(this.schemaForHackathon);
  }
}
