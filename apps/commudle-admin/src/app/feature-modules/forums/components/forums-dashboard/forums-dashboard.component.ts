import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ForumsStore } from '@commudle/shared-services';
import { ForumsContextService } from 'apps/commudle-admin/src/app/feature-modules/forums/services/forums-context.service';
import { faTableCells } from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: false,
  selector: 'commudle-forums-dashboard',
  templateUrl: './forums-dashboard.component.html',
  styleUrls: ['./forums-dashboard.component.scss'],
})
export class ForumsDashboardComponent implements OnInit, OnDestroy {
  readonly icons = {
    faTableCells,
  };

  readonly categories$ = this.forumStore.categories$;
  readonly isLoadingCategories$ = this.forumStore.isLoadingCategories$;
  readonly sidebarLimit = 7;

  constructor(
    private readonly forumStore: ForumsStore,
    private readonly route: ActivatedRoute,
    private readonly forumsContextService: ForumsContextService,
  ) {}

  ngOnInit(): void {
    // Resolved from the router, so this also runs during server-side rendering
    const context = this.forumsContextService.resolveParentContext(this.route);
    if (context) {
      // The store's query pipeline watches the parent, so this loads the list too
      this.forumStore.setParentContext(context.parentId, context.parentType);
    }
  }

  ngOnDestroy(): void {
    // The store is a root singleton, so it has to be reset or the next community's
    // forums page briefly renders the previous community's data
    this.forumStore.clearAllData();
  }
}
