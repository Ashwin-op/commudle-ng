/* eslint-disable @nx/enforce-module-boundaries */
import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { IHackathon, EHackathonLocationType } from 'apps/shared-models/hackathon.model';
import { faGlobe, faAward, faCalendarDays, faClock, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { AuthService, countries_details } from '@commudle/shared-services';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { EHackathonStatus, ICommunity, IHackathonTeam, IUser } from '@commudle/shared-models';
import { Subject, takeUntil } from 'rxjs';
import * as moment from 'moment';
import * as momentTimezone from 'moment-timezone';
@Component({
  selector: 'commudle-public-hackathon-details-mini-card',
  templateUrl: './public-hackathon-details-mini-card.component.html',
  styleUrls: ['./public-hackathon-details-mini-card.component.scss'],
  standalone: false,
})
export class PublicHackathonDetailsMiniCardComponent implements OnInit, OnDestroy {
  @Input() hackathon: IHackathon;
  @Input() community: ICommunity;
  @Input() hrgId: number;
  @Input() isOrganizer = false;
  @Input() showName = true;
  @Input() showStatusBadge = true;
  @Input() showCommunityBadge = true;
  @Input() showPrizeHeader = true;
  @Input() showCountdown = true;
  @Input() showDatesRow = true;
  @Input() showInterestedMembers = true;
  @Input() showApplySection = true;
  @Input() showLocation = true;
  userTeamDetails: IHackathonTeam[];
  currentUser: IUser;
  currentDate: Date;
  hackathonApplicationStartDate: Date;
  hackathonApplicationEndDate: Date;
  icons = {
    faGlobe,
    faAward,
    faCalendarDays,
    faClock,
    faCircleCheck,
  };

  moment = moment;
  momentTimezone = momentTimezone;

  EHackathonLocationType = EHackathonLocationType;
  EHackathonStatus = EHackathonStatus;
  totalPrizesByCurrency: { currency: any; amount: number }[];
  countryDetails = countries_details;
  users: IUser[];
  totalUsers: number;
  hackathonStatus: string;
  daysLeft: number;
  countdownDays: number;
  countdownHours: number;
  countdownMinutes: number;
  countdownSeconds: number;
  countdownFlip = { days: false, hours: false, minutes: false, seconds: false };
  private countdownInterval: any;

  private destroy$ = new Subject<void>();
  isBrowser: boolean;

  constructor(
    private hackathonService: HackathonService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.fetchInterestedMembers();
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data) this.getTeamDetails();
      this.currentUser = data;
    });
    if (this.hackathon.application_start_date && this.hackathon.application_end_date)
      this.calculateHackathonDatesStatus();
    if (this.hackathon.total_prize_amount) {
      this.totalPrizesByCurrency = Object.keys(this.hackathon.total_prize_amount).map((currency) => ({
        currency: this.countryDetails.find((detail) => detail.currency === currency) || {
          currency: currency,
          symbol: currency,
        },
        amount: this.hackathon.total_prize_amount[currency],
      }));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  getTeamDetails() {
    this.hackathonService
      .getHackathonCurrentRegistrationDetails(this.hackathon.id)
      .subscribe((data: IHackathonTeam[]) => {
        this.userTeamDetails = data;
      });
  }

  calculateHackathonDatesStatus() {
    this.currentDate = new Date();
    this.hackathonApplicationStartDate = new Date(this.hackathon.application_start_date);
    this.hackathonApplicationEndDate = new Date(this.hackathon.application_end_date);
    if (this.currentDate < this.hackathonApplicationStartDate) {
      this.hackathonStatus = 'Upcoming';
    } else if (
      this.currentDate >= this.hackathonApplicationStartDate &&
      this.currentDate <= this.hackathonApplicationEndDate
    ) {
      this.hackathonStatus = 'Outgoing';
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const difference = this.hackathonApplicationEndDate.getTime() - this.currentDate.getTime();
      this.daysLeft = Math.ceil(difference / millisecondsPerDay);
      if (this.isBrowser) {
        this.startCountdown();
      }
    } else if (this.currentDate > this.hackathonApplicationEndDate) {
      this.hackathonStatus = 'Closed';
    }
  }

  startCountdown() {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = this.hackathonApplicationEndDate.getTime();
      const diff = end - now;

      if (diff <= 0) {
        this.countdownDays = 0;
        this.countdownHours = 0;
        this.countdownMinutes = 0;
        this.countdownSeconds = 0;
        clearInterval(this.countdownInterval);
        this.hackathonStatus = 'Closed';
        return;
      }

      const newDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const newHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const newMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const newSeconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Trigger flip animation on value change
      if (this.countdownSeconds !== undefined) {
        this.countdownFlip.seconds = newSeconds !== this.countdownSeconds;
        this.countdownFlip.minutes = newMinutes !== this.countdownMinutes;
        this.countdownFlip.hours = newHours !== this.countdownHours;
        this.countdownFlip.days = newDays !== this.countdownDays;

        // Reset flip after animation duration
        setTimeout(() => {
          this.countdownFlip = { days: false, hours: false, minutes: false, seconds: false };
        }, 700);
      }

      this.countdownDays = newDays;
      this.countdownHours = newHours;
      this.countdownMinutes = newMinutes;
      this.countdownSeconds = newSeconds;
    };

    updateCountdown();
    this.countdownInterval = setInterval(updateCountdown, 1000);
  }

  fetchInterestedMembers() {
    this.hackathonService.pInterestedUsers(this.hackathon.id).subscribe((data) => {
      this.users = data.users;
      this.totalUsers = data.total_count;
    });
  }
}
