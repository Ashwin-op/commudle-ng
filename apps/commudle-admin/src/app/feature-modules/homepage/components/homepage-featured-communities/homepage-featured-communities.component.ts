import { Component, OnInit } from '@angular/core';
// import getImagePalette from 'image-palette-core';
import { FeaturedItemsService } from 'apps/commudle-admin/src/app/services/featured-items.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { IFeaturedItems } from 'apps/shared-models/featured-items.model';

@Component({
  selector: 'app-homepage-featured-communities',
  templateUrl: './homepage-featured-communities.component.html',
  styleUrls: ['./homepage-featured-communities.component.scss'],
  standalone: false,
})
export class HomepageFeaturedCommunitiesComponent implements OnInit {
  featuredCommunities: IFeaturedItems[] = [];

  environment = environment;

  constructor(private featuredItemsService: FeaturedItemsService) {}

  ngOnInit(): void {
    this.getFeaturedCommunities();
  }

  getFeaturedCommunities(): void {
    this.featuredItemsService.getFeaturedItems('Kommunity').subscribe((data) => {
      this.featuredCommunities = this.featuredCommunities
        .concat(data.page.reduce((acc, value) => [...acc, value.data], []))
        .slice(0, 4);
    });
  }
}
