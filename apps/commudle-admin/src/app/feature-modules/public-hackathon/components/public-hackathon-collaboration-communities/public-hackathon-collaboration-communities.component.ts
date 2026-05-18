import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { ICommunity, IHackathon, IHackathonCollaborationCommunity } from '@commudle/shared-models';
import { HackathonCollaborationCommunitiesService, ILogoTint, LogoTintService } from '@commudle/shared-services';

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
  collaborationCommunities: IHackathonCollaborationCommunity[] = [];
  logoTints: Record<number, ILogoTint> = {};

  summary = {
    totalCommunities: 0,
    combinedMembers: 0,
  };

  constructor(
    private hackathonCollaborationCommunitiesService: HackathonCollaborationCommunitiesService,
    private logoTintService: LogoTintService,
  ) {}

  ngOnInit() {
    this.getCollaborations();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.hackathon?.firstChange) {
      this.collaborationCommunities = [];
      this.logoTints = {};
      this.getCollaborations();
    }
  }

  getCollaborations() {
    this.hackathonCollaborationCommunitiesService.pGet(this.hackathon.id).subscribe((data) => {
      this.collaborationCommunities = data;
      this.summary.totalCommunities = this.collaborationCommunities.length;
      this.summary.combinedMembers = this.collaborationCommunities.reduce(
        (acc, c) => acc + (c.community.members_count ?? 0),
        0,
      );
      if (this.collaborationCommunities.length > 0) {
        this.hasCollaborationCommunities.emit(true);
      }
      this.resolveLogoTints();
    });
  }

  private resolveLogoTints(): void {
    this.logoTintService
      .resolveTints(
        this.collaborationCommunities.map((cc) => ({
          id: cc.community.id,
          logo: cc.community,
        })),
      )
      .then((tints) => {
        this.logoTints = tints;
      });
  }
}
