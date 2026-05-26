import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NbButtonAppearance, NbComponentStatus } from '@commudle/theme';
import { UserChatsService } from 'apps/commudle-admin/src/app/feature-modules/user-chats/services/user-chats.service';
import { IUser } from '@commudle/shared-models';
import { faBriefcase } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-user-profile-card-large',
  templateUrl: './user-profile-card-large.component.html',
  styleUrls: ['./user-profile-card-large.component.scss'],
  standalone: false,
})
export class UserProfileCardLargeComponent {
  @Input() user: IUser;
  @Input() showRoleDesignation = false;
  @Input() maxNameLength = 50;
  @Input() maxUserNameLength = 20;
  @Input() truncateDesignation = true;
  @Input() showFollowButton = false;
  @Input() alignFollowToRight = false;
  @Input() showAbout = false;
  @Input() showSocialLinks = false;
  @Input() activateMiniProfileDirective = true;
  @Input() horizontalScroll = false;
  @Input() isMobileWidthFull = false;
  @Input() showSpeakersCount = false;
  @Input() showHiringLookingTags = true;
  @Input() appearanceOfFollowButton: NbButtonAppearance = 'filled';
  @Input() statusOfFollowButton: NbComponentStatus = 'info';
  @Input() isFollowButtonRound = false;
  @Input() alignSpeakerCountToRight = false;
  @Input() showFollowersCount = false;
  @Input() showLeaderBadgeToNameHeader = false;
  @Input() showCompanyName = false;
  @Input() showLeaderBadgeToSpeakerCount = false;
  @Input() showMutuals = false;
  @Output() componentClicked = new EventEmitter();

  faBriefcase = faBriefcase;

  constructor(private userChatsService: UserChatsService) {}

  openChatWithUser() {
    this.userChatsService.changeFollowerId(this.user.id);
  }

  profileClicked() {
    this.componentClicked.emit(true);
  }
}
