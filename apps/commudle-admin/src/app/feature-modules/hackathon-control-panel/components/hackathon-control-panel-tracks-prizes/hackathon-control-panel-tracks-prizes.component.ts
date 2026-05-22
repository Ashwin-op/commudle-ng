import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHackathon, ICommunity } from '@commudle/shared-models';
import { NbRouteTab } from '@commudle/theme';
import { faArrowRight, faGamepad, faMicrophone, faRectangleList } from '@fortawesome/free-solid-svg-icons';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { Subscription } from 'rxjs';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { SeoService, ToastrService } from '@commudle/shared-services';

@Component({
  selector: 'commudle-hackathon-control-panel-tracks-prizes',
  templateUrl: './hackathon-control-panel-tracks-prizes.component.html',
  styleUrls: ['./hackathon-control-panel-tracks-prizes.component.scss'],
  standalone: false,
})
export class HackathonControlPanelTracksPrizesComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  isTogglingProblemStatement = false;
  tabs: NbRouteTab[] = [
    {
      title: 'Tracks',
      route: './',
    },
    {
      title: 'prizes',
      route: ['./prizes'],
    },
  ];
  subscriptions: Subscription[] = [];

  parent: ICommunity | ICommunityGroup;

  icons = {
    faArrowRight,
    faGamepad,
    faRectangleList,
    faMicrophone,
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private seoService: SeoService,
    private toastrService: ToastrService,
  ) {}

  ngOnInit() {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.paramMap.subscribe((params) => {
        this.fetchHackathonDetails(params.get('hackathon_id'));
      }),
    );
  }

  ngOnDestroy() {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  fetchHackathonDetails(hackathonId) {
    this.subscriptions.push(
      this.hackathonService.showHackathon(hackathonId).subscribe((data) => {
        // TODO: Add Community Group in Future
        if (data.community) {
          this.parent = data.community;
        }
        this.hackathon = data;
        this.setMeta();
      }),
    );
  }

  toggleProblemStatementChange(value: boolean) {
    this.isTogglingProblemStatement = true;
    this.hackathonService.toggleAllowProblemStatementChange(this.hackathon.id, value).subscribe({
      next: (data) => {
        this.hackathon = data;
        this.isTogglingProblemStatement = false;
        this.toastrService.successDialog(
          value ? 'Problem statement change enabled' : 'Problem statement change disabled',
        );
      },
      error: () => {
        this.isTogglingProblemStatement = false;
        this.toastrService.warningDialog('Failed to update setting');
      },
    });
  }

  setMeta() {
    this.seoService.setTitle(`Tracks & Prizes | Dashboard | ${this.hackathon.name} | ${this.parent.name}`);
  }
}
