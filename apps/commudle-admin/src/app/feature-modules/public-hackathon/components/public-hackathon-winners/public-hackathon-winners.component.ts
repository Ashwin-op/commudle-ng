/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { faTrophy, faLayerGroup, faLaptopCode } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

import { ICommunity, IHackathonWinnerByPrize } from '@commudle/shared-models';
import { countries_details as countryDetails } from '@commudle/shared-services';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathon } from 'apps/shared-models/hackathon.model';

@Component({
  selector: 'commudle-public-hackathon-winners',
  templateUrl: './public-hackathon-winners.component.html',
  styleUrls: ['./public-hackathon-winners.component.scss'],
  standalone: false,
})
export class PublicHackathonWinnersComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  community: ICommunity;
  winnersByPrize: IHackathonWinnerByPrize[] = [];
  isLoading = true;
  icons = { faTrophy, faLayerGroup, faLaptopCode };
  subscriptions: Subscription[] = [];

  constructor(private activatedRoute: ActivatedRoute, private hackathonService: HackathonService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        this.community = data.community;
        this.getWinners();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getWinners() {
    this.subscriptions.push(
      this.hackathonService.pIndexWinners(this.hackathon.id).subscribe((data) => {
        this.winnersByPrize = data;
        this.winnersByPrize.forEach((entry) => {
          const prizeCurrencySymbol = countryDetails.find(
            (detail) => detail.currency === entry.prize.currency_type,
          ) || {
            symbol: entry.prize.currency_type,
          };
          entry.prize.currency_symbol = prizeCurrencySymbol?.symbol || entry.prize.currency_type;
        });
        this.isLoading = false;
      }),
    );
  }

  getPrizeRankClass(order: number): string {
    switch (order) {
      case 1:
        return 'rank-first';
      case 2:
        return 'rank-second';
      case 3:
        return 'rank-third';
      default:
        return 'rank-default';
    }
  }
}
