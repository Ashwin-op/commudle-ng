import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { IEventSponsor, IEventSponsorGroupedByTierName } from 'apps/shared-models/event_sponsor.model';
import { ISponsor } from 'apps/shared-models/sponsor.model';
import { ActivatedRoute } from '@angular/router';
import { EventSponsorsService } from 'apps/commudle-admin/src/app/services/event-sponsors.service';
import { Subscription } from 'rxjs';
import { IEvent, ICommunity } from '@commudle/shared-models';
import { SeoService, ToastrService } from '@commudle/shared-services';
import { faImage } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-sponsors',
  templateUrl: './sponsors.component.html',
  styleUrls: ['./sponsors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SponsorsComponent implements OnInit, OnDestroy {
  @Input() event: IEvent;

  community: ICommunity;
  existingSponsors: ISponsor[] = [];
  eventSponsorGroupedByTierName: IEventSponsorGroupedByTierName;
  sponsors: IEventSponsor[];
  dialogRef: NbDialogRef<any>;
  sponsorForm: FormGroup;
  imagePreview = '';
  readonly sponsorSelectionNew = 'new';
  loadingExistingSponsors = false;
  readonly icons = { faImage };

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private toastLogService: ToastrService,
    private eventSponsorsService: EventSponsorsService,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dialogService: NbDialogService,
    private seoService: SeoService,
  ) {
    this.sponsorForm = this.fb.group({
      sponsor_selection: [null, Validators.required],
      tier_name: ['', Validators.required],
      tier_priority: [1, Validators.required],
      name: ['', Validators.required],
      description: [''],
      logo: [null, Validators.required],
      link: ['', this.urlValidator],
    });
  }

  ngOnInit() {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.event = data.event;
        this.community = data.community;
        this.setMeta();
        this.getAllSponsors();
      }),
    );
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  urlValidator(control: { value: string }) {
    return control.value && !/^https?:\/\//.test(control.value) ? { invalidUrl: true } : null;
  }

  getAllSponsors() {
    this.eventSponsorsService.index(this.event.slug).subscribe((data: IEventSponsorGroupedByTierName) => {
      this.eventSponsorGroupedByTierName = data;
      this.changeDetectorRef.markForCheck();
    });
  }

  openForm(dialogRefTemplate: TemplateRef<any>) {
    this.loadingExistingSponsors = true;
    this.dialogRef = this.dialogService.open(dialogRefTemplate);
    this.resetSponsorForm();
    this.getPastSponsors();
  }

  getPastSponsors() {
    this.loadingExistingSponsors = true;
    this.eventSponsorsService.getExistingSponsors(this.event.slug).subscribe((data) => {
      this.existingSponsors = data.sponsors;
      this.loadingExistingSponsors = false;
      this.changeDetectorRef.markForCheck();
    });
  }

  onSponsorSelectionChange() {
    const selection = this.sponsorForm.get('sponsor_selection')?.value;
    if (!selection) {
      return;
    }

    if (selection === this.sponsorSelectionNew) {
      this.imagePreview = '';
      this.sponsorForm.patchValue({ name: '', description: '', link: '', logo: null });
    } else {
      const sponsor = this.existingSponsors.find((s) => s.id === Number(selection));
      if (!sponsor) {
        return;
      }

      this.imagePreview = sponsor.logo?.url ?? '';
      this.sponsorForm.patchValue({
        name: sponsor.name,
        link: sponsor.link ?? '',
        logo: sponsor.logo?.url ?? null,
      });
      this.sponsorForm.markAsUntouched();
    }

    this.changeDetectorRef.markForCheck();
  }

  createSponsor() {
    const selection = this.sponsorForm.get('sponsor_selection')?.value;

    if (selection === this.sponsorSelectionNew) {
      const formData = new FormData();

      Object.keys(this.sponsorForm.value).forEach((key) => {
        if (key === 'sponsor_selection') {
          return;
        }

        const value = this.sponsorForm.value[key];

        if (value instanceof File) {
          formData.append('sponsor[' + key + ']', value, value.name);
        } else if (key !== 'logo') {
          formData.append('sponsor[' + key + ']', value);
        }
      });

      this.eventSponsorsService.create(this.event.slug, formData).subscribe((data) => {
        if (data) {
          const tierName = data.tier_name;
          if (!this.eventSponsorGroupedByTierName[tierName]) {
            this.eventSponsorGroupedByTierName[tierName] = [];
          }
          this.eventSponsorGroupedByTierName[tierName].unshift(data);
          this.dialogRef.close();
          this.resetSponsorForm();
          this.toastLogService.successDialog('Sponsor added successfully!');
          this.changeDetectorRef.markForCheck();
        }
      });
      return;
    } else {
      const { tier_name, tier_priority, description } = this.sponsorForm.value;
      this.eventSponsorsService
        .addExistingSponsor(this.event.slug, Number(selection), tier_name, tier_priority, description ?? '')
        .subscribe((data) => {
          if (data) {
            const tierName = data.tier_name;
            if (!this.eventSponsorGroupedByTierName[tierName]) {
              this.eventSponsorGroupedByTierName[tierName] = [];
            }
            this.eventSponsorGroupedByTierName[tierName].unshift(data);
            this.dialogRef.close();
            this.resetSponsorForm();
            this.toastLogService.successDialog('Sponsor added successfully!');
            this.changeDetectorRef.markForCheck();
          }
        });
    }
  }

  removeSponsor(sponsor: IEventSponsor, tierName: string, index: number) {
    this.eventSponsorsService.destroy(sponsor.id).subscribe((data) => {
      if (data) {
        if (this.eventSponsorGroupedByTierName[tierName]) {
          this.eventSponsorGroupedByTierName[tierName].splice(index, 1);

          // Remove the tier if it becomes empty
          if (this.eventSponsorGroupedByTierName[tierName].length === 0) {
            delete this.eventSponsorGroupedByTierName[tierName];
          }
        }

        this.toastLogService.successDialog('Sponsor removed successfully!');
      }
      this.changeDetectorRef.markForCheck();
    });
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 2425190) {
      this.toastLogService.warningDialog('Image should be less than 2 Mb', 3000);
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      this.toastLogService.warningDialog('Please upload a valid image file (PNG, JPG, JPEG)');
      return;
    }

    this.sponsorForm.patchValue({ logo: file });
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.changeDetectorRef.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeBannerImage() {
    this.imagePreview = '';
    this.sponsorForm.patchValue({ logo: null });
  }

  resetSponsorForm() {
    this.sponsorForm.reset({
      sponsor_selection: this.sponsorSelectionNew,
      tier_name: '',
      tier_priority: 1,
      name: '',
      description: '',
      logo: null,
      link: '',
    });
    this.imagePreview = '';
  }

  openConfirmDeleteDialog(template: TemplateRef<unknown>, sponsor: IEventSponsor, tierName: string, index: number) {
    this.dialogService.open(template, { context: { sponsor_id: sponsor, tierName, index } });
  }

  setMeta() {
    this.seoService.setTitle(`Sponsors | Dashboard | ${this.event.name} | ${this.community.name}`);
  }
}
