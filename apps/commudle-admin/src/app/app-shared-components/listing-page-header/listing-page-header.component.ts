import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsService } from 'apps/shared-services/cms.service';
import { IListingPageHeader } from 'apps/shared-models/listing-page-header.model';
import { SharedComponentsModule } from '@commudle/shared-components';
import { ECampaignTypeSlug, EDbModels } from '@commudle/shared-models';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'commudle-listing-page-header',
  standalone: true,
  imports: [CommonModule, SharedComponentsModule, SharedPipesModule],
  templateUrl: './listing-page-header.component.html',
  styleUrls: ['./listing-page-header.component.scss'],
})
export class ListingPageHeaderComponent implements OnInit {
  @Input() parentType: string;
  // the header image can carry a paid ad; listing pages that show the ad in the sidebar turn it off here
  @Input() showAd = true;
  header: IListingPageHeader;
  headerImgUrl: string;
  richText: string;
  CampaignTypeSlug: string;

  @Output() seoPreviewImageRetrieved = new EventEmitter<string>();

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.getHeaderText(this.parentType);
    switch (this.parentType) {
      case 'event-listing-page':
        this.CampaignTypeSlug = ECampaignTypeSlug.LISTING_PAGE_EVENTS_BANNER;
        break;
      case 'communities':
        this.CampaignTypeSlug = ECampaignTypeSlug.LISTING_PAGE_COMMUNITIES_BANNER;
        break;
      case 'labs':
        this.CampaignTypeSlug = ECampaignTypeSlug.LISTING_PAGE_LABS_BANNER;
        break;
      case 'builds':
        this.CampaignTypeSlug = ECampaignTypeSlug.LISTING_PAGE_BUILDS_BANNER;
        break;
      case 'speakers':
        this.CampaignTypeSlug = ECampaignTypeSlug.LISTING_PAGE_SPEAKERS_BANNER;
        break;
    }
  }

  imageUrl(source: any) {
    return this.cmsService.getImageUrl(source);
  }

  getHeaderText(parentType) {
    this.cmsService.getDataBySlug(parentType).subscribe((data) => {
      this.header = data;
      this.headerImgUrl = this.imageUrl(this.header.header_image).url();
      this.seoPreviewImageRetrieved.emit(this.headerImgUrl);
      this.richText = this.cmsService.getHtmlFromBlock(data);
    });
  }
}
