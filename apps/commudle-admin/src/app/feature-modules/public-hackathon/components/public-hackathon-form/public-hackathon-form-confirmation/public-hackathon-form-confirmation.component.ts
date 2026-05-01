import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  EInvitationStatus,
  IHackathon,
  IHackathonUserResponse,
  IProfileCompletionStatus,
  IUser,
  IUserStat,
} from '@commudle/shared-models';
import { ActivatedRoute } from '@angular/router';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { SeoService, AuthService, AppUsersService } from '@commudle/shared-services';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { IHackathonResponseGroup } from 'apps/shared-models/hackathon-response-group.model';

@Component({
  standalone: false,
  selector: 'commudle-public-hackathon-form-confirmation',
  templateUrl: './public-hackathon-form-confirmation.component.html',
  styleUrl: './public-hackathon-form-confirmation.component.scss',
})
export class PublicHackathonFormConfirmationComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  hackathonUserResponse: IHackathonUserResponse;
  hackathonResponseGroup: IHackathonResponseGroup;
  isLoading = true;
  currentUser: IUser;
  EInvitationStatus = EInvitationStatus;
  userProfileDetails: IUserStat;
  isProfileCompleted = false;
  subscriptions: Subscription[] = [];
  isLoadingHackathonJudges = false;
  hackathonJudges = [];
  hackathonSlug: string;
  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private seoService: SeoService,
    private authService: AuthService,
    private appUsersService: AppUsersService,
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.hackathonSlug = params.hackathon_id;
      this.fetchHackathonDetails();
      this.getJudges();
    });
    this.fetchCurrentUserDetails();
    this.seoService.noIndex(true);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  fetchHackathonDetails() {
    this.isLoading = true;
    this.subscriptions.push(
      this.hackathonService.pShowHackathon(this.hackathonSlug).subscribe((data) => {
        this.hackathon = data;
        this.seoService.setTitle(`Registration Confirmed | ${this.hackathon.name}`);
        this.isLoading = false;
      }),
    );
  }

  private fetchCurrentUserDetails() {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser: IUser) => {
      this.currentUser = currentUser;
      this.fetchUserStats();
      this.getProfileCompletionStatus();
    });
  }

  private fetchUserStats() {
    this.appUsersService.getProfileStats().subscribe((data) => {
      this.userProfileDetails = data;
    });
  }

  private getProfileCompletionStatus() {
    this.appUsersService.profileCompletionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status: IProfileCompletionStatus) => {
        if (status) {
          this.isProfileCompleted = !status.completed;
        }
      });
  }

  getJudges() {
    this.isLoadingHackathonJudges = true;
    this.subscriptions.push(
      this.hackathonService.pIndexJudge(this.hackathonSlug).subscribe((data) => {
        this.hackathonJudges = data;
        this.isLoadingHackathonJudges = false;
      }),
    );
  }
}
