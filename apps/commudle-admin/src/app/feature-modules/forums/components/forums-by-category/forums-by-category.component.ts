import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IForum, IChannelCategory } from '@commudle/shared-models';
import { ForumService, ForumsStore, SeoService, ToastrService } from '@commudle/shared-services';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { ForumFormComponent } from 'apps/commudle-admin/src/app/feature-modules/forums/components/forum-form/forum-form.component';
import {
  faChevronLeft,
  faComment,
  faCommentDots,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faReply,
  faTrash,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  ForumsContextService,
  IForumParentContext,
} from 'apps/commudle-admin/src/app/feature-modules/forums/services/forums-context.service';

@Component({
  standalone: false,
  selector: 'commudle-forums-by-category',
  templateUrl: './forums-by-category.component.html',
  styleUrls: ['./forums-by-category.component.scss'],
})
export class ForumsByCategoryComponent implements OnInit, OnDestroy {
  readonly icons = {
    faChevronLeft,
    faComment,
    faCommentDots,
    faMagnifyingGlass,
    faPen,
    faPlus,
    faReply,
    faTrash,
    faTriangleExclamation,
    faXmark,
  };

  @ViewChild('deleteDialog') deleteDialogTemplate: TemplateRef<unknown>;

  readonly forums$ = this.forumsStore.forums$;
  readonly isLoadingForums$ = this.forumsStore.isLoadingForums$;

  forumCategory: IChannelCategory;
  allCategories: IChannelCategory[] = [];
  searchQuery = '';
  isAdmin = false;
  isDeletingForum = false;
  forumToDelete: IForum | null = null;
  totalForums = 0;
  currentPage = 1;
  perPage = 15;

  private parentContext: IForumParentContext | null = null;
  private categorySlug: string;
  private deleteDialogRef: NbDialogRef<unknown>;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly forumsStore: ForumsStore,
    private readonly forumService: ForumService,
    private readonly dialogService: NbDialogService,
    private readonly router: Router,
    private readonly toastrService: ToastrService,
    private readonly seoService: SeoService,
    private readonly forumsContextService: ForumsContextService,
  ) {}

  ngOnInit(): void {
    this.parentContext = this.forumsContextService.resolveParentContext(this.route);

    this.forumsStore.categories$.pipe(takeUntil(this.destroy$)).subscribe((c) => (this.allCategories = c || []));
    this.forumsStore.totalForums$.pipe(takeUntil(this.destroy$)).subscribe((t) => (this.totalForums = t));
    this.forumsStore.currentPage$.pipe(takeUntil(this.destroy$)).subscribe((p) => (this.currentPage = p));
    this.forumsStore.perPage$.pipe(takeUntil(this.destroy$)).subscribe((p) => (this.perPage = p));

    // Route param drives the store's category filter — list reloads from backend
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.categorySlug = params['category_slug'];
      this.forumsStore.setSelectedCategory(this.categorySlug);
      this.setSeo();
      this.loadCategoryDetails();
    });

    // Long-lived: managed-entity lists populate once the global sidebar loads them
    this.forumsContextService
      .isAdmin$(this.parentContext)
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAdmin) => (this.isAdmin = isAdmin));
  }

  ngOnDestroy(): void {
    // The landing page clears the category filter itself, so nothing to reset here
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategoryDetails(): void {
    this.forumService
      .showCategory(this.categorySlug)
      .pipe(takeUntil(this.destroy$))
      .subscribe((cat) => {
        this.forumCategory = cat;
        // Re-run once the readable category name is known
        this.setSeo();
      });
  }

  private setSeo(): void {
    const parentName = this.parentContext?.name || 'Commudle';
    const categoryName = this.forumCategory?.name || this.categorySlug;

    this.seoService.setTags(
      `${categoryName} Forums | ${parentName}`,
      `Browse forums and discussions in ${categoryName} from the ${parentName} community`,
      this.parentContext?.imageUrl,
    );

    if (this.parentContext?.isAdminRoute) {
      this.seoService.noIndex(true);
    }
  }

  // ── Search & pagination — delegated to store ───────────────────────────────

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.forumsStore.setSearchQuery(value);
  }

  onPageChange(page: number): void {
    this.forumsStore.setPage(page);
  }

  backButton(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  // ── Create / Edit ─────────────────────────────────────────────────────────

  openCreateDialog(): void {
    this.dialogService
      .open(ForumFormComponent, {
        context: {
          categoryName: this.forumCategory?.name,
          isAdmin: this.isAdmin,
          existingCategories: this.allCategories,
        },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((forum?: IForum) => this.openCreatedForum(forum));
  }

  /**
   * Land on the forum that was just created. Routed from the forums root rather
   * than relative to this page, because the form allows any category name and the
   * new forum may not belong to the category currently being viewed.
   */
  private openCreatedForum(forum?: IForum): void {
    const categorySlug = forum?.channel_category?.slug;
    if (!forum?.slug || !categorySlug) return;

    this.router.navigate(['../', categorySlug, forum.slug], { relativeTo: this.route });
  }

  editForum(forum: IForum): void {
    this.dialogService.open(ForumFormComponent, {
      context: {
        forumId: forum.id,
        categoryName: forum.channel_category?.name || this.forumCategory?.name,
        isAdmin: this.isAdmin,
        existingCategories: this.allCategories,
      },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  confirmDeleteForum(forum: IForum): void {
    this.forumToDelete = forum;
    this.deleteDialogRef = this.dialogService.open(this.deleteDialogTemplate);
  }

  deleteForum(): void {
    if (!this.forumToDelete) return;
    this.isDeletingForum = true;
    this.forumsStore
      .deleteForum(this.forumToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeletingForum = false;
          this.forumToDelete = null;
          this.deleteDialogRef?.close();
        },
        error: () => {
          this.toastrService.errorDialog('Failed to delete forum');
          this.isDeletingForum = false;
          this.deleteDialogRef?.close();
        },
      });
  }

  cancelDelete(): void {
    this.forumToDelete = null;
    this.deleteDialogRef?.close();
  }

  trackById(_: number, forum: IForum): number {
    return forum.id;
  }
}
