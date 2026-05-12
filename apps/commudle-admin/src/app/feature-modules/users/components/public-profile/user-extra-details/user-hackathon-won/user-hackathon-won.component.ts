import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IUser } from '@commudle/shared-models';
import { UserHackathonsService } from '@commudle/shared-services';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { UserProfileMenuService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-menu.service';

export interface IHackathonWon {
  hackathon: IHackathon;
  prizes: string[];
}

@Component({
  selector: 'app-user-hackathon-won',
  templateUrl: './user-hackathon-won.component.html',
  styleUrls: ['./user-hackathon-won.component.scss'],
  standalone: false,
})
export class UserHackathonWonComponent implements OnInit, OnDestroy {
  @Input() user: IUser;

  wonHackathons: IHackathonWon[] = [];
  isLoading = true;
  faTrophy = faTrophy;

  private subscriptions: Subscription[] = [];

  constructor(
    private userHackathonsService: UserHackathonsService,
    private userProfileMenuService: UserProfileMenuService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.userHackathonsService.won(this.user.username).subscribe((data) => {
        this.wonHackathons = data.values;
        this.isLoading = false;
        this.userProfileMenuService.addMenuItem('hackathonsWon', this.wonHackathons.length > 0);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
