/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { faTrophy, faLayerGroup, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Subject, Subscription, takeUntil } from 'rxjs';

import { ICommunity, IHackathonPrize, IHackathonTeam } from '@commudle/shared-models';
import { AuthService, countries_details as countryDetails } from '@commudle/shared-services';
import { HackathonResponseGroupService } from 'apps/commudle-admin/src/app/services/hackathon-response-group.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathon } from 'apps/shared-models/hackathon.model';

@Component({
  selector: 'commudle-public-hackathon-prizes',
  templateUrl: './public-hackathon-prizes.component.html',
  styleUrls: ['./public-hackathon-prizes.component.scss'],
  standalone: false,
})
export class PublicHackathonPrizesComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  community: ICommunity;
  hackathonPrizes: IHackathonPrize[];
  isLoading = true;
  userTeamDetails: IHackathonTeam[];
  hrgId: number;
  icons = { faTrophy, faLayerGroup, faUsers };
  subscriptions: Subscription[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private hrgService: HackathonResponseGroupService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        this.community = data.community;
        this.getPrizes();
      }),
    );
    this.hrgService.pShowHackathonResponseGroup(this.hackathon.id).subscribe((data) => {
      if (data) this.hrgId = data.id;
    });
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser) => {
      if (currentUser) this.getHackathonCurrentRegistrationDetails();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPrizes() {
    this.subscriptions.push(
      this.hackathonService.pIndexPrizes(this.hackathon.id).subscribe((data) => {
        this.hackathonPrizes = data;
        this.hackathonPrizes.forEach((prize) => {
          const prizeCurrencySymbol = countryDetails.find((detail) => detail.currency === prize.currency_type) || {
            symbol: prize.currency_type,
          };
          prize.currency_symbol = prizeCurrencySymbol?.symbol || prize.currency_type;
        });
        this.isLoading = false;
      }),
    );
  }

  getHackathonCurrentRegistrationDetails() {
    this.subscriptions.push(
      this.hackathonService
        .getHackathonCurrentRegistrationDetails(this.hackathon.id)
        .subscribe((data: IHackathonTeam[]) => {
          if (data) this.userTeamDetails = data;
        }),
    );
  }
}
