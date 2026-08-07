import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EDbModels, IChannelCategory, ICommunity, ICommunityGroup, IForum } from '@commudle/shared-models';
import { ForumsStore } from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import { ForumFormComponent } from 'apps/commudle-admin/src/app/feature-modules/forums/components/forum-form/forum-form.component';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { CommunityGroupsService } from 'apps/commudle-admin/src/app/services/community-groups.service';

@Component({
  standalone: false,
  selector: 'commudle-forums-categories',
  templateUrl: './forums-categories.component.html',
  styleUrls: ['./forums-categories.component.scss'],
})
export class ForumsCategoriesComponent implements OnInit, OnDestroy {
  // Observables consumed in the template
  readonly forums$ = this.forumsStore.forums$;
  readonly isLoadingForums$ = this.forumsStore.isLoadingForums$;
  readonly isLoadingCategories$ = this.forumsStore.isLoadingCategories$;

  // Plain values — needed in event handlers and non-nullable input bindings
  categories: IChannelCategory[] = [];
  selectedCategory: string | null = null;
  searchQuery = '';
  isAdmin = false;
  totalForums = 0;
  currentPage = 1;
  perPage = 15;

  private parentId: string;
  private parentType: EDbModels;
  private destroy$ = new Subject<void>();

  constructor(
    private readonly forumsStore: ForumsStore,
    private readonly dialogService: NbDialogService,
    private readonly communitiesService: CommunitiesService,
    private readonly communityGroupsService: CommunityGroupsService,
  ) {}

  ngOnInit(): void {
    this.forumsStore.parentId$.pipe(takeUntil(this.destroy$)).subscribe((id) => (this.parentId = id));
    this.forumsStore.parentType$.pipe(takeUntil(this.destroy$)).subscribe((t) => (this.parentType = t));
    this.forumsStore.categories$.pipe(takeUntil(this.destroy$)).subscribe((c) => (this.categories = c || []));
    this.forumsStore.selectedCategory$.pipe(takeUntil(this.destroy$)).subscribe((s) => (this.selectedCategory = s));
    this.forumsStore.totalForums$.pipe(takeUntil(this.destroy$)).subscribe((t) => (this.totalForums = t));
    this.forumsStore.currentPage$.pipe(takeUntil(this.destroy$)).subscribe((p) => (this.currentPage = p));
    this.forumsStore.perPage$.pipe(takeUntil(this.destroy$)).subscribe((p) => (this.perPage = p));

    // Long-lived so it picks up managed-communities once the global sidebar loads them
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  openCreateDialog(): void {
    this.dialogService.open(ForumFormComponent, {
      context: {
        isAdmin: this.isAdmin,
        existingCategories: this.categories,
      },
    });
  }

  trackById(_: number, forum: IForum): number {
    return forum.id;
  }
}
