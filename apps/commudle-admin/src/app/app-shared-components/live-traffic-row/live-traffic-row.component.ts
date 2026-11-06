import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faFileLines } from '@fortawesome/free-solid-svg-icons';
import * as moment from 'moment';
import { Observable, Subscription, interval } from 'rxjs';
import { CommudleTooltipModule } from '@commudle/commudle-theme';
import {
  EDashboardTopPagesWindow,
  IDashboardLiveVisitors,
  IDashboardLiveVisitorsBucket,
  IDashboardTopPage,
  IPaginationCount,
} from '@commudle/shared-models';
import { PaginationCompactComponent } from 'apps/shared-components/pagination-compact/pagination-compact.component';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { DashboardCommunitiesService } from 'apps/commudle-admin/src/app/services/stats/dashboard-communities.service';
import { DashboardCommunityGroupsService } from 'apps/commudle-admin/src/app/services/stats/dashboard-community-groups.service';
import { DashboardEventsService } from 'apps/commudle-admin/src/app/services/stats/dashboard-events.service';
import { DashboardHackathonsService } from 'apps/commudle-admin/src/app/services/stats/dashboard-hackathons.service';

export type ELiveTrafficRowEntityType = 'event' | 'hackathon' | 'community' | 'community-group';

// Shared by the event/hackathon/community/community-group admin dashboards. Each
// dashboard's own SCSS used to carry a near-identical ~150-line copy of this card
// pair (plus 4 keyframes), which blew past the anyComponentStyle build budget on
// 3 of the 4 files -- this component exists so that CSS compiles once, not 4x.
@Component({
  selector: 'commudle-live-traffic-row',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, CommudleTooltipModule, SharedComponentsModule, PaginationCompactComponent],
  templateUrl: './live-traffic-row.component.html',
  styleUrls: ['./live-traffic-row.component.scss'],
})
export class LiveTrafficRowComponent implements OnChanges, OnDestroy {
  @Input() entityType: ELiveTrafficRowEntityType;
  @Input() entityId: string | number;

  @ViewChild('liveVisitorsChartCanvas') private liveVisitorsChartCanvas: ElementRef<HTMLCanvasElement>;

  icons = { faEye, faFileLines };

  private subscriptions: Subscription[] = [];

  liveVisitors: IDashboardLiveVisitors;
  private liveVisitorsChart: Chart;

  topPages: IDashboardTopPage[] = [];
  topPagesPage = 1;
  topPagesTotal = 0;
  readonly topPagesCount = 5;
  topPagesLoading = false;
  topPagesWindow: EDashboardTopPagesWindow = 'current';
  private topPagesGlobalMax = 0;

  constructor(
    private ngZone: NgZone,
    private dashboardEventsService: DashboardEventsService,
    private dashboardHackathonsService: DashboardHackathonsService,
    private dashboardCommunitiesService: DashboardCommunitiesService,
    private dashboardCommunityGroupsService: DashboardCommunityGroupsService,
  ) {}

