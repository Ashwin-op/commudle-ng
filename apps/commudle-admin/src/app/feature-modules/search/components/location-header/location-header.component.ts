import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { IListingPageHeader } from 'apps/shared-models/listing-page-header.model';
import { CmsService } from 'apps/shared-services/cms.service';

@Component({
  selector: 'commudle-location-header',
  templateUrl: './location-header.component.html',
  styleUrls: ['./location-header.component.scss'],
  standalone: false,
})
export class LocationHeaderComponent implements OnInit, OnChanges {
  @Input() locationPageHeader: IListingPageHeader;
  @Input() query: string;
  @Input() total: number;
  @Input() communities = [];
  @Input() events = [];
  @Input() projects = [];
  @Input() labs = [];
  headerImagePath: string;
  richText: string;
  staticAssets = staticAssets;

  constructor(private cmsService: CmsService) {}

  ngOnInit(): void {
    this.setHeaderContent();
  }

  ngOnChanges(): void {
    this.setHeaderContent();
  }

  private setHeaderContent(): void {
    this.headerImagePath = this.locationPageHeader?.background_image
      ? this.imageUrl(this.locationPageHeader.background_image, 1600).url()
      : this.staticAssets.search_page_background;
    if (this.locationPageHeader) {
      this.richText = this.cmsService.getHtmlFromBlock(this.locationPageHeader);
    }
  }

  imageUrl(source: any, maxWidth = 1000) {
    return this.cmsService.getImageUrl(source).width(maxWidth);
  }

  getHeaderText() {
    this.richText = this.cmsService.getHtmlFromBlock(this.locationPageHeader);
  }
}
