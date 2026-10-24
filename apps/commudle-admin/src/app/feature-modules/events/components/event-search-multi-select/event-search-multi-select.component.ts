import { Component, ElementRef, forwardRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { EventsService, IEventFilterOption } from 'apps/commudle-admin/src/app/services/events.service';
import { Subject, merge, of } from 'rxjs';
import { catchError, debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators';

// slug -> option for events picked so far. Only used for chip labels: the dialog is destroyed and recreated
// while a value is still applied, and a new search may no longer list a selected event.
const knownEvents = new Map<string, IEventFilterOption>();

@Component({
  selector: 'app-event-search-multi-select',
  templateUrl: './event-search-multi-select.component.html',
  styleUrls: ['./event-search-multi-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EventSearchMultiSelectComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class EventSearchMultiSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  // used only for the backend permission check, results are platform-wide
  @Input() communityId: string;
  @Input() placeholder = 'Search events';

  readonly pageSize = 10;
  icons = { faXmark, faCheck };

  query = '';
  results: IEventFilterOption[] = [];
  total = 0;
  page = 1;
  isOpen = false;
  isLoading = false;
  isLoadingMore = false;
  hasError = false;
  disabled = false;

  selectedSlugs: string[] = [];

  // typing is debounced; opening the dropdown and retrying fetch immediately
  private typing$ = new Subject<string>();
  private immediate$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private onChange: (value: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private eventsService: EventsService, private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit() {
    merge(this.typing$.pipe(debounceTime(300)), this.immediate$)
      .pipe(
        tap(() => {
          this.isLoading = true;
          this.hasError = false;
          this.page = 1;
        }),
        switchMap((query) =>
          this.eventsService.searchForFilters(this.communityId, query, 1, this.pageSize).pipe(
            catchError(() => {
              this.hasError = true;
              return of(null);
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        this.isLoading = false;
        this.results = data ? data.values : [];
        this.total = data ? data.total : 0;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  writeValue(slugs: string[] | null): void {
    const value = Array.isArray(slugs) ? slugs : [];
    this.selectedSlugs = [...value];
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  open() {
    if (this.disabled || this.isOpen) return;
    this.isOpen = true;
    // always refetch on open: the list is only cached for as long as the dropdown stays open
    this.immediate$.next(this.query.trim());
  }

  close() {
    this.isOpen = false;
    this.results = [];
    this.total = 0;
    this.query = '';
    this.hasError = false;
    this.isLoading = false;
    this.onTouched();
  }

  onQueryInput(value: string) {
    this.query = value;
    this.typing$.next(value.trim());
  }

  retry() {
    this.immediate$.next(this.query.trim());
  }

  get hasMore(): boolean {
    return this.results.length < this.total;
  }

  loadMore() {
    if (this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;
    const nextPage = this.page + 1;
    this.eventsService
      .searchForFilters(this.communityId, this.query.trim(), nextPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.page = nextPage;
          this.total = data.total;
          const known = new Set(this.results.map((e) => e.slug));
          this.results = [...this.results, ...data.values.filter((e) => !known.has(e.slug))];
          this.isLoadingMore = false;
        },
        error: () => {
          this.isLoadingMore = false;
          this.hasError = true;
        },
      });
  }

  onResultsScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) this.loadMore();
  }

  isSelected(event: IEventFilterOption): boolean {
    return this.selectedSlugs.includes(event.slug);
  }

  toggle(event: IEventFilterOption) {
    if (this.isSelected(event)) {
      this.remove(event.slug);
      return;
    }
    knownEvents.set(event.slug, event);
    this.selectedSlugs = [...this.selectedSlugs, event.slug];
    this.onChange(this.selectedSlugs);
  }

  remove(slug: string) {
    this.selectedSlugs = this.selectedSlugs.filter((s) => s !== slug);
    this.onChange(this.selectedSlugs);
    this.onTouched();
  }

  chipLabel(slug: string): string {
    const event = knownEvents.get(slug);
    return event ? `${event.name} - ${event.kommunity.name}` : slug;
  }
}
