import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, switchMap, tap } from 'rxjs/operators';
import { IForum, IPaginationCount, EDbModels, IChannelCategory, IUserMessage } from '@commudle/shared-models';
import { ForumService } from './forum.service';
import { ToastrService } from './toastr.service';
import { DiscussionService } from './discussion.service';
import { UserMessagesService } from './user-messages.service';

@Injectable({
  providedIn: 'root',
})
export class ForumsStore {
  // ── Parent context ──────────────────────────────────────────────────────────
  private readonly parentId = new BehaviorSubject<string | null>(null);
  readonly parentId$ = this.parentId.asObservable();

  private readonly parentType = new BehaviorSubject<EDbModels | null>(null);
  readonly parentType$ = this.parentType.asObservable();

  // ── Categories ──────────────────────────────────────────────────────────────
  private readonly categories = new BehaviorSubject<IChannelCategory[]>([]);
  readonly categories$ = this.categories.asObservable();

  private readonly isLoadingCategories = new BehaviorSubject<boolean>(true);
  readonly isLoadingCategories$ = this.isLoadingCategories.asObservable();

  // ── Forum list ──────────────────────────────────────────────────────────────
  private readonly forums = new BehaviorSubject<IForum[]>([]);
  readonly forums$ = this.forums.asObservable();

  private readonly isLoadingForums = new BehaviorSubject<boolean>(true);
  readonly isLoadingForums$ = this.isLoadingForums.asObservable();

  private readonly totalForums = new BehaviorSubject<number>(0);
  readonly totalForums$ = this.totalForums.asObservable();

  private readonly currentPage = new BehaviorSubject<number>(1);
  readonly currentPage$ = this.currentPage.asObservable();

  private readonly perPage = new BehaviorSubject<number>(15);
  readonly perPage$ = this.perPage.asObservable();

  // ── Search & filter (drive backend queries) ─────────────────────────────────
  private readonly searchQuery = new BehaviorSubject<string>('');
  readonly searchQuery$ = this.searchQuery.asObservable();

  private readonly selectedCategory = new BehaviorSubject<string | null>(null);
  readonly selectedCategory$ = this.selectedCategory.asObservable();

  /** Emits whenever any query input changes so the list reloads from the server */
  private readonly queryTrigger = new Subject<void>();

  // ── Discussion (thread list inside a forum) ─────────────────────────────────
  private readonly userMessages = new BehaviorSubject<IUserMessage[]>([]);
  readonly userMessages$ = this.userMessages.asObservable();

  private readonly isLoading = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.isLoading.asObservable();

  private readonly hasNextPage = new BehaviorSubject<boolean>(false);
  readonly hasNextPage$ = this.hasNextPage.asObservable();

  private readonly currentUserMessage = new BehaviorSubject<IUserMessage | null>(null);
  readonly currentUserMessage$ = this.currentUserMessage.asObservable();

  private readonly isLoadingUserMessage = new BehaviorSubject<boolean>(false);
  readonly isLoadingUserMessage$ = this.isLoadingUserMessage.asObservable();

  private discussionPage = 1;

  constructor(
    private readonly forumService: ForumService,
    private readonly toastrService: ToastrService,
    private readonly discussionService: DiscussionService,
    private readonly userMessagesService: UserMessagesService,
  ) {
    this.wireSearchPipeline();
  }

  // ── Search pipeline: debounced, server-driven ──────────────────────────────

  private wireSearchPipeline(): void {
    combineLatest([
      this.searchQuery.pipe(debounceTime(350), distinctUntilChanged()),
      this.selectedCategory.pipe(distinctUntilChanged()),
      this.currentPage.pipe(distinctUntilChanged()),
    ])
      .pipe(
        tap(() => this.isLoadingForums.next(true)),
        switchMap(([q, categorySlug, page]) =>
          this.forumService.getForums({
            parentId: this.parentId.value,
            parentType: this.parentType.value,
            q,
            categorySlug,
            page,
            count: this.perPage.value,
          }),
        ),
      )
      .subscribe({
        next: (res: IPaginationCount<IForum>) => {
          this.forums.next(res.values || []);
          this.totalForums.next(res.total || 0);
          this.isLoadingForums.next(false);
        },
        error: () => {
          this.isLoadingForums.next(false);
          this.toastrService.errorDialog('Failed to load forums');
        },
      });
  }

  // ── Parent context ─────────────────────────────────────────────────────────

  setParentContext(parentId: string, parentType: EDbModels): void {
    this.parentId.next(parentId);
    this.parentType.next(parentType);
    this.loadCategories();
    this.reloadForums();
  }

  getParentId(): string {
    return this.parentId.value;
  }

  getParentType(): EDbModels {
    return this.parentType.value;
  }

  // ── Search & filter setters (called from components) ───────────────────────

  setSearchQuery(q: string): void {
    this.currentPage.next(1);
    this.searchQuery.next(q ?? '');
  }

  setSelectedCategory(categorySlug: string | null): void {
    this.currentPage.next(1);
    this.selectedCategory.next(categorySlug);
  }