  // entityId is only ever set once per dashboard instance (the host page doesn't
  // render this component until its entity has loaded), so the first change is
  // the single signal to kick off loading + polling -- mirrors each dashboard's
  // previous ngOnInit-triggered single-shot load.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entityId?.isFirstChange() && this.entityId != null) {
      this.loadLiveVisitors();
      this.startLiveVisitorsPolling();
      this.loadTopPages();
      this.startTopPagesPolling();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.liveVisitorsChart?.destroy();
  }

  private liveVisitors$(): Observable<IDashboardLiveVisitors> {
    switch (this.entityType) {
      case 'event':
        return this.dashboardEventsService.liveVisitors(this.entityId);
      case 'hackathon':
        return this.dashboardHackathonsService.liveVisitors(this.entityId);
      case 'community':
        return this.dashboardCommunitiesService.liveVisitors(this.entityId);
      case 'community-group':
        return this.dashboardCommunityGroupsService.liveVisitors(this.entityId);
    }
  }

  private topPages$(page: number): Observable<IPaginationCount<IDashboardTopPage>> {
    switch (this.entityType) {
      case 'event':
        return this.dashboardEventsService.topPages(this.entityId, this.topPagesWindow, page, this.topPagesCount);
      case 'hackathon':
        return this.dashboardHackathonsService.topPages(this.entityId, this.topPagesWindow, page, this.topPagesCount);
      case 'community':
        return this.dashboardCommunitiesService.topPages(this.entityId, this.topPagesWindow, page, this.topPagesCount);
      case 'community-group':
        return this.dashboardCommunityGroupsService.topPages(
          this.entityId,
          this.topPagesWindow,
          page,
          this.topPagesCount,
        );
    }
  }

  loadLiveVisitors(): void {
    this.subscriptions.push(
      this.liveVisitors$().subscribe((data) => {
        this.liveVisitors = data;
        this.renderLiveVisitorsChart();
      }),
    );
  }

  // Poll live visitors every 30s, matching the server-side Redis TTL.
  startLiveVisitorsPolling(): void {
    this.subscriptions.push(interval(30000).subscribe(() => this.loadLiveVisitors()));
  }

  onTopPagesWindowChange(window: EDashboardTopPagesWindow): void {
    this.topPagesWindow = window;
    this.topPagesPage = 1;
    this.topPagesGlobalMax = 0;
    this.loadTopPages();
  }

  loadTopPages(): void {
    this.topPagesLoading = true;
    this.subscriptions.push(
      this.topPages$(this.topPagesPage).subscribe({
        next: (data) => {
          this.topPages = data.values;
          this.topPagesTotal = data.total;
          if (this.topPagesPage === 1) {
            this.topPagesGlobalMax = Math.max(...data.values.map((p) => p.views || 0), 1);
          }
          this.topPagesLoading = false;
        },
        error: () => {
          this.topPagesLoading = false;
        },
      }),
    );
  }

  onTopPagesPageChange(page: number): void {
    this.topPagesPage = page;
    this.loadTopPages();
  }

  // Poll top pages every 30s, matching the server-side Redis TTL for the 'current' window.
  startTopPagesPolling(): void {
    this.subscriptions.push(interval(30000).subscribe(() => this.loadTopPages()));
  }

  /** Largest view count across all top pages (captured from page 1, since results are sorted descending), for proportional bar widths. */
  get topPagesMax(): number {
    return this.topPagesGlobalMax || 1;
  }

  barShare(value: number, max: number): number {
    if (!max) {
      return 0;
    }
    return (value / max) * 100;
  }

  private resampleLiveVisitorsHistory(
    history: IDashboardLiveVisitorsBucket[] | undefined,
    bucketMinutes = 5,
    windowMinutes = 30,
  ): { label: string; count: number }[] {
    if (!history?.length) {
      return [];
    }
    const bucketMs = bucketMinutes * 60000;
    const bucketCount = windowMinutes / bucketMinutes;
    const windowStart = new Date(history[history.length - 1].bucket_end).getTime() - bucketCount * bucketMs;

    const sums = new Array(bucketCount).fill(0);
    const hits = new Array(bucketCount).fill(0);

    history.forEach(({ bucket_start, bucket_end, count }) => {
      const midpoint = (new Date(bucket_start).getTime() + new Date(bucket_end).getTime()) / 2;
      const i = Math.floor((midpoint - windowStart) / bucketMs);
      if (i >= 0 && i < bucketCount) {
        sums[i] += count;
        hits[i] += 1;
      }
    });

    return sums.map((sum, i) => ({
      label: moment(windowStart + (i + 1) * bucketMs).format('h:mm a'),
      count: hits[i] ? Math.round(sum / hits[i]) : 0,
    }));
  }

  private renderLiveVisitorsChart(): void {
    const points = this.resampleLiveVisitorsHistory(this.liveVisitors?.history);
    if (!points.length) {
      return;
    }
    const labels = points.map((p) => p.label);
    const data = points.map((p) => p.count);

    this.ngZone.runOutsideAngular(() => {
      if (this.liveVisitorsChart) {
        this.liveVisitorsChart.data.labels = labels;
        this.liveVisitorsChart.data.datasets[0].data = data;
        this.liveVisitorsChart.update({ duration: 0 });
        return;
      }

      if (!this.liveVisitorsChartCanvas) {
        return;
      }

      this.liveVisitorsChart = new Chart(this.liveVisitorsChartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Live Visitors',
              data,
              borderColor: '#3366ff',
              backgroundColor: 'rgba(51, 102, 255, 0.08)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBorderWidth: 2,
              pointHoverBackgroundColor: '#ffffff',
              pointHoverBorderColor: '#3366ff',
              lineTension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 4000, easing: 'easeOutQuart' },
          responsiveAnimationDuration: 0,
          legend: { display: false },
          scales: {
            xAxes: [{ gridLines: { display: false } }],
            yAxes: [
              {
                ticks: { beginAtZero: true, precision: 0 },
                gridLines: { color: '#f1f1f1', drawBorder: false },
              },
            ],
          },
          tooltips: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (tooltipItem) => `${tooltipItem.yLabel} visitor${tooltipItem.yLabel === '1' ? '' : 's'}`,
            },
          },
        },
      });
    });
  }
}
