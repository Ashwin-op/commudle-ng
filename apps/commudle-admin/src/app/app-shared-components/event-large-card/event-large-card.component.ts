import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IEvent } from 'apps/shared-models/event.model';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { NbCardModule, NbIconModule, NbButtonModule } from '@commudle/theme';
import { BadgeComponent } from 'apps/shared-components/badge/badge.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapPin } from '@fortawesome/free-solid-svg-icons';
import * as moment from 'moment';
import * as momentTimezone from 'moment-timezone';
import { ICommunity } from 'apps/shared-models/community.model';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';

@Component({
  selector: 'commudle-event-large-card',
  standalone: true,
  imports: [
    CommonModule,
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    SharedComponentsModule,
    BadgeComponent,
    FontAwesomeModule,
  ],
  templateUrl: './event-large-card.component.html',
  styleUrl: './event-large-card.component.scss',
})
export class EventLargeCardComponent implements OnInit {
  @Input() event: IEvent;
  @Input() hostCommunity: ICommunity;
  community: ICommunity;
  moment = moment;
  momentTimezone = momentTimezone;
  faMapPin = faMapPin;

  constructor(private communitiesService: CommunitiesService) {}

  ngOnInit(): void {
    this.getCommunity();
  }

  getCommunity() {
    const eventCommunityId = this.event.kommunity ? this.event.kommunity.id : this.event.kommunity_id;
    this.communitiesService.pGetCommunityDetails(eventCommunityId).subscribe((data) => {
      this.community = data;
    });
  }
}
