/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ICommunity, IHackathonTrack } from '@commudle/shared-models';
import { countries_details, SeoService } from '@commudle/shared-services';
import { HackathonResponseGroupService } from 'apps/commudle-admin/src/app/services/hackathon-response-group.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'commudle-public-hackathon-tracks',
  templateUrl: './public-hackathon-tracks.component.html',
  styleUrls: ['./public-hackathon-tracks.component.scss'],
  standalone: false,
})
export class PublicHackathonTracksComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  community: ICommunity;
  tracks: IHackathonTrack[];
  hrgId: number;
  countryDetails = countries_details;
  subscriptions: Subscription[] = [];

  totalProblemStatements = 0;
  totalPrizes = 0;
  totalPrizesByCurrency: { currency: any; amount: number }[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private hrgService: HackathonResponseGroupService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        this.community = data.community;
        this.setSeo();
        this.getTracks();
        this.computeTotalPrizes();
      }),
    );
    this.hrgService.pShowHackathonResponseGroup(this.hackathon.id).subscribe((data) => {
      if (data) this.hrgId = data.id;
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  computeTotalPrizes(): void {
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

  setSeo() {
    this.seoService.setTags(
      `Tracks | ${this.hackathon.name}`,
      `Explore tracks and problem statements for ${this.hackathon.name} hackathon`,
      this.hackathon?.banner_image?.url || 'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  getTracks() {
    this.subscriptions.push(
      this.hackathonService.pIndexHackathonTracks(this.hackathon.id).subscribe((data) => {
        this.tracks = data;
        if (this.tracks) {
          for (const track of this.tracks) {
            this.totalProblemStatements += track.hackathon_problem_statements?.length || 0;
            if (track.hackathon_prizes) {
              for (const prize of track.hackathon_prizes) {
                const prizeCurrencySymbol = this.countryDetails.find(
                  (detail) => detail.currency === prize.currency_type,
                ) || {
                  symbol: prize.currency_type,
                };
                prize.currency_symbol = prizeCurrencySymbol?.symbol || prize.currency_type;
              }
            }
          }
        }
      }),
    );
  }
}
