import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { EForumSort, IChannelCategory, IForum } from '@commudle/shared-models';
import { ForumsStore, SeoService } from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import { ForumFormComponent } from 'apps/commudle-admin/src/app/feature-modules/forums/components/forum-form/forum-form.component';
import { faClock, faComment, faCommentDots, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
import {
  ForumsContextService,
  IForumParentContext,
} from 'apps/commudle-admin/src/app/feature-modules/forums/services/forums-context.service';

@Component({
  standalone: false,
  selector: 'commudle-forums-categories',
  templateUrl: './forums-categories.component.html',
  styleUrls: ['./forums-categories.component.scss'],
})
export class ForumsCategoriesComponent implements OnInit, OnDestroy {
  readonly icons = {
    faClock,
    faComment,
    faCommentDots,
    faMagnifyingGlass,
    faPlus,
  };

  // Observables consumed in the template
  readonly forums$ = this.forumsStore.forums$;
  readonly isLoadingForums$ = this.forumsStore.isLoadingForums$;
  readonly isLoadingCategories$ = this.forumsStore.isLoadingCategories$;

  // Plain values — needed in event handlers and non-nullable input bindings
  categories: IChannelCategory[] = [];
  selectedCategory: string | null = null;
  searchQuery = '';

  /** Exposed so the template can reference the enum members */
  readonly forumSort = EForumSort;
  sortBy: EForumSort = EForumSort.LATEST;

  isAdmin = false;
  totalForums = 0;
  currentPage = 1;
  perPage = 15;

  private parentContext: IForumParentContext | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private readonly forumsStore: ForumsStore,
    private readonly dialogService: NbDialogService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly seoService: SeoService,
    private readonly forumsContextService: ForumsContextService,
  ) {}

  ngOnInit(): void {
    this.parentContext = this.forumsContextService.resolveParentContext(this.route);
    this.setSeo();

    // This is the unfiltered landing page, so it owns clearing the category filter
    this.forumsStore.setSelectedCategory(null);

    this.forumsStore.categories$.pipe(takeUntil(this.destroy$)).subscribe((c) => (this.categories = c || []));
    this.forumsStore.selectedCategory$.pipe(takeUntil(this.destroy$)).subscribe((s) => (this.selectedCategory = s));
    this.forumsStore.sortBy$.pipe(takeUntil(this.destroy$)).subscribe((sort) => (this.sortBy = sort));
    this.forumsStore.totalForums$.pipe(takeUntil(this.destroy$)).subscribe((t) => (this.totalForums = t));
    this.forumsStore.currentPage$.pipe(takeUntil(this.destroy$)).subscribe((p) => (this.currentPage = p));
    this.forumsStore.perPage$.pipe(takeUntil(this.destroy$)).subscribe((p) => (this.perPage = p));

    // Long-lived: managed-entity lists populate once the global sidebar loads them
    this.forumsContextService
      .isAdmin$(this.parentContext)
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAdmin) => (this.isAdmin = isAdmin));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setSeo(): void {
    const parentName = this.parentContext?.name || 'Commudle';
    this.seoService.setTags(
      `Forums | ${parentName}`,
      `Browse discussion forums and topics from the ${parentName} community`,
      this.parentContext?.imageUrl,
    );

    if (this.parentContext?.isAdminRoute) {
      this.seoService.noIndex(true);
    }
  }

  // ── Search, filter, pagination — all delegated to the store (server-side) ──

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.forumsStore.setSearchQuery(value);
  }

  onCategorySelect(slug: string | null): void {
    this.forumsStore.setSelectedCategory(slug);
  }

  onPageChange(page: number): void {
    this.forumsStore.setPage(page);
  }

  onSortChange(sort: EForumSort): void {
    if (sort === this.sortBy) return;
    this.forumsStore.setSortBy(sort);
  }

  openCreateDialog(): void {
    this.dialogService
      .open(ForumFormComponent, {
        context: {
          isAdmin: this.isAdmin,
          existingCategories: this.categories,
        },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((forum?: IForum) => this.openCreatedForum(forum));
  }

  /**
   * Land on the forum that was just created so the user can post in it immediately.
   * Resolves nothing when the dialog was dismissed, since onClose also fires then.
   */
  private openCreatedForum(forum?: IForum): void {
    const categorySlug = forum?.channel_category?.slug;
    if (!forum?.slug || !categorySlug) return;

    // Same shape as the forum rows on this page: :category_slug/:topic_slug.
    // Tagged like those rows so the new forum's back button returns here.
    this.router.navigate([categorySlug, forum.slug], {
      relativeTo: this.route,
      state: { fromAllForums: true },
    });
  }

  trackById(_: number, forum: IForum): number {
    return forum.id;
  }
}
