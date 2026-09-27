import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of, throwError } from 'rxjs';
import { catchError, delay, distinctUntilChanged, filter, finalize, map, switchMap, tap } from 'rxjs/operators';
import {
  IForum,
  IPaginationCount,
  EDbModels,
  EForumSort,
  IChannelCategory,
  IUserMessage,
} from '@commudle/shared-models';
import { ForumService } from './forum.service';
import { ToastrService } from './toastr.service';
import { DiscussionService } from './discussion.service';
import { UserMessagesService } from './user-messages.service';

/** How long to wait after the last keystroke before querying the server */
const SEARCH_DEBOUNCE_MS = 350;

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

  private readonly sortBy = new BehaviorSubject<EForumSort>(EForumSort.LATEST);
  readonly sortBy$ = this.sortBy.asObservable();

  /** Bumped by reloadForums() to re-run the query with the current parameters */
  private readonly refreshTrigger = new BehaviorSubject<number>(0);

  /**
   * Emits each thread that arrives over the websocket. Threads are created by the
   * realtime channel rather than an HTTP call, so this is the only point at which
   * the new record (and its slug) becomes known to the client.
   */
  private readonly discussionAdded = new Subject<IUserMessage>();
  readonly discussionAdded$ = this.discussionAdded.asObservable();

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

  /** The forum currently being viewed, shared so the route resolver can reuse it */
  private readonly currentForum = new BehaviorSubject<IForum | null>(null);
  readonly currentForum$ = this.currentForum.asObservable();

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

  /**
   * The current search term. The initial value passes through immediately so the
   * first page load is not held back by the debounce; later keystrokes are debounced,
   * with switchMap cancelling any emission still waiting.
   */
  private debouncedSearchQuery(): Observable<string> {
    return this.searchQuery.pipe(
      distinctUntilChanged(),
      switchMap((q, index) => (index === 0 ? of(q) : of(q).pipe(delay(SEARCH_DEBOUNCE_MS)))),
    );
  }

  private wireSearchPipeline(): void {
    combineLatest([
      this.parentId.pipe(distinctUntilChanged()),
      this.parentType.pipe(distinctUntilChanged()),
      this.debouncedSearchQuery(),
      this.selectedCategory.pipe(distinctUntilChanged()),
      this.currentPage.pipe(distinctUntilChanged()),
      this.perPage.pipe(distinctUntilChanged()),
      this.sortBy.pipe(distinctUntilChanged()),
      this.refreshTrigger.pipe(distinctUntilChanged()),
    ])
      .pipe(
        // Without a parent there is nothing to fetch. This also stops the store from
        // firing a parent_id=null request as soon as it is constructed.
        filter(([parentId, parentType]) => !!parentId && !!parentType),
        tap(() => this.isLoadingForums.next(true)),
        switchMap(([parentId, parentType, q, categorySlug, page, count, sort]) =>
          this.forumService.getForums({ parentId, parentType, q, categorySlug, page, count, sort }).pipe(
            map((res) => ({ res, failed: false })),
            // Caught inside switchMap so a single failed request cannot terminate the
            // outer subscription and leave search, filtering and pagination dead.
            catchError(() => of({ res: null, failed: true })),
          ),
        ),
      )
      .subscribe(({ res, failed }) => {
        this.isLoadingForums.next(false);
        if (failed || !res) {
          // Keep whatever was on screen rather than blanking the list
          this.toastrService.errorDialog('Failed to load forums');
          return;
        }
        this.forums.next(res.values || []);
        this.totalForums.next(res.total || 0);
      });
  }

  // ── Parent context ─────────────────────────────────────────────────────────

  /**
   * Sets the owner of the forum list. The search pipeline watches the parent, so
   * changing it reloads the list on its own — no explicit reload needed here.
   */
  setParentContext(parentId: string, parentType: EDbModels): void {
    this.parentId.next(parentId);
    this.parentType.next(parentType);
    this.loadCategories();
  }

  getParentId(): string | null {
    return this.parentId.value;
  }

  getParentType(): EDbModels | null {
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

  setSortBy(sort: EForumSort): void {
    this.currentPage.next(1);
    this.sortBy.next(sort);
  }

  /**
   * Force a reload with the current query params. Routed through the same pipeline
   * as every other query so there is only one request path to reason about.
   */
  reloadForums(): void {
    this.refreshTrigger.next(this.refreshTrigger.value + 1);
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  loadCategories(): void {
    const parentId = this.parentId.value;
    const parentType = this.parentType.value;
    if (!parentId || !parentType) return;

    this.isLoadingCategories.next(true);
    this.forumService
      .getForumCategories(parentId, parentType)
      .pipe(finalize(() => this.isLoadingCategories.next(false)))
      .subscribe({
        next: (categories) => this.categories.next(categories || []),
        error: () => this.toastrService.errorDialog('Failed to load categories'),
      });
  }

  // ── CRUD — keeps list, total and categories in sync ────────────────────────

  createForum(payload: Partial<IForum>): Observable<IForum> {
    const parentId = this.parentId.value;
    const parentType = this.parentType.value;

    if (!parentId || !parentType) {
      return throwError(() => new Error('Cannot create a forum before the parent context is set'));
    }

    return this.forumService.createForum(payload, parentType, parentId).pipe(
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
    if (!userMessage || userMessage.parent_type !== 'Discussion') return;

    // Match against the open forum's discussion rather than the first loaded
    // message, so the very first thread in an empty forum still shows up.
    const expectedDiscussionId = this.currentForum.value?.discussion_id ?? this.userMessages.value[0]?.parent_id;
    if (expectedDiscussionId == null) return;

    // The broadcast sends parent_id as a number while REST payloads can send a
    // string, so compare numerically rather than with strict equality.
    if (Number(userMessage.parent_id) !== Number(expectedDiscussionId)) return;

    const current = this.userMessages.value;
    if (current.some((m) => m.id === userMessage.id)) return;

    this.userMessages.next([userMessage, ...current]);
    // A root message is a new thread, so the header counts move too
    this.bumpForumCounts({ discussions: 1 });
    this.discussionAdded.next(userMessage);
  }

  /**
   * Keeps the open forum's header stats in step with realtime activity. The counts
   * arrive with the forum payload and would otherwise stay frozen at whatever they
   * were when the page was resolved.
   */
  private bumpForumCounts(delta: { discussions?: number; replies?: number }): void {
    const forum = this.currentForum.value;
    if (!forum) return;

    const updated: IForum = {
      ...forum,
      total_discussions: Math.max(0, (forum.total_discussions || 0) + (delta.discussions || 0)),
      total_replies: Math.max(0, (forum.total_replies || 0) + (delta.replies || 0)),
    };

    this.currentForum.next(updated);

    // The list rows show the same counts, so keep that copy in step as well
    const forums = this.forums.value;
    if (forums.some((f) => f.id === updated.id)) {
      this.forums.next(forums.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)));
    }
  }

  updateUserMessage(userMessageSlug: string, reply: IUserMessage): void {
    const current = this.currentUserMessage.value;
    const alreadyPresent = !!current?.user_messages?.some((m) => m.id === reply?.id);

    if (current && current.slug === userMessageSlug && !alreadyPresent) {
      this.currentUserMessage.next({ ...current, user_messages: [...current.user_messages, reply] });
    }

    // Counted whether or not that thread is the one on screen, since the reply still
    // belongs to this forum
    if (!alreadyPresent) {
      this.bumpForumCounts({ replies: 1 });
    }
  }

  getCurrentForum(): IForum | null {
    return this.currentForum.value;
  }

  setCurrentForum(forum: IForum | null): void {
    this.currentForum.next(forum);
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
    this.sortBy.next(EForumSort.LATEST);
    this.currentForum.next(null);
    this.clearDiscussions();
    this.clearUserMessage();
  }
}
