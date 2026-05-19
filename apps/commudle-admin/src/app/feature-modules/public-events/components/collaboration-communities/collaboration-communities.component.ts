import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { ICommunity, IEvent } from '@commudle/shared-models';
import { ILogoTint, LogoTintService } from '@commudle/shared-services';
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
  logoTints: Record<number, ILogoTint> = {};

  summary = {
    totalCommunities: 0,
    combinedMembers: 0,
  };

  constructor(
    private eventCollaborationCommunitiesService: EventCollaborationCommunitiesService,
    private logoTintService: LogoTintService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.getCollaborations();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.event?.firstChange) {
      this.collaborationCommunities = [];
      this.logoTints = {};
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
        this.cdr.detectChanges();
      });
  }
}
