import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICampaignType } from '@commudle/shared-models';
import { SeoService, ToastrService } from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { SysAdminCampaignService } from 'apps/commudle-admin/src/app/feature-modules/sys-admin/services/sys-admin-campaign.service';
@Component({
  selector: 'commudle-campaign-types',
  templateUrl: './campaign-types.component.html',
  styleUrls: ['./campaign-types.component.scss'],
  standalone: false,
})
export class CampaignTypesComponent implements OnInit, OnDestroy {
  campaignTypeForm: FormGroup;
  campaignTypes: ICampaignType[];
  icons = {
    faEdit,
    faTrash,
  };
  isLoading = true;

  tinyMCE = {
    min_height: 200,
    menubar: false,
    convert_urls: false,
    placeholder: 'Description for your Campaign Type',
    content_style: 'body {font-family: system-ui, sans-serif; font-size: 14px !important;}',
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
      'image',
    ],
    toolbar:
      'h2  h3  h4  h5 fontsize | bold italic backcolor | emoticons | link | image | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat',
    default_link_target: '_blank',
    font_size_formats: '8px 10px 12px 14px 16px 18px 20px 22px 24px',
    branding: false,
    license_key: 'gpl',
  };

  constructor(
    private dialogService: NbDialogService,
    private fb: FormBuilder,
    private sysAdminCampaignTypesService: SysAdminCampaignService,
    private toasterService: ToastrService,
    private seoService: SeoService,
  ) {
    this.campaignTypeForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      description: ['', Validators.required],
      active: [true],
      budget_amount: ['', Validators.required],
      image_dimension: this.fb.group({
        height: [NaN, Validators.required],
        width: [NaN, Validators.required],
      }),
    });
  }

  ngOnInit() {
    this.getCampaignTypes();
    this.seoService.noIndex(true);
    this.seoService.setTags(
      'Admin | Campaign Types',
      'List of all campaign types',
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
  }

  getCampaignTypes() {
    this.sysAdminCampaignTypesService.getCampaignTypes().subscribe((res: ICampaignType[]) => {
      this.campaignTypes = res;
      this.isLoading = false;
    });
  }

  openDialog(dialog, campaignType?: ICampaignType) {
    if (campaignType) {
      this.campaignTypeForm.patchValue({
        name: campaignType.name,
        description: campaignType.description,
        active: campaignType.active,
        budget_amount: campaignType.budget_amount,
        slug: campaignType.slug,
        image_dimension: {
          height: campaignType?.image_dimension?.height,
          width: campaignType?.image_dimension?.width,
        },
      });
    } else {
      this.campaignTypeForm.reset();
      this.campaignTypeForm.patchValue({
        active: true,
      });
    }
    this.dialogService.open(dialog, { context: { campaignType: campaignType } });
  }

  create() {
    this.sysAdminCampaignTypesService.createCampaignType(this.campaignTypeForm.value).subscribe((res) => {
      if (res) {
        this.campaignTypes.push(res);
      }
    });
  }

  update(campaignTypeId: number) {
    this.sysAdminCampaignTypesService
      .updateCampaignType(this.campaignTypeForm.value, campaignTypeId)
      .subscribe((res) => {
        if (res) {
          const campaignTypeIndex = this.campaignTypes.findIndex((c) => c.id === campaignTypeId);
          this.campaignTypes[campaignTypeIndex] = res;
        }
      });
  }

  toggleCampaignStatus(campaignTypeId: number) {
    this.sysAdminCampaignTypesService.toggleCampaignTypeStatus(campaignTypeId).subscribe((res) => {
      if (res) {
        const campaignTypeIndex = this.campaignTypes.findIndex((c) => c.id === campaignTypeId);
        this.campaignTypes[campaignTypeIndex].active = !this.campaignTypes[campaignTypeIndex].active;
        this.toasterService.successDialog('Campaign status updated successfully');
      }
    });
  }

  generateSlug() {
    const slug = this.campaignTypeForm
      .get('name')
      .value.trim() // Remove leading & trailing spaces
      .toLowerCase() // Convert to lowercase
      .replace(/\s+/g, '-'); // Replace spaces with '-
    this.campaignTypeForm.patchValue({
      slug: slug,
    });
  }
}
