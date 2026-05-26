import { Component, OnDestroy, OnInit } from '@angular/core';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { FeaturedItemsService } from 'apps/commudle-admin/src/app/services/featured-items.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { IFeaturedItems } from 'apps/shared-models/featured-items.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'commudle-communities-featured',
  templateUrl: './communities-featured.component.html',
  styleUrls: ['./communities-featured.component.scss'],
  standalone: false,
})
export class CommunitiesFeaturedComponent implements OnInit, OnDestroy {
  faUsers = faUsers;
  faCalendar = faCalendar;
  featuredItems: IFeaturedItems[] = [];
  environment = environment;
  tags: string[] = [];
  skeletonLoaderCard = true;

  subscription: Subscription;

  constructor(private featuredItemsService: FeaturedItemsService) {}

  ngOnInit(): void {
    this.getFeaturedCommunities();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getFeaturedCommunities(): void {
    this.subscription = this.featuredItemsService.getFeaturedItems('Kommunity').subscribe((data) => {
      this.featuredItems = this.featuredItems.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
      this.skeletonLoaderCard = false;
    });
  }

  getTagNames(community) {
    this.tags = community.tags.map((tag) => tag.name);
    return this.tags;
  }
}
