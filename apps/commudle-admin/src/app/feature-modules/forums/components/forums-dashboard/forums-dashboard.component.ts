import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { EDbModels } from '@commudle/shared-models';
import { ForumsStore } from '@commudle/shared-services';

interface ParentInfo {
  parent_id: string;
  parent_type: EDbModels;
}

@Component({
  standalone: false,
  selector: 'commudle-forums-dashboard',
  templateUrl: './forums-dashboard.component.html',
  styleUrls: ['./forums-dashboard.component.scss'],
})
export class ForumsDashboardComponent implements OnInit {
  categories$ = this.forumStore.categories$;
  isLoadingCategories = true;
  readonly sidebarLimit = 7;

  private readonly isBrowser: boolean;

  constructor(private forumStore: ForumsStore, @Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    const parentInfo = this.getParentFromUrl();
    if (parentInfo) {
      this.forumStore.setParentContext(parentInfo.parent_id, parentInfo.parent_type);
      this.forumStore.loadCategories(parentInfo.parent_id, parentInfo.parent_type);
    }

    this.categories$.subscribe(() => {
      this.isLoadingCategories = false;
    });
  }

  private getParentFromUrl(): ParentInfo | null {
    if (!this.isBrowser) return null;

    const url = window.location.pathname;

    const communityMatch = url.match(/\/(admin\/)?communities\/([^/]+)\/forums/);
    if (communityMatch) {
      return { parent_id: communityMatch[2], parent_type: EDbModels.KOMMUNITY };
    }

    const orgMatch = url.match(/\/(admin\/)?orgs\/([^/]+)\/forums/);
    if (orgMatch) {
      return { parent_id: orgMatch[2], parent_type: EDbModels.COMMUNITY_GROUP };
    }

    return null;
  }
}
