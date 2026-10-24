import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NbDialogService } from '@commudle/theme';
import { CommudleButtonModule } from '@commudle/commudle-theme';
import { ECertificateBatchStatus, ICertificateBatch, ICommunity } from '@commudle/shared-models';
import { CertificateBatchService, SeoService } from '@commudle/shared-services';
import { faPlus, faAward, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { CertificateBatchCreateDialogComponent } from '../certificate-batch-create-dialog/certificate-batch-create-dialog.component';
import {
  CertificateDeliveryFunnelComponent,
  ICertificateDeliveryFunnelSegment,
} from '../certificate-delivery-funnel/certificate-delivery-funnel.component';
import { openCertificateConfirmDialog } from '../certificate-confirm-dialog/certificate-confirm-dialog.component';

type BatchAction = 'delete';

@Component({
  selector: 'commudle-certificate-batches-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CommudleButtonModule,
    FontAwesomeModule,
    SharedComponentsModule,
    CertificateDeliveryFunnelComponent,
  ],
  templateUrl: './certificate-batches-list.component.html',
  styleUrls: ['./certificate-batches-list.component.scss'],
})
export class CertificateBatchesListComponent implements OnInit, OnDestroy {
  community: ICommunity;
  batches: ICertificateBatch[] = [];
  isLoading = true;
  page = 1;
  count = 10;
  total = 0;
  moment = moment;
  ECertificateBatchStatus = ECertificateBatchStatus;
  icons = {
    faPlus,
    faAward,
    faEllipsisVertical,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certificateBatchService: CertificateBatchService,
    private dialogService: NbDialogService,
    private toastLogService: LibToastLogService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.seoService.noIndex(true);
    this.route.parent.parent.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.community = data.community;
      this.seoService.setTitle(`Certificates | Dashboard | ${this.community.name}`);
      this.fetchBatches();
    });
  }

  ngOnDestroy() {
    this.seoService.noIndex(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchBatches() {
    this.isLoading = true;
    this.certificateBatchService
      .indexCertificateBatches(this.community.id, this.page, this.count)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.batches = res.values;
        this.page = res.page;
        this.total = res.total;
        this.isLoading = false;
      });
  }

  onPageChange(page: number) {
    this.page = page;
    this.fetchBatches();
  }

  statusLabel(status: ECertificateBatchStatus): string {
    return status ?? 'unknown';
  }

  statusColor(status: ECertificateBatchStatus): string {
    switch (status) {
      case ECertificateBatchStatus.READY:
        return 'com-bg-blue-100';
      case ECertificateBatchStatus.SENDING:
        return 'com-bg-yellow-100';
      case ECertificateBatchStatus.SENT:
        return 'com-bg-green-100';
      default:
        return 'com-bg-gray-100';
    }
  }

  statusFontColor(status: ECertificateBatchStatus): string {
    switch (status) {
      case ECertificateBatchStatus.READY:
        return 'com-text-Ultramarine-Blue';
      case ECertificateBatchStatus.SENDING:
        return 'com-text-yellow-700';
      case ECertificateBatchStatus.SENT:
        return 'com-text-green-700';
      default:
        return 'com-text-gray-500';
    }
  }

  sentSegments(batch: ICertificateBatch): ICertificateDeliveryFunnelSegment[] {
    return [
      { label: 'Sent', value: batch.sent_count, colorClass: 'com-bg-green-600' },
      { label: '', value: batch.blocked_count, colorClass: 'com-bg-red-600' },
    ];
  }

  openCreateDialog() {
    this.dialogService
      .open(CertificateBatchCreateDialogComponent, {
        context: { communityId: this.community.id },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((batch: ICertificateBatch) => {
        if (batch) {
          this.router.navigate([batch.uuid], { relativeTo: this.route });
        }
      });
  }

  onBatchAction(batch: ICertificateBatch, action: BatchAction | '') {
    if (action === 'delete') {
      this.deleteBatch(batch);
    }
  }

  deleteBatch(batch: ICertificateBatch) {
    openCertificateConfirmDialog(this.dialogService, {
      title: 'Delete this batch?',
      message: `Delete "${batch.name}"? This revokes every certificate already issued under it, and cannot be undone.`,
      danger: true,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.certificateBatchService
          .deleteCertificateBatch(batch.uuid)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.toastLogService.successDialog('Batch deleted');
              this.batches = this.batches.filter((b) => b.uuid !== batch.uuid);
              this.total -= 1;
            },
            error: (err) => {
              this.toastLogService.errorDialog(err?.error?.message || 'Could not delete the batch');
            },
          });
      });
  }
}
