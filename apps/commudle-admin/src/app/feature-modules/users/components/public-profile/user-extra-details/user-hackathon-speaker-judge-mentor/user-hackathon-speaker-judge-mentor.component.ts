import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IUser } from '@commudle/shared-models';
import { UserHackathonsService } from '@commudle/shared-services';
import { faGavel, faUsers, faMicrophone, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { UserProfileMenuService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-menu.service';

export interface ISpeakerJudgeMentorEntry {
  id: number;
  name: string;
  judge_type: string;
  hackathon: any;
}

@Component({
  selector: 'app-user-hackathon-speaker-judge-mentor',
  templateUrl: './user-hackathon-speaker-judge-mentor.component.html',
  styleUrls: ['./user-hackathon-speaker-judge-mentor.component.scss'],
  standalone: false,
})
export class UserHackathonSpeakerJudgeMentorComponent implements OnInit, OnDestroy {
  @Input() user: IUser;

  entries: ISpeakerJudgeMentorEntry[] = [];
  isLoading = true;
  icons = { faGavel, faUsers, faMicrophone, faCalendarAlt };

  private subscriptions: Subscription[] = [];

  constructor(
    private userHackathonsService: UserHackathonsService,
    private userProfileMenuService: UserProfileMenuService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.userHackathonsService.speakerJudgeMentor(this.user.username).subscribe((data) => {
        this.entries = data.values;
        this.isLoading = false;
        this.userProfileMenuService.addMenuItem('hackathonsMentored', this.entries.length > 0);
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
