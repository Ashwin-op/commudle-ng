import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IUser } from '@commudle/shared-models';
import { UserHackathonsService } from '@commudle/shared-services';
import { IUserHackathon } from '@commudle/shared-models';
import { faCode, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { UserProfileMenuService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-menu.service';

@Component({
  selector: 'commudle-user-hackathons',
  templateUrl: './user-hackathons.component.html',
  styleUrls: ['./user-hackathons.component.scss'],
  standalone: false,
})
export class UserHackathonsComponent implements OnInit, OnDestroy {
  @Input() user: IUser;

  hackathonEntries: IUserHackathon[] = [];
  isLoading = true;
  icons = { faCode, faTrophy };

  private subscriptions: Subscription[] = [];

  constructor(
    private userHackathonsService: UserHackathonsService,
    private userProfileMenuService: UserProfileMenuService,
  ) {}

  ngOnInit(): void {
    this.fetchHackathons();
  }

  fetchHackathons(): void {
    this.subscriptions.push(
      this.userHackathonsService.participatedAndWon(this.user.username).subscribe((data) => {
        this.hackathonEntries = data.values;
        this.isLoading = false;
        this.userProfileMenuService.addMenuItem('hackathonsParticipated', this.hackathonEntries.length > 0);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
