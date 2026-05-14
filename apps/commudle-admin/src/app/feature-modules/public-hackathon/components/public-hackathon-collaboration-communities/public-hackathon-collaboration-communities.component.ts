import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { faLink, faUsers } from '@fortawesome/free-solid-svg-icons';
import { ICommunity } from '@commudle/shared-models';
import { IHackathon } from '@commudle/shared-models';
import { HackathonCollaborationCommunitiesService } from '@commudle/shared-services';
import { IHackathonCollaborationCommunity } from '@commudle/shared-models';

@Component({
  standalone: false,
  selector: 'commudle-public-hackathon-collaboration-communities',
  templateUrl: './public-hackathon-collaboration-communities.component.html',
  styleUrls: ['./public-hackathon-collaboration-communities.component.scss'],
})
export class PublicHackathonCollaborationCommunitiesComponent implements OnInit, OnChanges {
  @Input() community: ICommunity;
  @Input() hackathon: IHackathon;
  @Output() hasCollaborationCommunities = new EventEmitter<boolean>();

  faLink = faLink;
  faUsers = faUsers;
  collaborationCommunities: IHackathonCollaborationCommunity[] = [];

  constructor(private hackathonCollaborationCommunitiesService: HackathonCollaborationCommunitiesService) {}

  ngOnInit() {
    this.getCollaborations();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.hackathon?.firstChange) {
      this.collaborationCommunities = [];
      this.getCollaborations();
    }
  }

  getCollaborations() {
    this.hackathonCollaborationCommunitiesService.pGet(this.hackathon.id).subscribe((data) => {
      this.collaborationCommunities = data;
      if (this.collaborationCommunities.length > 0) {
        this.hasCollaborationCommunities.emit(true);
      }
    });
  }
}
