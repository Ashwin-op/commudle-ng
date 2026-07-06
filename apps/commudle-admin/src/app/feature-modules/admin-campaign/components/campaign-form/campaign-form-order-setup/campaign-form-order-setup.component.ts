import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { ICampaign, ICampaignAsset, ICampaignEstimate, EDbModels, IWallet } from '@commudle/shared-models';
import {
  CampaignService,
  GoogleTagManagerService,
  SeoService,
  ToastrService,
  WalletService,
} from '@commudle/shared-services';
import { GooglePlacesAutocompleteService } from 'apps/commudle-admin/src/app/services/google-places-autocomplete.service';
import { SearchService } from 'apps/commudle-admin/src/app/feature-modules/search/services/search.service';
import { ISearch } from 'apps/shared-models/search.model';
import { faArrowRight, faFileImage, faRectangleAd, faTrash } from '@fortawesome/free-solid-svg-icons';
import { debounceTime, distinctUntilChanged, EMPTY, switchMap } from 'rxjs';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { environment } from '@commudle/shared-environments';

@Component({
  selector: 'commudle-campaign-form-order-setup',
  templateUrl: './campaign-form-order-setup.component.html',
  styleUrls: ['./campaign-form-order-setup.component.scss'],
  standalone: false,
})
export class CampaignFormOrderSetupComponent implements OnInit, AfterViewInit {
  @ViewChild('locationSearchInput', { read: ElementRef }) locationSearchInput: ElementRef;
  campaignForm: FormGroup;
  icons = {
    faArrowRight,
    faFileImage,
    faRectangleAd,
    faTrash,
  };
  campaign: ICampaign;
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
  ) {
    this.campaignForm = this._fb.group(
      {
        name: ['', Validators.required],
        start_at: ['', Validators.required],
        end_at: [''],
        set_end_date: [false],
        cta_label: [''],
        budget: [0, [Validators.required, Validators.min(50)]],
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
    if (this.router.url.includes('/edit/')) {
      const campaignId = this.activatedRoute.parent?.snapshot?.paramMap?.get('campaign_id');
      this.campaignService.fetchCampaign(campaignId).subscribe((campaign) => {
        if (campaign) {
          this.campaign = campaign;
          this.patchCampaignForm();
          this.getFundStatus();
          setTimeout(() => {
            if (this.campaignForm.get('set_end_date')?.value) {
              this.onSetEndDateChange();
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

  createCampaign() {
    const formData = new FormData();
    formData.append('campaign[name]', this.campaignForm.value.name);
    formData.append('campaign[start_at]', this.campaignForm.value.start_at || null);

    if (this.campaignForm.get('set_end_date')?.value) {
      formData.append('campaign[end_at]', this.campaignForm.value.end_at || null);
    }

    this.campaignService.createCampaign(formData).subscribe((res: ICampaign) => {
      if (res) {
        this.campaign = res;
        this.getFundStatus();
        this.router.navigate(['campaigns', 'edit', res.id], { replaceUrl: true });
        this.gtmDataLayerPushEvent('new-campaign-step-1-created', {
          com_campaign_id: res.id,
        });
      }
    });
  }

  endDateValidator(formGroup: AbstractControl): ValidationErrors | null {
    const startDate = formGroup.get('start_at')?.value;
    const endDate = formGroup.get('end_at')?.value;

    if (!startDate || !endDate) return null; // No validation if either date is missing

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure end date is at least 3 days after the start date
    const minEndDate = new Date(start);
    minEndDate.setDate(minEndDate.getDate() + 3);

    return end < minEndDate ? { endDateValidator: true } : null;
  }

  createCampaignAsset(asset?: ICampaignAsset): FormGroup {
    return this._fb.group({
      id: [asset ? asset?.id : ''],
      image: [asset ? asset?.image?.url : null, Validators.required],
      url: [asset ? asset?.url : '', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]], // Ensure URL is valid
    });
  }

  get campaignAssets(): FormArray {
    return this.campaignForm.get('campaign_assets') as FormArray;
  }

  addAsset(index: number) {
    const savedCount = this.campaign?.campaign_assets?.length ?? 0;
    if (savedCount >= 5) {
      this.toasterService.warningDialog(`Maximum 5 campaign assets allowed. Remove an asset to add a new one.`);
      return;
    }

    const currentGroup = this.campaignAssets.at(index) as FormGroup;
    if (currentGroup.invalid) {
      currentGroup.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    const assetData = currentGroup.value;
    const url = (currentGroup.get('url')?.value ?? assetData.url ?? '') as string;
    const existingAssets = this.campaign?.campaign_assets ?? [];
    let nextIndex = 0;

    // Include all existing assets so the API replaces the array with existing + new, not just the new one
    existingAssets.forEach((asset, idx) => {
      formData.append(`campaign[campaign_assets][${idx}][url]`, asset.url ?? '');
      if (asset.id) {
        formData.append(`campaign[campaign_assets][${idx}][id]`, asset.id.toString());
      }
      nextIndex = idx + 1;
    });

    // Append the new asset at the next index
    formData.append(`campaign[campaign_assets][${nextIndex}][url]`, url);
    if (assetData.id) {
      formData.append(`campaign[campaign_assets][${nextIndex}][id]`, assetData.id);
    }
    if (assetData.image instanceof File) {
      formData.append(`campaign[campaign_assets][${nextIndex}][image]`, assetData.image);
    }

    this.campaignService.updateCampaign(formData, this.campaign.id).subscribe((updatedCampaign: ICampaign) => {
      this.campaign = {
        ...updatedCampaign,
        campaign_assets: updatedCampaign.campaign_assets ? [...updatedCampaign.campaign_assets] : [],
      };
      this.loadCampaignAssetsFromApi();
      this.resetAssetForm();
      this.cdr.detectChanges();
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

    this.cdr.detectChanges();
  }

  private resetAssetForm() {
    const campaignAssetsFormArray = this.campaignForm.get('campaign_assets') as FormArray;
    const lastIndex = campaignAssetsFormArray.length - 1;

    if (lastIndex >= 0) {
      // Reset the last form (the empty one)
      campaignAssetsFormArray.at(lastIndex).reset();
      this.imagePreview[lastIndex] = null;
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
    remainingAssets.forEach((asset, idx) => {
      formData.append(`campaign[campaign_assets][${idx}][url]`, asset.url ?? '');
      if (asset.id != null) {
        formData.append(`campaign[campaign_assets][${idx}][id]`, asset.id.toString());
      }
    });

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
        budget: this.campaign.budget,
        locations: this.selectedLocations,
        communities: communitySlugs,
      });

      // Load campaign assets from API
      this.loadCampaignAssetsFromApi();
    }
  }

  getEstimatedImpressions(): void {
    if (!this.campaign?.id) return;
    // this.campaignService.getEstimatedImpressions(this.campaign.id).subscribe((res) => {
    //   this.estimate = res.data;
    //   this.cdr.detectChanges();
    // });
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
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  handleInput(value: string | number, key: string) {
    this.campaignForm.patchValue({ [key]: value });
    if (this.campaign?.id && key === 'budget') {
      this.updateCampaign();
    }
  }

  handleArrayFormInput(value: string | number, key: string, index: number, formArrayName: string) {
    const formArray = this.campaignForm.get(formArrayName) as FormArray;

    if (formArray && formArray.controls[index]) {
      formArray.at(index).patchValue({ [key]: value });
    }
  }

  updateCampaign(callSubmitButton = false) {
    // Validation
    if (!this.campaign?.id) {
      this.toasterService.warningDialog('Campaign ID is missing.');
      return;
    }

    const formData = new FormData();
    const formValue = this.campaignForm.value;

    // Append basic campaign info with null checks
    if (formValue.name) formData.append('campaign[name]', formValue.name);
    if (formValue.cta_label) {
      formData.append('campaign[cta_label]', formValue.cta_label);
    }
    if (formValue.budget) formData.append('campaign[budget]', formValue.budget.toString());
    if (formValue.start_at) formData.append('campaign[start_at]', formValue.start_at);
    if (formValue.set_end_date && formValue.end_at) {
      formData.append('campaign[end_at]', formValue.end_at);
    } else {
      formData.append('campaign[end_at]', '');
    }

    // Append locations and communities
    const locations = Array.isArray(formValue.locations) ? formValue.locations : [];
    locations.forEach((loc) => formData.append('campaign[locations][]', loc));

    const communitySlugs = this.selectedCommunities.map((c) => c.slug);
    communitySlugs.forEach((slug) => formData.append('campaign[communities][]', slug));

    // Send saved assets from API
    if (this.campaign?.campaign_assets) {
      this.campaign.campaign_assets.forEach((asset, index) => {
        if (asset.url) {
          formData.append(`campaign[campaign_assets][${index}][url]`, asset.url ?? '');
          if (asset.id) {
            formData.append(`campaign[campaign_assets][${index}][id]`, asset.id.toString());
          }
        }
      });
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

  callSubmitForApproval() {
    if (this.wallet && this.wallet.available_balance >= this.campaignForm?.get('budget')?.value) {
      this.campaignService.submitForApproval(this.campaign.id).subscribe((data) => {
        if (data) {
          this.toasterService.successDialog('Campaign submitted');
          this.router.navigate(['/campaigns']);
        }
      });
    } else {
      this.campaignService.createPurchaseOrder(this.campaign.id, true).subscribe((data) => {
        if (data) {
          this.toasterService.warningDialog(
            'You do not have enough balance to submit for approval. Please add more balance to your wallet.',
          );
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
    const campaignAssets = (this.campaignForm.get('campaign_assets') as FormArray).length > 0;
    const setEndDate = this.campaignForm.get('set_end_date')?.value;
    const communities = this.campaignForm.get('communities')?.valid;
    const endAt = this.campaignForm.get('end_at');
    const endDateValid = !setEndDate || (endAt?.valid && !this.campaignForm.hasError('endDateValidator'));

    if (!name || !startAt || !budget || !locations || !endDateValid || !campaignAssets || !communities) {
      return false;
    }
    return true;
  }

  onSetEndDateChange() {
    const setEndDate = this.campaignForm.get('set_end_date')?.value;
    const endDateControl = this.campaignForm.get('end_at');

    if (endDateControl) {
      if (setEndDate) {
        endDateControl.setValidators([Validators.required]);
      } else {
        endDateControl.clearValidators();
        endDateControl.setValue('');
      }
      endDateControl.updateValueAndValidity();
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

      this.googlePlacesAutocompleteService.placeChanged.subscribe((place: google.maps.places.PlaceResult) => {
        this.onLocationPlaceSelected(place);
      });
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
    this.communitiesFormControl.valueChanges
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
