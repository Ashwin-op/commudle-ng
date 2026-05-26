import { Router, RouterModule } from '@angular/router';
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faUsers } from '@fortawesome/free-solid-svg-icons';
import { CommudleCardModule } from '@commudle/commudle-theme';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import * as moment from 'moment';
import { IEvent } from 'apps/shared-models/event.model';
import { ICommunity } from 'apps/shared-models/community.model';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';

@Component({
  selector: 'commudle-event-card',
  templateUrl: './event-card.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CommudleCardModule,
    SharedComponentsModule,
    FontAwesomeModule,
    SharedDirectivesModule,
  ],
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent implements OnInit {
  @Input() event: IEvent;
  @Input() horizontalScroll = false;
  @Input() hideCommunityNameBadge = false;
  @Input() showCollaborationTag = false;
  @Input() hostCommunity: ICommunity;
  community: ICommunity;
  staticAssets = staticAssets;
  faCircleCheck = faCircleCheck;
  faUsers = faUsers;

  moment = moment;
  constructor(private communitiesService: CommunitiesService, private router: Router) {}

  ngOnInit(): void {
    this.getCommunity();
  }

  getCommunity() {
    const eventCommunityId = this.event.kommunity ? this.event.kommunity.id : this.event.kommunity_id;
    this.communitiesService.pGetCommunityDetails(eventCommunityId).subscribe((data) => {
      this.community = data;
    });
  }

  goToSpeakerSlides(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/speaker-resources', this.event.speaker_resource.id]);
  }
}