  setPage(page: number): void {
    this.currentPage.next(page);
  }

  setPerPage(count: number): void {
    this.perPage.next(count);
    this.currentPage.next(1);
  }

  /** Force a reload with current query params */
  reloadForums(): void {
    if (!this.parentId.value || !this.parentType.value) return;
    this.isLoadingForums.next(true);
    this.forumService
      .getForums({
        parentId: this.parentId.value,
        parentType: this.parentType.value,
        q: this.searchQuery.value,
        categorySlug: this.selectedCategory.value,
        page: this.currentPage.value,
        count: this.perPage.value,
      })
      .pipe(finalize(() => this.isLoadingForums.next(false)))
      .subscribe({
        next: (res) => {
          this.forums.next(res.values || []);
          this.totalForums.next(res.total || 0);
        },
        error: () => this.toastrService.errorDialog('Failed to load forums'),
      });
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  loadCategories(): void {
    if (!this.parentId.value || !this.parentType.value) return;
    this.isLoadingCategories.next(true);
    this.forumService
      .getForumCategories(this.parentId.value, this.parentType.value)
      .pipe(finalize(() => this.isLoadingCategories.next(false)))
      .subscribe({
        next: (categories) => this.categories.next(categories || []),
        error: () => this.toastrService.errorDialog('Failed to load categories'),
      });
  }

  // ── CRUD — keeps list, total and categories in sync ────────────────────────

  createForum(payload: Partial<IForum>): Observable<IForum> {
    return this.forumService.createForum(payload, this.parentType.value, this.parentId.value).pipe(
      tap((forum) => {
        this.forums.next([forum, ...this.forums.value]);
        this.totalForums.next(this.totalForums.value + 1);
        this.loadCategories(); // refresh category counts
        this.toastrService.successDialog('Forum created successfully');
      }),
    );
  }

  updateForum(payload: Partial<IForum>, forumId: number): Observable<IForum> {
    return this.forumService.updateForum(payload, forumId).pipe(
      tap((forum) => {
        this.forums.next(this.forums.value.map((f) => (f.id === forum.id ? forum : f)));
        this.loadCategories(); // category may have changed
        this.toastrService.successDialog('Forum updated successfully');
      }),
    );
  }

  deleteForum(forumId: number): Observable<boolean> {
    return this.forumService.deleteForum(forumId).pipe(
      tap(() => {
        this.forums.next(this.forums.value.filter((f) => f.id !== forumId));
        this.totalForums.next(Math.max(0, this.totalForums.value - 1));
        this.loadCategories();
        this.toastrService.successDialog('Forum deleted successfully');
      }),
    );
  }

  // ── Discussion (threads within a forum) ────────────────────────────────────

  loadDiscussions(discussionId: number, loadMore = false, count = 10): void {
    if (loadMore && (!this.hasNextPage.value || this.isLoading.value)) return;

    this.discussionPage = loadMore ? this.discussionPage + 1 : 1;
    this.isLoading.next(true);

    this.discussionService
      .getForumsMessages(discussionId, count, this.discussionPage)
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe((data: IPaginationCount<IUserMessage>) => {
        const current = this.userMessages.value;
        this.userMessages.next(loadMore ? [...current, ...data.values] : data.values);
        this.hasNextPage.next(this.discussionPage < Math.ceil(data.total / count));
      });
  }

  loadUserMessage(userMessageSlug: string): void {
    this.isLoadingUserMessage.next(true);
    this.userMessagesService
      .showUserMessage(userMessageSlug)
      .pipe(finalize(() => this.isLoadingUserMessage.next(false)))
      .subscribe({
        next: (userMessage: IUserMessage) => this.currentUserMessage.next(userMessage),
        error: () => {
          this.toastrService.errorDialog('Failed to load message');
          this.currentUserMessage.next(null);
        },
      });
  }

  updateDiscussion(userMessage: IUserMessage): void {
    const current = this.userMessages.value;
    if (
      current.length > 0 &&
      userMessage.parent_type === 'Discussion' &&
      userMessage.parent_id === current[0].parent_id &&
      !current.find((m) => m.id === userMessage.id)
    ) {
      this.userMessages.next([userMessage, ...current]);
    }
  }

  updateUserMessage(userMessageSlug: string, reply: IUserMessage): void {
    const current = this.currentUserMessage.value;
    if (current && current.slug === userMessageSlug) {
      this.currentUserMessage.next({ ...current, user_messages: [...current.user_messages, reply] });
    }
  }

  clearUserMessage(): void {
    this.currentUserMessage.next(null);
    this.isLoadingUserMessage.next(false);
  }

  clearDiscussions(): void {
    this.userMessages.next([]);
    this.hasNextPage.next(false);
    this.discussionPage = 1;
  }

  clearAllData(): void {
    this.parentId.next(null);
    this.parentType.next(null);
    this.categories.next([]);
    this.forums.next([]);
    this.totalForums.next(0);
    this.searchQuery.next('');
    this.selectedCategory.next(null);
    this.currentPage.next(1);
    this.clearDiscussions();
    this.clearUserMessage();
  }
}
