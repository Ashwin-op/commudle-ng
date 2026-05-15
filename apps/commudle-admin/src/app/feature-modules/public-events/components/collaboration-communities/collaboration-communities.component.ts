import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { ICommunity, IEvent } from '@commudle/shared-models';
import { EventCollaborationCommunitiesService } from 'apps/commudle-admin/src/app/services/event-collaboration-communities.service';
import { IEventCollaborationCommunity } from 'apps/shared-models/event_collaboration_community.model';

@Component({
  selector: 'app-collaboration-communities',
  templateUrl: './collaboration-communities.component.html',
  styleUrls: ['./collaboration-communities.component.scss'],
  standalone: false,
})
export class CollaborationCommunitiesComponent implements OnInit, OnChanges {
  @Input() community: ICommunity;
  @Input() event: IEvent;
  @Output() hasCollaborationCommunities = new EventEmitter();

  faLink = faLink;
  collaborationCommunities: IEventCollaborationCommunity[] = [];

  summary = {
    totalCommunities: 0,
    combinedMembers: 0,
  };

  constructor(private eventCollaborationCommunitiesService: EventCollaborationCommunitiesService) {}

  ngOnInit() {
    this.getCollaborations();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.event?.firstChange) {
      this.collaborationCommunities = [];
      this.getCollaborations();
    }
  }

  getCollaborations() {
    this.eventCollaborationCommunitiesService.pGet(this.event.id).subscribe((data) => {
      this.collaborationCommunities = data.event_collaboration_communities;
      this.summary.totalCommunities = this.collaborationCommunities.length;
      this.summary.combinedMembers = this.collaborationCommunities.reduce(
        (acc, c) => acc + (c.community.members_count ?? 0),
        0,
      );
      if (this.collaborationCommunities.length > 0) {
        this.hasCollaborationCommunities.emit(true);
      }
    });
  }
}
