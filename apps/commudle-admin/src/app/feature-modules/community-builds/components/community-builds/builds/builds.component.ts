import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunityBuildsService } from 'apps/commudle-admin/src/app/services/community-builds.service';
import { ICommunityBuild } from 'apps/shared-models/community-build.model';
import { IPageInfo } from 'apps/shared-models/page-info.model';
import { IPagination } from 'apps/shared-models/pagination.model';
import { Output, EventEmitter } from '@angular/core';
import { SeoService } from '@commudle/shared-services';

@Component({
  selector: 'commudle-builds',
  templateUrl: './builds.component.html',
  styleUrls: ['./builds.component.scss'],
  standalone: false,
})
export class BuildsComponent implements OnInit {
  communityBuilds: ICommunityBuild[] = [];
  timePeriod: string;
  month = false;
  year = false;
  allTime = false;
  order_by: string;
  queryParams = {};
  page_info: IPageInfo;
  loading = false;
  total: number;
  isAllFilterSelected = false;
  limit = 5;
  skeletonLoaderCard = true;
  loadingCommunityBuilds = false;
  heading = 'Builds by techies around you';
  selectedTags = [];
  isCampaignMode = false;
  schemaForBuild = [];

  @Output() seoMetadataChange = new EventEmitter<object>();
  @Output() totalSubmissionsChange = new EventEmitter<number>();

  constructor(
    private communityBuildsService: CommunityBuildsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private seoService: SeoService,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.isCampaignMode = !!params['campaign'];
      if (Object.keys(params).length > 0) {
        if (params['month']) {
          this.timePeriod = 'month';
          this.month = true;
          this.year = false;
          this.allTime = false;
          this.isAllFilterSelected = false;
          this.order_by = 'votes_count';
        }
        if (params['year']) {
          this.timePeriod = 'year';
          this.month = false;
          this.year = true;
          this.allTime = false;
          this.isAllFilterSelected = false;
          this.order_by = 'votes_count';
        }
        if (params['all-time']) {
          this.timePeriod = 'all-time';
          this.month = false;
          this.year = false;
          this.allTime = true;
          this.isAllFilterSelected = false;
          this.order_by = 'votes_count';
        }
        if (params['tags[]'] && !params['campaign'] && !params['month'] && !params['year'] && !params['all-time']) {
          this.isAllFilterSelected = true;
          this.month = false;
          this.year = false;
          this.allTime = false;
          this.timePeriod = null;
          this.order_by = '';
        }
        if (params['campaign'] && !params['all-time'] && !params['month'] && !params['year']) {
          this.isAllFilterSelected = true;
          this.month = false;
          this.year = false;
          this.allTime = false;
          this.timePeriod = null;
          this.order_by = '';
        }
        if (params['campaign'] && params['all-time']) {
          this.isAllFilterSelected = false;
          this.month = false;
          this.year = false;
          this.allTime = true;
        }
        this.communityBuilds = [];
        this.getCommunityBuilds();
      } else {
        this.communityBuilds = [];
        this.isAllFilterSelected = true;
        this.timePeriod = null;
        this.month = false;
        this.year = false;
        this.allTime = false;
        this.order_by = '';
        this.getCommunityBuilds();
      }
      this.setMeta();
    });
  }

  setMeta() {
    let tags = '';
    const tagsTitleandDesc = {
      title: '',
      desc: '',
    };
    if (this.selectedTags.length > 0) {
      tags = this.selectedTags.join(', ');
      tagsTitleandDesc.title = 'Projects in ' + tags;
      tagsTitleandDesc.desc =
        'Find ' +
        tags +
        ' projects built by techies in the developer communities around you. Share your own open source projects in Web, Android, iOS, AI, ML and inspire others';
    }
    this.seoMetadataChange.emit(tagsTitleandDesc);
  }

  filter() {
    this.isAllFilterSelected = false;
    const currentParams = { ...this.activatedRoute.snapshot.queryParams };
    delete currentParams['month'];
    delete currentParams['year'];
    delete currentParams['all-time'];
    if (this.timePeriod === 'month') {
      this.month = true;
      this.year = false;
      this.allTime = false;
      this.order_by = 'votes_count';
      this.queryParams = {
        ...currentParams,
        month: true,
      };
    }
    if (this.timePeriod === 'year') {
      this.month = false;
      this.year = true;
      this.allTime = false;
      this.order_by = 'votes_count';
      this.queryParams = {
        ...currentParams,
        year: true,
      };
    }
    if (this.timePeriod === 'all-time') {
      this.month = false;
      this.year = false;
      this.allTime = true;
      this.order_by = 'votes_count';
      this.queryParams = {
        ...currentParams,
        'all-time': true,
      };
    }
    this.communityBuilds = [];
    this.page_info = null;
    this.router.navigate([], { queryParams: this.queryParams });
  }

  allFilterSelected() {
    this.isAllFilterSelected = true;
    this.month = false;
    this.year = false;
    this.allTime = false;
    this.order_by = '';
    this.timePeriod = null;
    this.communityBuilds = [];
    this.queryParams = { ...this.activatedRoute.snapshot.queryParams };
    delete this.queryParams['month'];
    delete this.queryParams['year'];
    delete this.queryParams['all-time'];
    this.page_info = null;
    this.router.navigate([], { queryParams: this.queryParams });
  }

  clearCampaignFilters() {
    this.page_info = null;
    this.queryParams = { ...this.activatedRoute.snapshot.queryParams };
    delete this.queryParams['month'];
    delete this.queryParams['year'];
    delete this.queryParams['all-time'];
    this.router.navigate([], { queryParams: this.queryParams });
  }

  private toArray(value: string | string[] | null | undefined): string[] {
    if (!value) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  getCommunityBuilds() {
    if (this.loadingCommunityBuilds) {
      return;
    }
    this.loadingCommunityBuilds = true;
    this.loading = true;
    if (!this.page_info?.end_cursor) {
      this.communityBuilds = [];
    }
    const { queryParams } = this.activatedRoute.snapshot;
    this.selectedTags = [
      ...new Set([...this.toArray(queryParams['tags[]']), ...this.toArray(queryParams['campaign'])]),
    ];
    this.communityBuildsService
      .pGetAll(
        this.page_info?.end_cursor,
        this.limit,
        this.order_by,
        this.month,
        this.year,
        this.allTime,
        this.selectedTags,
      )
      .subscribe((data: IPagination<ICommunityBuild>) => {
        this.communityBuilds = this.communityBuilds.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
        this.total = data.total;
        this.totalSubmissionsChange.emit(this.total);
        this.page_info = data.page_info;
        this.loadingCommunityBuilds = false;
        this.skeletonLoaderCard = false;
        this.loading = false;
        this.setSchema();
      });
  }

  setSchema() {
    for (const build of this.communityBuilds) {
      this.schemaForBuild.push({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: build.name,
        description: build.description,
        datePublished: build.created_at,
        screenshot: build.images?.length > 0 ? build.images[0].url : '',
        offers: {
          '@type': 'Offer',
          price: 0,
        },
        applicationCategory: 'Software Engineering',
      });
    }
    this.seoService.setSchema(this.schemaForBuild);
  }
}
