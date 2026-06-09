import { countries_details, ToastrService, RoundService } from '@commudle/shared-services';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NbDialogService } from '@commudle/theme';
import {
  faFileImage,
  faPlus,
  faXmark,
  faSearch,
  faFilterCircleXmark,
  faLaptopCode,
  faLightbulb,
  faGamepad,
} from '@fortawesome/free-solid-svg-icons';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import {
  IHackathonPrize,
  IHackathonTeam,
  IHackathonTrack,
  IHackathonWinner,
  IRound,
  EDbModels,
  EHackathonRegistrationStatus,
  IHackathonProblemStatement,
} from '@commudle/shared-models';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { HackathonWinnerService } from 'apps/commudle-admin/src/app/services/hackathon-winner.service';
import { IHackathonUserResponses } from 'apps/shared-models/hackathon-user-responses.model';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'commudle-hackathon-control-panel-prize',
  templateUrl: './hackathon-control-panel-prize.component.html',
  styleUrls: ['./hackathon-control-panel-prize.component.scss'],
  standalone: false,
})
export class HackathonControlPanelPrizeComponent implements OnInit, OnDestroy {
  prizeForm: FormGroup;
  hackathonTracks: IHackathonTrack[];
  hackathon: IHackathon;
  icons = { faPlus, faFileImage, faXmark, faSearch, faFilterCircleXmark, faLaptopCode, faLightbulb, faGamepad };
  EHackathonRegistrationStatus = EHackathonRegistrationStatus;
  hackathonPrizes: IHackathonPrize[];
  countryDetails = countries_details;
  isLoading = true;
  currencySuggestions: Array<{ name: string; code: string; phone: number; symbol: string; currency: string }> = [];
  isSelectingCurrency = false;
  subscriptions: Subscription[] = [];

  // Winner management state
  selectedPrize: IHackathonPrize;
  selectedPrizeCurrencySymbol: any;
  hackathonUserResponses: IHackathonUserResponses[];
  searchForm: FormGroup;
  isWinnerLoading = false;
  winnerPage = 1;
  winnerTotal: number;
  winnerCount = 10;

  // Filter data
  hackathonRounds: IRound[] = [];
  hackathonProblemStatements: IHackathonProblemStatement[] = [];

  // Filter state
  selectedRoundId: number;
  selectedTrackId: number;
  selectedRegistrationStatus: string;
  selectedProblemStatementId: number;
  onlyWinners: boolean;
  withCommunityBuild: boolean | null = null;
  withSubmissions: boolean | null = null;
  sortBy = 'winners';
  sortOrder = 'desc';

  tinyMCE = {
    min_height: 200,
    menubar: false,
    convert_urls: false,
    placeholder: 'Write description for Prize',
    content_style:
      "@import url('https://fonts.googleapis.com/css?family=Inter'); body {font-family: 'Inter'; font-size: 16px !important;}",
    plugins: [
      'emoticons',
      'advlist',
      'lists',
      'autolink',
      'link',
      'charmap',
      'preview',
      'anchor',
      'image',
      'visualblocks',
      'code',
      'charmap',
      'codesample',
      'insertdatetime',
      'table',
      'code',
      'help',
      'wordcount',
      'autoresize',
      'media',
    ],
    toolbar:
      'bold italic backcolor | codesample emoticons | link | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | media code | removeformat | table',
    default_link_target: '_blank',
    branding: false,
    license_key: 'gpl',
  };

