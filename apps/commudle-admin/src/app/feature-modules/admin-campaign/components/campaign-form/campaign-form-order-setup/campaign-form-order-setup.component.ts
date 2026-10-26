import {
  Component,
  ElementRef,
  TemplateRef,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import {
  ECampaignStatus,
  ICampaign,
  ICampaignAsset,
  ICampaignChangeLogEntry,
  ICampaignEstimate,
  EDbModels,
  IWallet,
} from '@commudle/shared-models';
import {
  CampaignService,
  ConfettiService,
  GoogleTagManagerService,
  SeoService,
  ToastrService,
  WalletService,
} from '@commudle/shared-services';
import { GooglePlacesAutocompleteService } from 'apps/commudle-admin/src/app/services/google-places-autocomplete.service';
import { SearchService } from 'apps/commudle-admin/src/app/feature-modules/search/services/search.service';
import { ISearch } from 'apps/shared-models/search.model';
import { faArrowRight, faFileImage, faRectangleAd, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { debounceTime, distinctUntilChanged, EMPTY, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { environment } from '@commudle/shared-environments';

@Component({
  selector: 'commudle-campaign-form-order-setup',
  templateUrl: './campaign-form-order-setup.component.html',
  styleUrls: ['./campaign-form-order-setup.component.scss'],
  standalone: false,
})
export class CampaignFormOrderSetupComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('locationSearchInput', { read: ElementRef }) locationSearchInput: ElementRef;
  // how wide the preview card is drawn: a desktop sidebar slot or a phone-width feed
  previewDevice: 'desktop' | 'mobile' = 'desktop';
  walletExpanded = false;
  private walletAutoOpened = false;
  private footerObserver?: IntersectionObserver;

  // The wallet accordion stays minimised until the user scrolls down to the footer, then opens once by itself.
  // The footer sits behind an *ngIf, so this is a setter rather than something wired up in ngAfterViewInit.
  @ViewChild('formFooter') set formFooter(footer: ElementRef<HTMLElement> | undefined) {
    this.footerObserver?.disconnect();
    if (!footer || typeof IntersectionObserver === 'undefined') return;
    this.footerObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.walletAutoOpened) {
          this.walletAutoOpened = true;
          this.walletExpanded = true;
          this.cdr.detectChanges();
        }
      },
      { threshold: 0.3 },
    );
    this.footerObserver.observe(footer.nativeElement);
  }
  campaignForm: FormGroup;
  icons = {
    faArrowRight,
    faFileImage,
    faRectangleAd,
    faTrash,
    faXmark,
  };
  campaign: ICampaign;
  // built from the form (not the saved campaign) so the preview updates as the user types
  previewCampaign: ICampaign;
  wallet: IWallet;
  estimate: ICampaignEstimate;
  form1Invalid = true;
  form2Invalid = true;

  communitiesFormControl = new FormControl('');
  communitiesSearchResult = [];
  searchingCommunities = false;
  selectedCommunities: Array<{ id: number; name: string; slug: string }> = [];
  locationsFormControl = new FormControl('');
  selectedLocations: string[] = [];
  EDbModels = EDbModels;
  page = 1;
  count = 10;
  imagePreview = [];
  staticAssets = staticAssets;
  defaultUrl = environment.app_url + '/campaigns/new';
  savingAsset = false;
  private dateSaveTimer: ReturnType<typeof setTimeout>;
  minStartLeadHours = 1;
  // keep in sync with Campaign::MIN_CAMPAIGN_DURATION on the backend
  static readonly MIN_DURATION_HOURS = 12;
  // keep in sync with the backend limits on CampaignAsset
  static readonly MAX_TITLE_LENGTH = 80;
  static readonly MAX_DESCRIPTION_LENGTH = 160;
  readonly maxTitleLength = CampaignFormOrderSetupComponent.MAX_TITLE_LENGTH;
  readonly maxDescriptionLength = CampaignFormOrderSetupComponent.MAX_DESCRIPTION_LENGTH;
  static readonly DEFAULT_START_LEAD_HOURS = 3;
  readonly maxActiveAssets = 5;
  changeLog: ICampaignChangeLogEntry[] = [];
  liveEndAt = '';
  maxEndAt: string | null = null;
  minEndAt = '';
  minStartAt = this.toDateTimeLocal(this.minStartDate());
  private subscriptions = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private _fb: FormBuilder,
    private campaignService: CampaignService,
    private walletService: WalletService,
    private toasterService: ToastrService,
    private router: Router,
    private seoService: SeoService,
    private gtm: GoogleTagManagerService,
    private googlePlacesAutocompleteService: GooglePlacesAutocompleteService,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef,
    private dialogService: NbDialogService,
    private confettiService: ConfettiService,
  ) {
    this.campaignForm = this._fb.group(
      {
        name: ['', Validators.required],
        // new campaigns start 3 hours from now by default (the minimum allowed is 1 hour)
        start_at: [
          this.toDateTimeLocal(
            new Date(Date.now() + CampaignFormOrderSetupComponent.DEFAULT_START_LEAD_HOURS * 3600000),
          ),
          [Validators.required, (c: AbstractControl) => this.startAtValidator(c)],
        ],
        end_at: [''],
        set_end_date: [false],
        cta_label: [''],
        budget: [0, [Validators.required, Validators.min(10)]],
        locations: [],
        communities: [],
        campaign_assets: this._fb.array([this.createCampaignAsset()]),
      },
      {
        validators: [this.endDateValidator],
      },
    );
  }

  ngOnInit() {
    this.subscriptions.add(this.campaignForm.valueChanges.subscribe(() => this.refreshPreview()));
    this.refreshPreview();
    if (this.router.url.includes('/edit/')) {
      const campaignId = this.activatedRoute.parent?.snapshot?.paramMap?.get('campaign_id');
      this.campaignService.fetchCampaign(campaignId).subscribe((campaign) => {
        if (campaign) {
          this.campaign = campaign;
          this.patchCampaignForm();
          this.getFundStatus();
          this.getEstimatedImpressions();
          if (this.isLaunched) {
            this.liveEndAt = this.formatDateTimeForInput(this.campaign.end_at);
            // the end date can only be shortened, never extended past what it was at launch
            this.maxEndAt = this.liveEndAt || null;
            this.minEndAt = this.toDateTimeLocal(new Date());
            this.loadChangeLog();
          }
          setTimeout(() => {
            if (this.campaignForm.get('set_end_date')?.value) {
              this.onSetEndDateChange(false); // initial load must not write to the campaign
            }
            if (!this.isForm1Invalid()) {
              this.form1Invalid = false;
            }
            if (!this.isForm2Invalid()) {
              this.form2Invalid = false;
            }
          });
          this.seoService.setTags(
            `Edit ${this.campaign.name} Campaign`,
            `Edit your campaign ${this.campaign.name}`,
            'https://commudle.com/assets/images/commudle-logo192.png',
          );
        }
      });
    } else {
      this.seoService.setTags(
        'Create a Campaign',
        'Create a new campaign to boost outreach to thousands of developers on Commudle. Choose a campaign type to start',
        'https://commudle.com/assets/images/commudle-logo192.png',
      );
    }
  }

  ngAfterViewInit() {
    this.initAutocomplete();
    this.observeCommunitiesInput();
  }

  // Once launched, only the end date (shorten only) and creatives can change; everything else is locked server-side
  get isLaunched(): boolean {
    return [ECampaignStatus.LIVE, ECampaignStatus.PAUSED, ECampaignStatus.COMPLETE, ECampaignStatus.STOPPED].includes(
      this.campaign?.status,
    );
  }

  // complete / stopped campaigns are read-only
  get isLocked(): boolean {
    return [ECampaignStatus.COMPLETE, ECampaignStatus.STOPPED].includes(this.campaign?.status);
  }

  get activeAssetsCount(): number {
    return (this.campaign?.campaign_assets ?? []).filter((asset) => asset.active !== false).length;
  }

  // The API deals in minor units everywhere (cents/paise): budget, spend, wallet balances and pricing.
  // The form works in major units (what the advertiser types), so convert at the boundary.
  toMajorUnits(minorAmount: number): number {
    return (minorAmount ?? 0) / 100;
  }

  toMinorUnits(majorAmount: number | string): number {
    return Math.round(Number(majorAmount || 0) * 100);
  }

  // What the wallet looks like once this campaign is submitted (all in minor units). A shortfall is paid at
  // checkout first, so the available balance is used up and the whole budget ends up reserved.
  walletAfterSubmit(): { available: number; reserved: number; shortfall: number } | null {
    const budget = this.toMinorUnits(this.campaignForm?.get('budget')?.value);
    if (!this.wallet || !budget) return null;
    const shortfall = Math.max(budget - this.wallet.available_balance, 0);
    return {
      available: Math.max(this.wallet.available_balance - budget, 0),
      reserved: this.wallet.reserved_balance + budget,
      shortfall,
    };
  }

  // wallet balances are in minor units, the budget field is in major units
  walletCoversBudget(): boolean {
    return !!this.wallet && this.wallet.available_balance >= this.toMinorUnits(this.campaignForm?.get('budget')?.value);
  }

  estimateStatusMessage(): string {
    switch (this.estimate?.delivery_status) {
      case 'deliverable':
        return 'On track: your budget and schedule should be fully delivered.';
      case 'borderline':
        return 'Borderline: this budget may not fully deliver by the end date. Consider a smaller budget, a later end date, or broader targeting.';
      case 'undeliverable':
        return "Unlikely to deliver: with the current targeting, this budget and timeline can't realistically be met. Broaden your targeting, lower the budget, or extend the end date.";
      case 'no_end_date':
        return 'No end date is set, so there is no delivery verdict. The ranges above are daily estimates.';
      default:
        return '';
    }
  }

  selectedCommunityNames(): string {
    return this.selectedCommunities.map((community) => community.name).join(' | ');
  }

  private appendAssets(formData: FormData, assets: ICampaignAsset[]): number {
    assets.forEach((asset, idx) => {
      formData.append(`campaign[campaign_assets][${idx}][url]`, asset.url ?? '');
      // resend the stored text so saving other creatives never blanks it
      formData.append(`campaign[campaign_assets][${idx}][headline]`, asset.headline ?? '');
      formData.append(`campaign[campaign_assets][${idx}][description]`, asset.description ?? '');
      if (asset.id != null) {
        formData.append(`campaign[campaign_assets][${idx}][id]`, asset.id.toString());
      }
      // every saved asset has to be sent (inactive ones too) or the API deletes the ones left out
      if (asset.active !== undefined) {
        formData.append(`campaign[campaign_assets][${idx}][active]`, String(asset.active));
      }
    });
    return assets.length;
  }

  toggleAssetActive(asset: ICampaignAsset) {
    const makeActive = asset.active === false;
    if (makeActive && this.activeAssetsCount >= this.maxActiveAssets) {
      this.toasterService.warningDialog(
        `Maximum ${this.maxActiveAssets} active creatives allowed. Deactivate one first.`,
      );
      return;
    }
    const formData = new FormData();
    this.appendAssets(
      formData,
      this.campaign.campaign_assets.map((a) => (a.id === asset.id ? { ...a, active: makeActive } : a)),
    );
    this.campaignService.updateCampaign(formData, this.campaign.id).subscribe((updated: ICampaign) => {
      if (updated) {
        this.applyUpdatedCampaign(updated);
        this.toasterService.successDialog(makeActive ? 'Creative activated.' : 'Creative deactivated.');
        this.loadChangeLog();
      }
    });
  }

  saveLiveEndDate() {
    if (!this.liveEndAt) {
      this.toasterService.warningDialog('Select an end date.');
      return;
    }
    const end = new Date(this.liveEndAt);
    if (end <= new Date()) {
      this.toasterService.warningDialog('End date must be in the future. To end the campaign now, use Stop.');
      return;
    }
    if (this.maxEndAt && end > new Date(this.maxEndAt)) {
      this.toasterService.warningDialog('The end date can only be shortened, not extended.');
      return;
    }
    const formData = new FormData();
    formData.append('campaign[end_at]', this.liveEndAt);
    this.campaignService.updateCampaign(formData, this.campaign.id).subscribe((updated: ICampaign) => {
      if (updated) {
        this.applyUpdatedCampaign(updated);
        this.maxEndAt = this.formatDateTimeForInput(updated.end_at);
        this.toasterService.successDialog('End date updated.');
        this.loadChangeLog();
      }
    });
  }

  private applyUpdatedCampaign(updated: ICampaign) {
    this.campaign = { ...updated, campaign_assets: updated.campaign_assets ? [...updated.campaign_assets] : [] };
    this.loadCampaignAssetsFromApi();
    this.cdr.detectChanges();
  }

  loadChangeLog() {
    if (!this.campaign?.id) return;
    this.campaignService.getChangeLog(this.campaign.id).subscribe((entries) => {
      this.changeLog = entries ?? [];
      this.cdr.detectChanges();
    });
  }

  changeLogLabel(entry: ICampaignChangeLogEntry): string {
    if (entry.item_type === 'Campaign') return 'End date';
    const asset = this.campaign?.campaign_assets?.find((a) => a.id === entry.item_id);
    const name = asset?.url ? ` (${asset.url})` : '';
    return (entry.field === 'active' ? 'Creative status' : 'Creative ' + entry.field) + name;
  }

  changeLogValue(entry: ICampaignChangeLogEntry, value: string | boolean | null): string {
    if (value === null || value === undefined || value === '') return 'none';
    if (entry.field === 'active') return value === false || value === 'false' ? 'Inactive' : 'Active';
    return String(value);
  }

  ngOnDestroy() {
    clearTimeout(this.dateSaveTimer);
    this.footerObserver?.disconnect();
    // placeChanged lives on a root singleton service, so a stale subscription would fire for a destroyed form
    this.subscriptions.unsubscribe();
  }

  private refreshPreview(): void {
    const saved = (this.campaign?.campaign_assets ?? []).filter((asset) => asset.active !== false);
    const assets = [...saved];
    // the last form row is the draft asset still being filled in
    const draftIndex = this.campaignAssets.length - 1;
    const draftPreviewUrl = this.imagePreview[draftIndex];
    const draftUrl = this.campaignAssets.at(draftIndex)?.get('url')?.value;
    const draftTitle = this.campaignAssets.at(draftIndex)?.get('headline')?.value;
    const draftDescription = this.campaignAssets.at(draftIndex)?.get('description')?.value;
    if (draftPreviewUrl) {
      assets.push({
        id: null,
        headline: draftTitle || '',
        description: draftDescription || '',
        url: draftUrl || '',
        image: { url: draftPreviewUrl },
      } as ICampaignAsset);
    }
    this.previewCampaign = {
      ...this.campaign,
      cta_label: this.campaignForm.get('cta_label')?.value || 'Learn more',
      campaign_assets: assets,
    } as ICampaign;
  }

  // the earliest end time the rules allow: the minimum duration after the start
  private earliestEndAt(): string {
    const startValue = this.campaignForm.get('start_at')?.value;
    const start = startValue && !isNaN(new Date(startValue).getTime()) ? new Date(startValue) : this.minStartDate();
    return this.toDateTimeLocal(
      new Date(start.getTime() + CampaignFormOrderSetupComponent.MIN_DURATION_HOURS * 60 * 60 * 1000),
    );
  }

  private minStartDate(): Date {
    return new Date(Date.now() + this.minStartLeadHours * 60 * 60 * 1000);
  }

  private toDateTimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
      date.getMinutes(),
    )}`;
  }

  // Start must be at least minStartLeadHours from now so there is time for a manual review.
  // An unchanged start on an existing campaign is left alone, so already-started campaigns stay editable.
  startAtValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    if (this.campaign?.start_at && control.value === this.formatDateTimeForInput(this.campaign.start_at)) return null;
    return new Date(control.value) < this.minStartDate() ? { startAtTooSoon: true } : null;
  }

  private createCampaignRequest(): Observable<ICampaign> {
    const formData = new FormData();
    formData.append('campaign[name]', this.campaignForm.value.name);
    formData.append('campaign[start_at]', this.campaignForm.value.start_at || null);

    if (this.campaignForm.get('set_end_date')?.value) {
      formData.append('campaign[end_at]', this.campaignForm.value.end_at || null);
    }

    return this.campaignService.createCampaign(formData).pipe(
      tap((res: ICampaign) => {
        if (res) {
          this.campaign = res;
          this.getFundStatus();
          this.gtmDataLayerPushEvent('new-campaign-step-1-created', {
            com_campaign_id: res.id,
          });
        }
      }),
    );
  }

  createCampaign() {
    this.createCampaignRequest().subscribe((res: ICampaign) => {
      if (res) {
        this.router.navigate(['campaigns', 'edit', res.id], { replaceUrl: true });
      }
    });
  }

  // Mirrors the server rules: end after start, not in the past, and at least minCampaignDurationHours after the start.
  endDateValidator(formGroup: AbstractControl): ValidationErrors | null {
    const startDate = formGroup.get('start_at')?.value;
    const endDate = formGroup.get('end_at')?.value;

    if (!formGroup.get('set_end_date')?.value || !endDate) return null; // end date is optional

    const end = new Date(endDate);
    if (end < new Date()) return { endDateValidator: 'past' };
    if (!startDate) return null;

    const start = new Date(startDate);
    if (end <= start) return { endDateValidator: 'beforeStart' };

    const minEndDate = new Date(start.getTime() + CampaignFormOrderSetupComponent.MIN_DURATION_HOURS * 60 * 60 * 1000);
    return end < minEndDate ? { endDateValidator: 'tooSoon' } : null;
  }

  createCampaignAsset(asset?: ICampaignAsset): FormGroup {
    return this._fb.group({
      id: [asset ? asset?.id : ''],
      image: [asset ? asset?.image?.url : null, Validators.required],
      url: [asset ? asset?.url : '', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]], // Ensure URL is valid
      headline: [asset?.headline ?? '', Validators.maxLength(CampaignFormOrderSetupComponent.MAX_TITLE_LENGTH)],
      description: [
        asset?.description ?? '',
        Validators.maxLength(CampaignFormOrderSetupComponent.MAX_DESCRIPTION_LENGTH),
      ],
    });
  }

  get campaignAssets(): FormArray {
    return this.campaignForm.get('campaign_assets') as FormArray;
  }

  addAsset(index: number) {
    if (this.savingAsset) return;
    if (this.activeAssetsCount >= this.maxActiveAssets) {
      this.toasterService.warningDialog(
        `Maximum ${this.maxActiveAssets} active creatives allowed. Deactivate or remove one to add a new one.`,
      );
      return;
    }

    const currentGroup = this.campaignAssets.at(index) as FormGroup;
    if (currentGroup.invalid) {
      currentGroup.markAllAsTouched();
      return;
    }

    // all sections are open, so the campaign may not exist yet - create it first from the details above
    if (!this.campaign?.id && this.isForm1Invalid()) {
      this.toasterService.warningDialog('Fill in the campaign name and start date first.');
      return;
    }

    this.savingAsset = true;
    const wasNew = !this.campaign?.id;
    const created$ = wasNew ? this.createCampaignRequest() : of(this.campaign);
    created$.subscribe({
      next: (campaign) => {
        if (!campaign?.id) {
          this.savingAsset = false;
          return;
        }
        this.saveAssetWithCampaign(currentGroup, wasNew);
      },
      error: () => (this.savingAsset = false),
    });
  }

  // Saves the campaign's other fields together with the new asset, so the campaign is up to date when the asset lands
  private saveAssetWithCampaign(currentGroup: FormGroup, wasNew: boolean) {
    // once launched the server rejects everything except end date and creatives
    const formData = this.isLaunched ? new FormData() : this.buildCampaignFormData();
    const assetData = currentGroup.value;
    const url = (currentGroup.get('url')?.value ?? assetData.url ?? '') as string;
    const existingAssets = this.campaign?.campaign_assets ?? [];

    // Include all existing assets so the API replaces the array with existing + new, not just the new one
    const nextIndex = this.appendAssets(formData, existingAssets);

    // Append the new asset at the next index
    formData.append(`campaign[campaign_assets][${nextIndex}][url]`, url);
    formData.append(`campaign[campaign_assets][${nextIndex}][headline]`, (assetData.headline ?? '').trim());
    formData.append(`campaign[campaign_assets][${nextIndex}][description]`, (assetData.description ?? '').trim());
    if (assetData.id) {
      formData.append(`campaign[campaign_assets][${nextIndex}][id]`, assetData.id);
    }
    if (assetData.image instanceof File) {
      formData.append(`campaign[campaign_assets][${nextIndex}][image]`, assetData.image);
    }

    this.campaignService.updateCampaign(formData, this.campaign.id).subscribe({
      next: (updatedCampaign: ICampaign) => {
        this.savingAsset = false;
        if (!updatedCampaign) return;
        this.campaign = {
          ...updatedCampaign,
          campaign_assets: updatedCampaign.campaign_assets ? [...updatedCampaign.campaign_assets] : [],
        };
        this.loadCampaignAssetsFromApi();
        this.resetAssetForm();
        this.getEstimatedImpressions();
        this.cdr.detectChanges();
        if (wasNew) {
          this.router.navigate(['campaigns', 'edit', this.campaign.id], { replaceUrl: true });
        }
      },
      error: () => (this.savingAsset = false),
    });
  }

  private loadCampaignAssetsFromApi() {
    const campaignAssetsFormArray = this.campaignForm.get('campaign_assets') as FormArray;
    campaignAssetsFormArray.clear();
    this.imagePreview = [];

    // Add all saved assets from API
    if (this.campaign?.campaign_assets && this.campaign.campaign_assets.length > 0) {
      this.campaign.campaign_assets.forEach((asset) => {
        const assetForm = this.createCampaignAsset(asset);
        campaignAssetsFormArray.push(assetForm);
        // Set image preview if available
        if (asset.image?.url) {
          this.imagePreview.push(asset.image.url);
        } else {
          this.imagePreview.push(null);
        }
      });
    }

    // Always add one empty form for new asset entry
    campaignAssetsFormArray.push(this.createCampaignAsset());
    this.imagePreview.push(null);

    this.refreshPreview();
    this.cdr.detectChanges();
  }

  private resetAssetForm() {
    const campaignAssetsFormArray = this.campaignForm.get('campaign_assets') as FormArray;
    const lastIndex = campaignAssetsFormArray.length - 1;

    if (lastIndex >= 0) {
      // Reset the last form (the empty one)
      campaignAssetsFormArray.at(lastIndex).reset();
      this.imagePreview[lastIndex] = null;
      this.refreshPreview();
    } else {
      // If no forms exist, create one
      campaignAssetsFormArray.push(this.createCampaignAsset());
      this.imagePreview.push(null);
    }

    this.cdr.detectChanges();
  }

  removeCampaignAsset(index: number) {
    if (!this.campaign?.campaign_assets || index >= this.campaign.campaign_assets.length) {
      return;
    }

    const assetToRemove = this.campaign.campaign_assets[index];
    const assetId = assetToRemove?.id;

    if (assetId == null) {
      return;
    }

    const formData = new FormData();
    const remainingAssets = this.campaign.campaign_assets.filter((asset) => asset.id !== assetId);

    // Rebuild FormData: all remaining assets, or explicitly empty so backend clears the list
    this.appendAssets(formData, remainingAssets);

    this.campaignService.updateCampaign(formData, this.campaign.id).subscribe((updatedCampaign: ICampaign) => {
      // Create a new object reference with a new array reference to ensure change detection
      this.campaign = {
        ...updatedCampaign,
        campaign_assets: updatedCampaign.campaign_assets ? [...updatedCampaign.campaign_assets] : [],
      };
      this.loadCampaignAssetsFromApi();
      this.cdr.detectChanges();
      this.toasterService.successDialog('Asset removed successfully.');
    });
  }

  patchCampaignForm() {
    if (this.campaign.name) {
      this.selectedLocations =
        this.campaign.locations?.map((loc: { location?: string } | string) =>
          typeof loc === 'string' ? loc : loc.location ?? '',
        ) ?? [];

      let communitySlugs: string[] = [];
      if (this.campaign.communities && this.campaign.communities.length > 0) {
        this.selectedCommunities = this.campaign.communities.map((community: any) => ({
          id: community.id || community,
          name: community.name || community,
          slug: community.slug || community,
        }));
        communitySlugs = this.selectedCommunities.map((c) => c.slug);
      }

      this.campaignForm.patchValue({
        name: this.campaign.name,
        start_at: this.formatDateTimeForInput(this.campaign.start_at),
        end_at: this.formatDateTimeForInput(this.campaign.end_at),
        set_end_date: !!this.campaign.end_at,
        cta_label: this.campaign.cta_label,
        budget: this.toMajorUnits(this.campaign.budget),
        locations: this.selectedLocations,
        communities: communitySlugs,
      });

      // Load campaign assets from API
      this.loadCampaignAssetsFromApi();
    }
  }

  getEstimatedImpressions(): void {
    // a launched campaign can't change targeting or budget, so an estimate would only mislead
    if (!this.campaign?.id || this.isLaunched) return;
    this.campaignService.getEstimatedImpressions(this.campaign.id).subscribe((estimate) => {
      this.estimate = estimate;
      this.cdr.detectChanges();
    });
  }

  private formatDateTimeForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const isoString = date.toISOString();
    return isoString.substring(0, 16);
  }

  onFileChange(event: any, index: number) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2 MB

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      this.toasterService.warningDialog('Please upload a valid image file (PNG, JPG, JPEG)');
      event.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      this.toasterService.warningDialog('The image size should not exceed 2 MB.');
      event.target.value = '';
      return;
    }

    // Check for image dimensions
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const campaignAssets = this.campaignForm.get('campaign_assets') as FormArray;
      if (campaignAssets && campaignAssets.at(index)) {
        campaignAssets.at(index).get('image').setValue(file);
        campaignAssets.at(index).get('image')?.updateValueAndValidity();

        // Display image preview
        this.previewImage(file, index);
      }
    };

    img.onerror = () => {
      this.toasterService.warningDialog('Invalid image file.');
      event.target.value = '';
    };
  }

  previewImage(file: File, i) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview[i] = reader.result as string;
      this.refreshPreview();
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  handleInput(value: string | number, key: string) {
    this.campaignForm.patchValue({ [key]: value });
    if (this.campaign?.id && key === 'budget') {
      this.updateCampaign();
    }
    if (key === 'start_at' || key === 'end_at') {
      this.saveDatesForEstimate();
    }
  }

  // The estimate is computed from the saved campaign, so a date change has to be saved before it can refresh.
  // Debounced, and skipped while the dates are invalid so the server isn't sent a range it will reject.
  private saveDatesForEstimate() {
    if (!this.campaign?.id || this.isLaunched) return;
    clearTimeout(this.dateSaveTimer);
    this.dateSaveTimer = setTimeout(() => {
      const datesValid =
        this.campaignForm.get('start_at')?.valid &&
        this.campaignForm.get('end_at')?.valid &&
        !this.campaignForm.errors?.['endDateValidator'];
      if (datesValid) {
        this.updateCampaign();
      }
    }, 800);
  }

  handleArrayFormInput(value: string | number, key: string, index: number, formArrayName: string) {
    const formArray = this.campaignForm.get(formArrayName) as FormArray;

    if (formArray && formArray.controls[index]) {
      formArray.at(index).patchValue({ [key]: value });
    }
  }

  private appendList(formData: FormData, key: string, values: string[]) {
    if (values.length === 0) {
      formData.append(key, '');
      return;
    }
    values.forEach((value) => formData.append(key, value));
  }

  // campaign fields only (no assets) - what a full draft save sends
  private buildCampaignFormData(): FormData {
    const formData = new FormData();
    const formValue = this.campaignForm.value;

    // Append basic campaign info with null checks
    if (formValue.name) formData.append('campaign[name]', formValue.name);
    if (formValue.cta_label) {
      formData.append('campaign[cta_label]', formValue.cta_label);
    }
    if (formValue.budget) formData.append('campaign[budget]', this.toMinorUnits(formValue.budget).toString());
    if (formValue.start_at) formData.append('campaign[start_at]', formValue.start_at);
    if (formValue.set_end_date && formValue.end_at) {
      formData.append('campaign[end_at]', formValue.end_at);
    } else {
      formData.append('campaign[end_at]', '');
    }

    // Append locations and communities. FormData can't carry an empty array, and the server only touches targeting
    // when the key is present, so an empty list is sent as one blank entry (the server strips blanks and clears).
    const locations = Array.isArray(formValue.locations) ? formValue.locations : [];
    this.appendList(formData, 'campaign[locations][]', locations);

    const communitySlugs = this.selectedCommunities.map((c) => c.slug);
    this.appendList(formData, 'campaign[communities][]', communitySlugs);
    return formData;
  }

  updateCampaign(callSubmitButton = false) {
    // the live-edit form never sends the full campaign - the server rejects locked fields
    if (this.isLaunched) return;
    // Validation
    if (!this.campaign?.id) {
      this.toasterService.warningDialog('Campaign ID is missing.');
      return;
    }

    const formData = this.buildCampaignFormData();

    // Send saved assets from API
    if (this.campaign?.campaign_assets) {
      this.appendAssets(formData, this.campaign.campaign_assets);
    }

    this.campaignService.updateCampaign(formData, this.campaign.id).subscribe((data) => {
      if (data) {
        this.campaign = { ...data, campaign_assets: data.campaign_assets ? [...data.campaign_assets] : [] };
        this.getEstimatedImpressions();
        if (this.campaign && callSubmitButton) {
          this.callSubmitForApproval();
        }
        this.loadCampaignAssetsFromApi();
        this.cdr.detectChanges();
      }
    });
  }

  openGoLiveConfirmation(dialog: TemplateRef<unknown>) {
    this.dialogService.open(dialog);
  }

  confirmGoLive(dialogRef: NbDialogRef<unknown>) {
    dialogRef.close();
    this.updateCampaign(true);
  }

  callSubmitForApproval() {
    if (this.walletCoversBudget()) {
      this.campaignService.submitForApproval(this.campaign.id).subscribe((data) => {
        if (data) {
          this.toasterService.successDialog('Campaign submitted');
          this.confettiService.celebrate();
          this.router.navigate(['/campaigns']);
        }
      });
    } else {
      this.campaignService.createPurchaseOrder(this.campaign.id, true).subscribe((data) => {
        if (data) {
          // the payment screen is the way to cover the shortfall, so no warning here
          this.router.navigate(['/checkout', data.uuid]);
        }
      });
    }
  }

  private gtmDataLayerPushEvent(eventName: string, eventData: Record<string, string | number> = {}): void {
    this.gtm.dataLayerPushEvent(eventName, eventData);
  }

  isSubmitForApprovalEnabled(): boolean {
    const name = this.campaignForm.get('name')?.valid;
    const startAt = this.campaignForm.get('start_at')?.valid;
    const budget = this.campaignForm.get('budget')?.valid;
    const locations = this.campaignForm.get('locations')?.valid;
    // the form array always holds an empty draft row, so only assets already saved to the campaign count
    const campaignAssets = (this.campaign?.campaign_assets?.length ?? 0) > 0;
    const setEndDate = this.campaignForm.get('set_end_date')?.value;
    const communities = this.campaignForm.get('communities')?.valid;
    const endAt = this.campaignForm.get('end_at');
    const endDateValid = !setEndDate || (endAt?.valid && !this.campaignForm.hasError('endDateValidator'));

    if (!name || !startAt || !budget || !locations || !endDateValid || !campaignAssets || !communities) {
      return false;
    }
    return true;
  }

  onSetEndDateChange(save = true) {
    const setEndDate = this.campaignForm.get('set_end_date')?.value;
    const endDateControl = this.campaignForm.get('end_at');

    if (endDateControl) {
      if (setEndDate) {
        endDateControl.setValidators([Validators.required]);
        if (!endDateControl.value) {
          endDateControl.setValue(this.earliestEndAt());
        }
      } else {
        endDateControl.clearValidators();
        endDateControl.setValue('');
      }
      endDateControl.updateValueAndValidity();
    }
    if (save) {
      this.saveDatesForEstimate();
    }
  }

  isForm1Invalid(): boolean {
    const nameControl = this.campaignForm.get('name');
    const startAtControl = this.campaignForm.get('start_at');
    const setEndDate = this.campaignForm.get('set_end_date')?.value;
    const endAtControl = this.campaignForm.get('end_at');

    if (nameControl?.invalid || startAtControl?.invalid) {
      nameControl.markAsTouched();
      startAtControl.markAsTouched();
      return true;
    }

    if (setEndDate && (endAtControl?.invalid || this.campaignForm.hasError('endDateValidator'))) {
      endAtControl.markAsTouched();
      return true;
    }

    return false;
  }

  onAccordion2Click(event: MouseEvent) {
    if (this.isLaunched) return;
    if (this.router.url.includes('/edit/')) {
      return;
    }

    if (this.isForm1Invalid()) {
      this.form1Invalid = true;
      return;
    } else {
      event.preventDefault();
      event.stopPropagation();
      this.form1Invalid = false;
      this.createCampaign();
    }
  }

  isForm2Invalid(): boolean {
    const budgetControl = this.campaignForm.get('budget');
    const locationsControl = this.campaignForm.get('locations');

    if (budgetControl?.invalid || locationsControl?.invalid) {
      budgetControl?.markAsTouched();
      locationsControl?.markAsTouched();
      return true;
    }

    return false;
  }

  onAccordion3Click(event: MouseEvent) {
    if (this.isLaunched) return;
    if (this.isForm1Invalid() || this.isForm2Invalid()) {
      if (this.isForm1Invalid()) {
        this.form1Invalid = true;
        return;
      }
      if (this.isForm2Invalid()) {
        this.form2Invalid = true;
        return;
      }
    } else {
      event.preventDefault();
      event.stopPropagation();
      this.form1Invalid = false;
      this.form2Invalid = false;
      this.updateCampaign();
    }
  }

  initAutocomplete() {
    const inputElement = this.locationSearchInput?.nativeElement;

    if (inputElement) {
      this.googlePlacesAutocompleteService.initAutocompleteWithTypeRestrictions(inputElement, {
        types: ['locality', 'administrative_area_level_1', 'country'],
      });

      this.subscriptions.add(
        this.googlePlacesAutocompleteService.placeChanged.subscribe((place: google.maps.places.PlaceResult) => {
          this.onLocationPlaceSelected(place);
        }),
      );
    }
  }

  onLocationPlaceSelected(place: google.maps.places.PlaceResult) {
    const address = place.formatted_address;
    if (!address) return;
    if (this.selectedLocations.includes(address)) return;
    this.selectedLocations.push(address);
    this.syncLocationsForm();
    this.locationsFormControl.setValue('', { emitEvent: false });
    this.locationSearchInput?.nativeElement?.focus();
    if (this.campaign?.id) {
      this.updateCampaign();
    }
  }

  removeLocation(index: number) {
    this.selectedLocations.splice(index, 1);
    this.syncLocationsForm();
    if (this.campaign?.id) {
      this.updateCampaign();
    }
  }

  private syncLocationsForm(): void {
    this.campaignForm.get('locations').setValue([...this.selectedLocations]);
    this.campaignForm.get('locations').updateValueAndValidity();
    this.cdr.detectChanges();
  }

  observeCommunitiesInput() {
    const communitiesSub = this.communitiesFormControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value: string) => {
          if (!value) {
            this.communitiesSearchResult = [];
            this.searchingCommunities = false;
            this.cdr.detectChanges();
            return EMPTY;
          }
          this.searchingCommunities = true;
          this.communitiesSearchResult = [];
          this.cdr.detectChanges();
          return this.searchService.getSearchResultsByScope(value, this.page, this.count, EDbModels.KOMMUNITY);
        }),
      )
      .subscribe((value: ISearch) => {
        this.communitiesSearchResult = value.results;
        this.searchingCommunities = false;
        this.cdr.detectChanges();
      });
    this.subscriptions.add(communitiesSub);
  }

  onCommunitySelected(communityId: number, communityName: string, communitySlug: string) {
    const isAlreadySelected = this.selectedCommunities.some(
      (community) => community.id === communityId || community.slug === communitySlug,
    );

    if (!isAlreadySelected) {
      this.selectedCommunities.push({
        id: communityId,
        name: communityName,
        slug: communitySlug,
      });

      const communitySlugs = this.selectedCommunities.map((c) => c.slug);
      this.campaignForm.get('communities').setValue(communitySlugs);

      this.communitiesFormControl.setValue('', { emitEvent: false });

      if (this.campaign?.id) {
        this.updateCampaign();
      }
    }
  }

  removeCommunity(index: number) {
    this.selectedCommunities.splice(index, 1);
    const communitySlugs = this.selectedCommunities.map((c) => c.slug);
    this.campaignForm.get('communities').setValue(communitySlugs);
    if (this.campaign?.id) {
      this.updateCampaign();
    }
  }

  getFundStatus() {
    this.walletService.getFundStatus(this.campaign.currency_type).subscribe((res) => {
      this.wallet = res;
      this.cdr.detectChanges();
    });
  }
}
