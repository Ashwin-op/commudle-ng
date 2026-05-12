import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { IUser } from '@commudle/shared-models';
import { UserHackathonsService } from '@commudle/shared-services';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { faCode } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { UserProfileMenuService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-menu.service';

@Component({
  selector: 'app-user-hackathon-participated',
  templateUrl: './user-hackathon-participated.component.html',
  styleUrls: ['./user-hackathon-participated.component.scss'],
  standalone: false,
})
export class UserHackathonParticipatedComponent implements OnInit, OnDestroy {
  @Input() user: IUser;

  hackathons: IHackathon[] = [];
  isLoading = true;
  faCode = faCode;

  private subscriptions: Subscription[] = [];

  constructor(
    private userHackathonsService: UserHackathonsService,
    private userProfileMenuService: UserProfileMenuService,
  ) {}

  ngOnInit(): void {
    this.fetchParticipated();
  }

  fetchParticipated(): void {
    this.subscriptions.push(
      this.userHackathonsService.participated(this.user.username).subscribe((data) => {
        this.hackathons = [...this.hackathons, ...data.values];
        this.isLoading = false;
        this.userProfileMenuService.addMenuItem('hackathonsParticipated', this.hackathons.length > 0);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