  constructor(
    private nbDialogService: NbDialogService,
    private fb: FormBuilder,
    private hackathonService: HackathonService,
    private hackathonWinnerService: HackathonWinnerService,
    private toastrService: ToastrService,
    private activatedRoute: ActivatedRoute,
    private roundService: RoundService,
  ) {
    this.prizeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      no_of_winners: ['', Validators.required],
      prize_amount: [''],
      currency_type: 'INR',
      order: ['', Validators.required],
      hackathon_track_id: '',
      hackathon_id: '',
    });
    this.searchForm = this.fb.group({ search: [''] });
  }

  ngOnInit() {
    this.activatedRoute.parent.parent.paramMap.subscribe((params) => {
      const hackathonId = params.get('hackathon_id');
      this.fetchTracks(hackathonId);
      this.fetchPrizes(hackathonId);
      this.fetchHackathon(hackathonId);
      this.fetchRounds(hackathonId);
      this.fetchProblemStatements(hackathonId);
    });
    this.setupCurrencyAutocomplete();
    this.subscriptions.push(
      this.searchForm.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
        this.winnerPage = 1;
        this.fetchHackathonUserResponses();
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  fetchHackathon(hackathonId) {
    this.hackathonService.showHackathon(hackathonId).subscribe((data: IHackathon) => {
      this.hackathon = data;
    });
  }

  fetchTracks(hackathonId) {
    this.hackathonService.indexTracks(hackathonId).subscribe((data: IHackathonTrack[]) => {
      this.hackathonTracks = data;
    });
  }

  fetchPrizes(hackathonId) {
    this.hackathonService.getPrizesByHackathon(hackathonId).subscribe((data) => {
      this.hackathonPrizes = data;
      this.isLoading = false;
    });
  }

  fetchRounds(hackathonId) {
    this.roundService.indexRounds(hackathonId, EDbModels.HACKATHON).subscribe((data: IRound[]) => {
      this.hackathonRounds = data;
    });
  }

  fetchProblemStatements(hackathonId) {
    this.hackathonService.indexProblemStatements(hackathonId).subscribe((data: IHackathonProblemStatement[]) => {
      this.hackathonProblemStatements = data;
    });
  }

  openPrizeFormDialogBox(dialog, prize?: IHackathonPrize, index?) {
    this.prizeForm.reset();
    this.prizeForm.patchValue({
      hackathon_id: this.hackathon.id,
      currency_type: 'INR',
      hackathon_track_id: '',
      prize_amount: '',
      order: '',
    });
    if (prize) {
      this.prizeForm.patchValue({
        name: prize.name,
        description: prize.description,
        no_of_winners: prize.no_of_winners,
        prize_amount: prize.prize_amount,
        hackathon_track_id: prize.hackathon_track ? prize.hackathon_track.id : '',
        currency_type: prize.currency_type,
        order: prize.order,
      });
    }
    this.nbDialogService.open(dialog, { context: { index, prize } });
    setTimeout(() => {
      const nameInput = document.querySelector('#name') as HTMLInputElement;
      if (nameInput) nameInput.focus();
    }, 0);
  }

  confirmDeleteDialogBox(dialog, prizeId, index) {
    this.nbDialogService.open(dialog, { context: { index, prizeId } });
  }

  createPrize() {
    this.prizeForm.get('currency_type').setValue(this.prizeForm.get('currency_type').value.toUpperCase());
    this.hackathonService.createPrize(this.prizeForm.value).subscribe((data) => {
      this.hackathonPrizes.unshift(data);
    });
  }

  updatePrize(prizeId, index) {
    this.prizeForm.get('currency_type').setValue(this.prizeForm.get('currency_type').value.toUpperCase());
    this.hackathonService.updatePrize(this.prizeForm.value, prizeId).subscribe((data) => {
      this.hackathonPrizes[index] = data;
    });
  }

  deletePrize(prizeId, index) {
    this.hackathonService.destroyPrize(prizeId).subscribe((data) => {
      if (data) this.hackathonPrizes.splice(index, 1);
    });
  }

  setupCurrencyAutocomplete() {
    this.subscriptions.push(
      this.prizeForm
        .get('currency_type')
        .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((value) => {
          if (!this.isSelectingCurrency && value && typeof value === 'string' && value.length > 0) {
            this.filterCurrencies(value);
          } else if (!this.isSelectingCurrency) {
            this.currencySuggestions = [];
          }
        }),
    );
  }

  filterCurrencies(query: string) {
    const searchTerm = query.toLowerCase();
    this.currencySuggestions = this.countryDetails
      .filter(
        (country) =>
          country.currency.toLowerCase().includes(searchTerm) ||
          country.symbol.toLowerCase().includes(searchTerm) ||
          country.name.toLowerCase().includes(searchTerm),
      )
      .slice(0, 10);
  }

  selectCurrency(selectedValue: string) {
    if (selectedValue) {
      this.isSelectingCurrency = true;
      this.prizeForm.patchValue({ currency_type: selectedValue });
      this.currencySuggestions = [];
      setTimeout(() => (this.isSelectingCurrency = false), 100);
    }
  }

  // Winner management methods
  openWinnersDialog(dialog, prize: IHackathonPrize) {
    this.selectedPrize = prize;
    this.selectedPrizeCurrencySymbol = this.countryDetails.find((d) => d.currency === prize.currency_type);
    if (!this.selectedPrizeCurrencySymbol) {
      this.selectedPrizeCurrencySymbol = { symbol: prize.currency_type };
    }
    this.searchForm.patchValue({ search: '' }, { emitEvent: false });
    this.winnerPage = 1;
    this.fetchHackathonUserResponses();
    this.nbDialogService.open(dialog, {});
  }

  fetchHackathonUserResponses() {
    if (!this.selectedPrize) return;
    this.isWinnerLoading = true;
    this.hackathonService
      .indexUserResponses(
        this.selectedPrize.hackathon_id,
        this.winnerPage,
        this.winnerCount,
        this.searchForm.get('search').value,
        this.selectedRoundId,
        this.selectedRegistrationStatus,
        this.onlyWinners,
        this.selectedTrackId,
        this.selectedProblemStatementId,
        this.sortBy,
        this.sortOrder,
        undefined,
        this.withSubmissions,
        this.withCommunityBuild,
      )
      .subscribe((data) => {
        if (data) {
          this.hackathonUserResponses = data.values;
          this.winnerPage = data.page;
          this.winnerTotal = data.total;
          for (const hur of this.hackathonUserResponses) {
            hur.team.prize_selected = false;
            for (const hw of hur.team.hackathon_winners) {
              if (hw.hackathon_prize.id === this.selectedPrize.id) {
                hur.team.prize_selected = true;
                break;
              }
            }
          }
        }
        this.isWinnerLoading = false;
      });
  }

  addWinner(team: IHackathonTeam, index: number) {
    this.hackathonWinnerService
      .addHackathonWinner(this.selectedPrize.id, team.id)
      .subscribe((data: IHackathonWinner) => {
        this.hackathonUserResponses[index].team.hackathon_winners.push(data);
        this.hackathonUserResponses[index].team.prize_selected = true;
        this.selectedPrize.winners_count++;
        this.toastrService.successDialog('Winner Selected');
      });
  }

  removeWinner(winnerId: number, userResponseIndex: number, winnerIndex: number) {
    this.hackathonWinnerService.removeHackathonWinner(winnerId).subscribe((data) => {
      if (data) {
        this.hackathonUserResponses[userResponseIndex].team.prize_selected = false;
        this.hackathonUserResponses[userResponseIndex].team.hackathon_winners.splice(winnerIndex, 1);
        this.selectedPrize.winners_count--;
        this.toastrService.successDialog('Winner Removed');
      }
    });
  }

  openAddWinnerConfirmation(dialog, team: IHackathonTeam, index: number) {
    this.nbDialogService.open(dialog, { context: { team, index } });
  }

  openRemoveWinnerConfirmation(dialog, winnerId: number, userResponseIndex: number, winnerIndex: number) {
    this.nbDialogService.open(dialog, { context: { winnerId, userResponseIndex, winnerIndex } });
  }

  onWinnerPageChange(page: number) {
    this.winnerPage = page;
    this.fetchHackathonUserResponses();
  }

  onFilterChange() {
    this.winnerPage = 1;
    this.fetchHackathonUserResponses();
  }

  setSortByWinners(order: 'asc' | 'desc') {
    this.sortBy = 'winners';
    this.sortOrder = order;
    this.winnerPage = 1;
    this.fetchHackathonUserResponses();
  }

  resetFilters() {
    this.searchForm.patchValue({ search: '' }, { emitEvent: false });
    this.selectedRoundId = undefined;
    this.selectedTrackId = undefined;
    this.selectedRegistrationStatus = undefined;
    this.selectedProblemStatementId = undefined;
    this.onlyWinners = undefined;
    this.withCommunityBuild = null;
    this.withSubmissions = null;
    this.sortBy = 'winners';
    this.sortOrder = 'desc';
    this.onFilterChange();
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.selectedRoundId ||
      this.selectedTrackId ||
      this.selectedRegistrationStatus ||
      this.selectedProblemStatementId ||
      this.onlyWinners ||
      this.withCommunityBuild !== null ||
      this.withSubmissions !== null
    );
  }

  getWinnerIdForCurrentPrize(team: IHackathonTeam): number {
    const hw = team.hackathon_winners.find((w) => w.hackathon_prize.id === this.selectedPrize.id);
    return hw ? hw.id : null;
  }

  getWinnerIndexForCurrentPrize(team: IHackathonTeam): number {
    return team.hackathon_winners.findIndex((w) => w.hackathon_prize.id === this.selectedPrize.id);
  }
}
