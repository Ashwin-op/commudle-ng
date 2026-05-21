import { NbDialogService } from '@commudle/theme';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faPlus, faFileImage, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathonSponsor, IHackathonSponsorGroupedByTierName } from 'apps/shared-models/hackathon-sponsor';
import { ToastrService, SeoService } from '@commudle/shared-services';
import { Subscription } from 'rxjs';
import { IHackathon, ICommunity } from '@commudle/shared-models';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';

@Component({
  selector: 'commudle-hackathon-control-panel-sponsor',
  templateUrl: './hackathon-control-panel-sponsor.component.html',
  styleUrls: ['./hackathon-control-panel-sponsor.component.scss'],
  standalone: false,
})
export class HackathonControlPanelSponsorComponent implements OnInit, OnDestroy {
  sponsorForm: FormGroup;
  hackathonSlug = '';
  icons = {
    faPlus,
    faFileImage,
    faXmark,
  };
  imagePreview: string;

  parent: ICommunity | ICommunityGroup;
  subscriptions: Subscription[] = [];
  hackathon: IHackathon;

  hackathonSponsorGroupedByTierName: IHackathonSponsorGroupedByTierName;
  @ViewChild('tierNameInput') tierNameInput: ElementRef;

  constructor(
    private activatedRoute: ActivatedRoute,
    private nbDialogService: NbDialogService,
    private fb: FormBuilder,
    private hackathonService: HackathonService,
    private toasterService: ToastrService,
    private seoService: SeoService,
  ) {
    this.sponsorForm = this.fb.group({
      name: ['', Validators.required],
      description: '',
      logo: [null, Validators.required],
      tier_name: ['', Validators.required],
      link: ['', this.urlValidator],
      tier_priority: [1, Validators.required],
    });
  }

  ngOnInit() {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.paramMap.subscribe((params) => {
        this.hackathonSlug = params.get('hackathon_id');
        this.indexSponsors(params.get('hackathon_id'));
        this.fetchHackathonDetails(params.get('hackathon_id'));
      }),
    );
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
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

  urlValidator(control) {
    if (control.value && !/^https?:\/\//.test(control.value)) {
      return { invalidUrl: true };
    }
    return null;
  }

  openSponsorDialogBox(dialog, hackathonSponsor?: IHackathonSponsor, index?) {
    this.imagePreview = '';
    if (hackathonSponsor) {
      this.sponsorForm.patchValue({
        name: hackathonSponsor.sponsor.name,
        description: hackathonSponsor.description,
        logo: [null, Validators.required],
        tier_name: hackathonSponsor.tier_name,
        link: hackathonSponsor.sponsor.link,
        tier_priority: hackathonSponsor.tier_priority,
      });
      this.imagePreview = hackathonSponsor.sponsor.logo.url;
    } else {
      this.resetSponsorForm();
    }

    this.nbDialogService.open(dialog, {
      context: { index: index, sponsor: hackathonSponsor },
    });

    setTimeout(() => {
      if (this.tierNameInput) {
        this.tierNameInput.nativeElement.focus();
      }
    }, 0);
  }

  openConfirmDeleteDialogBox(dialog, sponsorId, index) {
    this.nbDialogService.open(dialog, {
      context: { index: index, sponsorId: sponsorId },
    });
  }

  indexSponsors(hackathonId) {
    this.hackathonService.indexSponsors(hackathonId).subscribe((data: IHackathonSponsorGroupedByTierName) => {
      this.hackathonSponsorGroupedByTierName = data;
    });
  }

  onFileChange(event) {
    const file = (event.target as HTMLInputElement).files[0];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      this.toasterService.warningDialog('Please upload a valid image file (PNG, JPG, JPEG)');
      return;
    }
    this.sponsorForm.patchValue({
      logo: file,
    });
    this.sponsorForm.get('logo').updateValueAndValidity();

    // Display image preview
    this.previewImage(file);
  }

  previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeBannerImage() {
    this.imagePreview = '';
    this.sponsorForm.patchValue({
      logo: '',
    });
  }

  createSponsor() {
    const formData = new FormData();

    Object.keys(this.sponsorForm.value).forEach((key) => {
      const value = this.sponsorForm.value[key];

      if (value instanceof File) {
        formData.append('sponsor[' + key + ']', value, value.name); // Append the file with its name
      } else if (key !== 'logo') {
        formData.append('sponsor[' + key + ']', value);
      }
    });
    this.hackathonService.createSponsor(formData, this.hackathonSlug).subscribe((data: IHackathonSponsor) => {
      if (data) {
        const tierName = data.tier_name;

        if (!this.hackathonSponsorGroupedByTierName[tierName]) {
          this.hackathonSponsorGroupedByTierName[tierName] = [];
        }
        this.hackathonSponsorGroupedByTierName[tierName].unshift(data);
        this.toasterService.successDialog('Sponsor added successfully!');
      }
    });
  }

  destroySponsor(sponsor: IHackathonSponsor, index: number) {
    this.hackathonService.destroySponsor(sponsor.id).subscribe((data) => {
      if (data) {
        const tierName = sponsor.tier_name;

        if (this.hackathonSponsorGroupedByTierName[tierName]) {
          this.hackathonSponsorGroupedByTierName[tierName].splice(index, 1);

          // Remove the tier if it becomes empty
          if (this.hackathonSponsorGroupedByTierName[tierName].length === 0) {
            delete this.hackathonSponsorGroupedByTierName[tierName];
          }
        }

        this.toasterService.successDialog('Sponsor removed successfully!');
      }
    });
  }

  updateSponsor(sponsorId: number, index: number, tierName: string) {
    const formData = new FormData();

    Object.keys(this.sponsorForm.value).forEach((key) => {
      const value = this.sponsorForm.value[key];

      if (value instanceof File) {
        formData.append(`sponsor[${key}]`, value, value.name); // Append the file with its name
      } else if (key !== 'logo') {
        formData.append(`sponsor[${key}]`, value);
      }
    });

    this.hackathonService.updateSponsor(formData, sponsorId).subscribe((data: IHackathonSponsor) => {
      if (data) {
        const oldTierName = this.hackathonSponsorGroupedByTierName[tierName] ? tierName : null;
        const newTierName = data.tier_name;

        // Remove sponsor from old tier if tier name changed
        if (oldTierName && oldTierName !== newTierName) {
          this.hackathonSponsorGroupedByTierName[oldTierName].splice(index, 1);

          // If old tier is empty, delete it
          if (this.hackathonSponsorGroupedByTierName[oldTierName].length === 0) {
            delete this.hackathonSponsorGroupedByTierName[oldTierName];
          }

          // Add sponsor to new tier
          if (!this.hackathonSponsorGroupedByTierName[newTierName]) {
            this.hackathonSponsorGroupedByTierName[newTierName] = [];
          }
          this.hackathonSponsorGroupedByTierName[newTierName].push(data);
        } else {
          // If the tier name didn't change, simply update the existing entry
          this.hackathonSponsorGroupedByTierName[tierName][index] = data;
        }

        this.toasterService.successDialog('Sponsor updated successfully!');
        this.resetSponsorForm();
      }
    });
  }

  resetSponsorForm() {
    this.sponsorForm.patchValue({
      name: '',
      description: '',
      logo: null,
      tier_name: '',
      link: '',
      tier_priority: 1,
    });
  }

  setMeta() {
    this.seoService.setTitle(`Sponsors | Dashboard | ${this.hackathon.name} | ${this.parent.name}`);
  }
}
