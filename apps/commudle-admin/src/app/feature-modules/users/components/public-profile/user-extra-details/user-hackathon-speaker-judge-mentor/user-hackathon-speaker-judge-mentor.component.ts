import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IUser } from '@commudle/shared-models';
import { IHackathonJudge } from '@commudle/shared-models';
import { faTrophy, faUsers, faMicrophone, faCalendarAlt, faGavel } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { UserProfileMenuService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-menu.service';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';

@Component({
  selector: 'commudle-user-hackathon-speaker-judge-mentor',
  templateUrl: './user-hackathon-speaker-judge-mentor.component.html',
  styleUrls: ['./user-hackathon-speaker-judge-mentor.component.scss'],
  standalone: false,
})
export class UserHackathonSpeakerJudgeMentorComponent implements OnInit, OnDestroy {
  @Input() user: IUser;

  judges: IHackathonJudge[] = [];
  isLoading = true;
  icons = { faTrophy, faUsers, faMicrophone, faCalendarAlt, faGavel };

  private subscriptions: Subscription[] = [];

  constructor(private appUsersService: AppUsersService, private userProfileMenuService: UserProfileMenuService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.appUsersService.speakerJudgeMentor(this.user.username).subscribe((data) => {
        this.judges = data.values;
        this.isLoading = false;
        this.userProfileMenuService.addMenuItem('hackathonsMentored', this.judges.length > 0);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  getRoleIcon(judgeType: string) {
    switch (judgeType) {
      case 'judge':
        return this.icons.faGavel;
      case 'mentor':
        return this.icons.faUsers;
      case 'speaker':
        return this.icons.faMicrophone;
      default:
        return this.icons.faGavel;
    }
  }

  getRoleLabel(judgeType: string): string {
    switch (judgeType) {
      case 'judge':
        return 'Judge';
      case 'mentor':
        return 'Mentor';
      case 'speaker':
        return 'Speaker';
      default:
        return judgeType;
    }
  }
}
