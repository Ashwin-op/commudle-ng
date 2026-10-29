import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IHackathonPrize, IHackathonTrack } from '@commudle/shared-models';
import { countries_details } from '@commudle/shared-services';
import { NbDialogRef } from '@commudle/theme';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'commudle-hackathon-prize-form',
  templateUrl: './hackathon-prize-form.component.html',
  styleUrls: ['./hackathon-prize-form.component.scss'],
})
export class HackathonPrizeFormComponent implements OnInit {
  prizeForm: FormGroup;
  tinyMCE = {
    min_height: 200,
    menubar: false,
    convert_urls: false,
    placeholder: 'Write description for Prize',
    content_style: 'body {font-family: system-ui, sans-serif; font-size: 16px !important;}',
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

  hackathonPrize: IHackathonPrize;
  hackathonTracks: IHackathonTrack[] = [];
  hackathonId: number | string;
  selectedTrackId: number;
  isSelectingCurrency = false;
  currencySuggestions: Array<{ name: string; code: string; phone: number; symbol: string; currency: string }> = [];
  countryDetails = countries_details;
  subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private hackathonService: HackathonService,
    private dialogRef: NbDialogRef<HackathonPrizeFormComponent>,
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
  }

  ngOnInit() {
    this.setupCurrencyAutocomplete();

    if (this.hackathonId) {
      this.fetchTracks(this.hackathonId);
      this.prizeForm.patchValue({
        hackathon_id: this.hackathonId,
        hackathon_track_id: this.selectedTrackId || '',
      });
    }

    if (this.hackathonPrize) {
      this.prizeForm.patchValue({
        name: this.hackathonPrize.name,
        description: this.hackathonPrize.description,
        no_of_winners: this.hackathonPrize.no_of_winners,
        prize_amount: this.hackathonPrize.prize_amount,
        hackathon_track_id: this.hackathonPrize.hackathon_track ? this.hackathonPrize.hackathon_track.id : '',
        currency_type: this.hackathonPrize.currency_type,
        order: this.hackathonPrize.order,
      });
    }
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
      this.prizeForm.patchValue({
        currency_type: selectedValue,
      });
      this.currencySuggestions = [];
      setTimeout(() => {
        this.isSelectingCurrency = false;
      }, 100);
    }
  }

  updatePrize(prizeId) {
    this.prizeForm.get('currency_type').setValue(this.prizeForm.get('currency_type').value.toUpperCase());
    this.hackathonService.updatePrize(this.prizeForm.value, prizeId).subscribe((data) => {
      this.dialogRef.close(data);
    });
  }

  createPrize() {
    this.prizeForm.get('currency_type').setValue(this.prizeForm.get('currency_type').value.toUpperCase());
    this.hackathonService.createPrize(this.prizeForm.value).subscribe((data) => {
      this.dialogRef.close(data);
    });
  }

  fetchTracks(hackathonId) {
    this.hackathonService.indexTracks(hackathonId).subscribe((data: IHackathonTrack[]) => {
      this.hackathonTracks = data;
    });
  }

  closeForm() {
    this.dialogRef.close();
  }
}
