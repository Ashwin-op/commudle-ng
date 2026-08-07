import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IForum, IChannelCategory, EDbModels, ICommunity, ICommunityGroup } from '@commudle/shared-models';
import { ForumService, ForumsStore, ToastrService } from '@commudle/shared-services';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { ForumFormComponent } from 'apps/commudle-admin/src/app/feature-modules/forums/components/forum-form/forum-form.component';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { CommunityGroupsService } from 'apps/commudle-admin/src/app/services/community-groups.service';

@Component({
  standalone: false,
  selector: 'commudle-forums-by-category',
  templateUrl: './forums-by-category.component.html',
  styleUrls: ['./forums-by-category.component.scss'],
})
export class ForumsByCategoryComponent implements OnInit, OnDestroy {
  @ViewChild('deleteDialog') deleteDialogTemplate: TemplateRef<any>;

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

  private parentId: string;
  private parentType: EDbModels;
  private categorySlug: string;
  private deleteDialogRef: NbDialogRef<any>;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly forumsStore: ForumsStore,
    private readonly forumService: ForumService,
    private readonly dialogService: NbDialogService,
    private readonly router: Router,
    private readonly toastrService: ToastrService,
    private readonly communitiesService: CommunitiesService,
    private readonly communityGroupsService: CommunityGroupsService,
  ) {}

  ngOnInit(): void {
    this.forumsStore.parentId$.pipe(takeUntil(this.destroy$)).subscribe((id) => (this.parentId = id));
    this.forumsStore.parentType$.pipe(takeUntil(this.destroy$)).subscribe((t) => (this.parentType = t));
    this.forumsStore.categories$.pipe(takeUntil(this.destroy$)).subscribe((c) => (this.allCategories = c || []));
    this.forumsStore.totalForums$.pipe(takeUntil(this.destroy$)).subscribe((t) => (this.totalForums = t));
    this.forumsStore.currentPage$.pipe(takeUntil(this.destroy$)).subscribe((p) => (this.currentPage = p));
    this.forumsStore.perPage$.pipe(takeUntil(this.destroy$)).subscribe((p) => (this.perPage = p));

    // Route param drives the store's category filter — list reloads from backend
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.categorySlug = params['category_slug'];
      this.forumsStore.setSelectedCategory(this.categorySlug);
      this.loadCategoryDetails();
    });

    this.communitiesService.userManagedCommunities$
      .pipe(takeUntil(this.destroy$))
      .subscribe((communities: ICommunity[]) => {
        if (this.parentType === EDbModels.KOMMUNITY && this.parentId) {
          this.isAdmin = communities.some((c) => c.slug === this.parentId);
        }
      });

    this.communityGroupsService.userManagedCommunityGroups$
      .pipe(takeUntil(this.destroy$))
      .subscribe((groups: ICommunityGroup[]) => {
        if (this.parentType === EDbModels.COMMUNITY_GROUP && this.parentId) {
          this.isAdmin = groups.some((g) => g.slug === this.parentId);
        }
      });
  }

  private loadCategoryDetails(): void {
    this.forumService
      .showCategory(this.categorySlug)
      .pipe(takeUntil(this.destroy$))
      .subscribe((cat) => (this.forumCategory = cat));
  }

  ngOnDestroy(): void {
    // Clear the category filter so the landing page shows everything again
    this.forumsStore.setSelectedCategory(null);
    this.destroy$.next();
    this.destroy$.complete();
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
    this.dialogService.open(ForumFormComponent, {
      context: {
        categoryName: this.forumCategory?.name,
        isAdmin: this.isAdmin,
        existingCategories: this.allCategories,
      },
    });
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
