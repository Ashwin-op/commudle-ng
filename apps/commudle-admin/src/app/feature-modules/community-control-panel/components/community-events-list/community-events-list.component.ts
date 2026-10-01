import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { faPlus, faArrowUpRightFromSquare, faTableList } from '@fortawesome/free-solid-svg-icons';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { EEventStatuses } from 'apps/shared-models/enums/event_statuses.enum';
import { debounceTime, switchMap, takeUntil, filter, map } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ICommunity, IEvent } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { NbDialogService, NbMenuService } from '@commudle/theme';
import moment from 'moment';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';

@Component({
  selector: 'app-community-events-list',
  templateUrl: './community-events-list.component.html',
  styleUrls: ['./community-events-list.component.scss'],
  standalone: false,
})
export class CommunityEventsListComponent implements OnInit, OnDestroy {
  @ViewChild('cloneEvent') cloneEvent: TemplateRef<any>;
  destroy$ = new Subject<void>();

  community: ICommunity;

  isLoading = true;
  events: IEvent[];
  EEventStatuses = EEventStatuses;
  moment = moment;

  query = '';
  icons = {
    faPlus,
    faArrowUpRightFromSquare,
    faTableList,
  };
  staticAssets = staticAssets;

  total = 0;
  count = 10;
  page = 1;
  isSearchApplied = false;

  eventStatuses = Object.values(EEventStatuses);
  activeEventStatuses: string[] = [EEventStatuses.OPEN, EEventStatuses.DRAFT, EEventStatuses.COMPLETED];

  contextMenuItems = [
    {
      title: 'Clone',
    },
    {
      title: 'Public Page',
    },
    {
      title: 'Stats',
    },
  ];

  activeContextMenuEvent: IEvent;

  searchForm;
  //angular2 smart-table, not being used anymore (kept for reference)

  // tableSettings: Settings = {
  //   actions: false,
  //   pager: {
  //     perPage: 10,
  //   },
  //   columns: {
  //     name: {
  //       title: 'Name',
  //     },
  //     date: {
  //       title: 'Date',
  //       isFilterable: false,
  //       type: 'custom',
  //       renderComponent: CommunityEventsListDateComponent,
  //       componentInitFunction: (instance: CommunityEventsListDateComponent, cell: Cell) => {
  //         const rowData: IEvent = cell.getRow().getData();
  //         instance.rowData = rowData;
  //       },
  //     },
  //     status: {
  //       title: 'Status',
  //       isFilterable: false,
  //     },
  //     actions: {
  //       title: 'Actions',
  //       isFilterable: false,
  //       type: 'custom',
  //       renderComponent: CommunityEventsListActionsComponent,
  //       isSortable: false,
  //       componentInitFunction: (instance: CommunityEventsListActionsComponent, cell: Cell) => {
  //         const rowData: IEvent = cell.getRow().getData();
  //         instance.rowData = rowData;
  //       },
  //     },
  //     public_page: {
  //       title: 'Public Page',
  //       isFilterable: false,
  //       type: 'custom',
  //       renderComponent: CommunityEventsListPublicPageComponent,
  //       isSortable: false,
  //       componentInitFunction: (instance: CommunityEventsListPublicPageComponent, cell: Cell) => {
  //         const rowData: IEvent = cell.getRow().getData();
  //         instance.rowData = rowData;
  //       },
  //     },
  //   },
  //   rowClassFunction: () => 'clickable',
  // };

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private fb: FormBuilder,
    private seoService: SeoService,
    private dialogBoxService: NbDialogService,
    private menuService: NbMenuService,
  ) {
    this.searchForm = this.fb.group({
      name: [''],
    });
  }

  ngOnInit() {
    this.seoService.noIndex(true);
    this.activatedRoute.parent.data.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.community = value.community;
      this.setMeta();
      this.getCommunityEvents();
      this.search();
    });
    this.handleContextMenu();
  }

  getCommunityEvents() {
    this.isLoading = true;

    if (!this.query) {
      this.isSearchApplied = false;
    }

    this.eventsService
      .communityEventsForEmail(this.community.id, this.page, this.count, this.query, this.activeEventStatuses)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.events = data.values;
        this.total = data.total;
        this.page = data.page;
        this.isLoading = false;
      });
  }

  search() {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(800),
        takeUntil(this.destroy$),
        switchMap(() => {
          this.page = 1;
          this.isLoading = true;
          this.query = this.searchForm.get('name').value;

          this.isSearchApplied = !!this.query;
          return this.eventsService.communityEventsForEmail(
            this.community.id,
            this.page,
            this.count,
            this.query,
            this.activeEventStatuses,
          );
        }),
      )
      .subscribe((data) => {
        this.events = data.values;
        this.total = data.total;
        this.page = data.page;
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.seoService.noIndex(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStatusFilterChange(selectedValues: string[]) {
    this.activeEventStatuses = selectedValues;
    this.isLoading = true;
    this.total = 0;
    this.page = 1;
    this.getCommunityEvents();
  }

  filterByTags(status: string) {
    const index = this.activeEventStatuses.indexOf(status);
    if (index > -1) {
      // Remove if the tag is already selected
      this.activeEventStatuses.splice(index, 1);
    } else {
      // Add if the tag is not selected
      this.activeEventStatuses.push(status);
    }
    this.isLoading = true;
    this.total = 0;
    this.page = 1;
    this.getCommunityEvents();
  }

  setMeta() {
    this.seoService.setTitle(`Events | Dashboard | ${this.community.name}`);
  }

  setContextEvent(event: IEvent) {
    this.activeContextMenuEvent = event;
  }

  handleContextMenu(): void {
    this.menuService
      .onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'community-event-context-menu'),
        map(({ item: title }) => title),
        takeUntil(this.destroy$),
      )
      .subscribe((menuItem) => {
        switch (menuItem.title) {
          case 'Clone': {
            this.openCloneEventWindow(this.cloneEvent, this.activeContextMenuEvent);
            break;
          }
          case 'Public Page': {
            this.router.navigate([
              '/communities/',
              this.activeContextMenuEvent.kommunity_id,
              'events',
              this.activeContextMenuEvent.slug,
            ]);
            break;
          }
          case 'Stats': {
            this.router.navigate([
              '/admin/communities/',
              this.activeContextMenuEvent.kommunity_id,
              'event-dashboard',
              this.activeContextMenuEvent.slug,
              'stats',
            ]);
            break;
          }
        }
      });
  }

  openCloneEventWindow(dialogBox, eventData: IEvent) {
    this.dialogBoxService.open(dialogBox, { context: { eventData } });
  }
}
