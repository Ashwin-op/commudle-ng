import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HackathonTeamService, RoundService, SeoService } from '@commudle/shared-services';
import { EDbModels, IHackathonTeam, IRound } from '@commudle/shared-models';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  faChevronDown,
  faChevronUp,
  faUser,
  faFilter,
  faRotateRight,
  faTrophy,
  faUsers,
  faCube,
  faFileLines,
  faArrowUpRightFromSquare,
  faMagnifyingGlass,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';

type IExpandableTeam = IHackathonTeam & {
  expanded?: boolean;
  detailLoaded?: boolean;
  detailLoading?: boolean;
  roundDetails?: any[];
};

@Component({
  selector: 'commudle-hackathon-score-dashboard',
  templateUrl: './hackathon-score-dashboard.component.html',
  styleUrls: ['./hackathon-score-dashboard.component.scss'],
  standalone: false,
})
export class HackathonScoreDashboardComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  rounds: IRound[] = [];
  teams: IExpandableTeam[] = [];
  isLoading = true;

  page = 1;
  count = 15;
  total = 0;
  selectedRoundId = null;
  topScore = 0;
  searchQuery = '';
  private searchSubject = new Subject<string>();

  icons = {
    faChevronDown,
    faChevronUp,
    faUser,
    faFilter,
    faRotateRight,
    faTrophy,
    faUsers,
    faCube,
    faFileLines,
    faArrowUpRightFromSquare,
    faChartBar,
    faSearch: faMagnifyingGlass,
  };
  subscriptions: Subscription[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private roundService: RoundService,
    private seoService: SeoService,
    private hackathonTeamService: HackathonTeamService,
  ) {}

  ngOnInit(): void {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.paramMap.subscribe((params) => {
        this.fetchHackathon(params.get('hackathon_id'));
      }),
    );
    this.subscriptions.push(
      this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((query) => {
        this.searchQuery = query;
        this.page = 1;
        this.resetExpandedTeams();
        this.fetchTeams();
      }),
    );
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.searchSubject.complete();
  }

  fetchHackathon(hackathonId: string | number): void {
    this.subscriptions.push(
      this.hackathonService.showHackathon(hackathonId).subscribe((data: IHackathon) => {
        this.hackathon = data;
        this.fetchRounds();
        this.fetchTeams();
      }),
    );
  }

  fetchRounds(): void {
    this.subscriptions.push(
      this.roundService.indexRounds(this.hackathon.id, EDbModels.HACKATHON).subscribe((data: IRound[]) => {
        this.rounds = data;
      }),
    );
  }

  fetchTeams(): void {
    this.isLoading = true;
    this.teams = [];
    this.total = 0;
    this.topScore = 0;
    this.hackathonTeamService
      .teamsWithScores(this.hackathon.id, this.count, this.page, this.selectedRoundId, this.searchQuery || undefined)
      .subscribe((data) => {
        this.teams = data.values;
        this.topScore = this.teams.length > 0 ? this.teams[0].total_score : 0;
        this.total = data.total;
        this.isLoading = false;
      });
  }

  toggleExpand(team: IExpandableTeam): void {
    team.expanded = !team.expanded;

    if (team.expanded && !team.detailLoaded) {
      team.detailLoading = true;
      this.hackathonTeamService.teamDetailWithScores(team.id, this.selectedRoundId).subscribe((data) => {
        team.roundDetails = Object.keys(data.scores || {}).map((roundName) => {
          const round = data.scores[roundName];
          return {
            round_name: roundName,
            average_score: round.average_score,
            total_evaluations: round.total_evaluations,
            total_scores: round.total_scores,
            scores: round.scores || [],
          };
        });
        team.detailLoaded = true;
        team.detailLoading = false;
      });
    }
  }

  onSearch(value: string): void {
    this.searchSubject.next(value.trim());
  }

  onFilterChange(): void {
    this.page = 1;
    this.resetExpandedTeams();
    this.fetchTeams();
  }

  clearFilters(): void {
    this.selectedRoundId = null;
    this.searchQuery = '';
    this.page = 1;
    this.resetExpandedTeams();
    this.fetchTeams();
  }

  refreshData(): void {
    this.page = 1;
    this.resetExpandedTeams();
    this.fetchTeams();
  }

  private resetExpandedTeams(): void {
    this.teams.forEach((team) => {
      team.expanded = false;
      team.detailLoaded = false;
      team.roundDetails = [];
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchTeams();
  }
}
