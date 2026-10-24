import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NbCheckboxModule, NbDialogService, NbInputModule, NbTooltipModule } from '@commudle/theme';
import { CommudleButtonModule } from '@commudle/commudle-theme';
import {
  ECertificateBatchStatus,
  ECertificateRecipientStatus,
  ICertificateBatch,
  ICertificateProgress,
} from '@commudle/shared-models';
import { CertificateBatchService, CertificateRecipientService } from '@commudle/shared-services';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { Observable, Subject, interval, map, takeUntil } from 'rxjs';
import {
  CertificateDeliveryFunnelComponent,
  ICertificateDeliveryFunnelSegment,
} from '../certificate-delivery-funnel/certificate-delivery-funnel.component';
import { openCertificateConfirmDialog } from '../certificate-confirm-dialog/certificate-confirm-dialog.component';
import {
  CertificateReissueDialogComponent,
  ECertificateReissueScope,
} from '../certificate-reissue-dialog/certificate-reissue-dialog.component';
import {
  CertificateResendDialogComponent,
  ICertificateResendDialogResult,
} from '../certificate-resend-dialog/certificate-resend-dialog.component';
import {
  CertificateMissingValuesDialogComponent,
  ECertificateMissingValuesChoice,
} from '../certificate-missing-values-dialog/certificate-missing-values-dialog.component';

const POLL_INTERVAL_MS = 4000;

@Component({
  selector: 'commudle-certificate-send-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CommudleButtonModule,
    NbCheckboxModule,
    NbInputModule,
    NbTooltipModule,
    SharedComponentsModule,
    CertificateDeliveryFunnelComponent,
  ],
  templateUrl: './certificate-send-panel.component.html',
  styleUrls: ['./certificate-send-panel.component.scss'],
})
export class CertificateSendPanelComponent implements OnChanges, OnDestroy {
  @Input() batch: ICertificateBatch;
  @Output() batchUpdated = new EventEmitter<ICertificateBatch>();

  ECertificateBatchStatus = ECertificateBatchStatus;
  consentChecked = false;
  isSending = false;
  isIssuing = false;
  isResendingUnsentOnly = false;
  isLoadingProgress = false;
  progress: ICertificateProgress | null = null;
  emailSubject = '';
  emailBody = '';

  private destroy$ = new Subject<void>();
  private pollDestroy$ = new Subject<void>();

  constructor(
    private certificateBatchService: CertificateBatchService,
    private certificateRecipientService: CertificateRecipientService,
    private toastLogService: LibToastLogService,
    private dialogService: NbDialogService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.batch && this.batch) {
      if (changes.batch.firstChange) {
        this.emailSubject = this.batch.email_subject || '';
        this.emailBody = this.batch.email_body || '';
      }
      if (this.batch.status !== ECertificateBatchStatus.DRAFT) {
        this.fetchProgress();
      }
      this.togglePolling();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollDestroy$.next();
    this.pollDestroy$.complete();
  }

  get canSend(): boolean {
    return (
      !!this.batch?.design &&
      this.consentChecked &&
      !!this.emailSubject.trim() &&
      !!this.emailBody.trim() &&
      !this.isSending
    );
  }

  get isRevoked(): boolean {
    return !!this.batch?.revoked_at;
  }

  get headlineSegments(): ICertificateDeliveryFunnelSegment[] {
    if (!this.progress) {
      return [];
    }
    return [
      { label: 'Delivered', value: this.progress.totals.delivered, colorClass: 'com-bg-green-600' },
      { label: '', value: this.progress.totals.blocked, colorClass: 'com-bg-red-600' },
    ];
  }

  get metricSegments(): ICertificateDeliveryFunnelSegment[] {
    if (!this.progress) {
      return [];
    }
    return [
      { label: 'Sent', value: this.progress.totals.sent, colorClass: 'com-bg-Ultramarine-Blue' },
      { label: 'Delivered', value: this.progress.totals.delivered, colorClass: 'com-bg-green-600' },
      { label: 'Opened', value: this.progress.totals.opened, colorClass: 'com-bg-yellow-600' },
      { label: 'Clicked', value: this.progress.totals.clicked, colorClass: 'com-bg-purple-600' },
    ];
  }

  get legendSegments(): ICertificateDeliveryFunnelSegment[] {
    if (!this.progress) {
      return [];
    }
    return [
      { label: 'blocked', value: this.progress.totals.blocked, colorClass: 'com-bg-red-600' },
      { label: 'skipped', value: this.progress.totals.skipped, colorClass: 'com-bg-gray-400' },
    ];
  }

  fetchProgress() {
    this.isLoadingProgress = true;
    this.certificateBatchService
      .getProgress(this.batch.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (progress) => {
          this.progress = progress;
          this.isLoadingProgress = false;
        },
        error: () => {
          this.isLoadingProgress = false;
        },
      });
  }

  private togglePolling() {
    this.pollDestroy$.next();
    if (this.batch.status === ECertificateBatchStatus.SENDING) {
      interval(POLL_INTERVAL_MS)
        .pipe(takeUntil(this.pollDestroy$), takeUntil(this.destroy$))
        .subscribe(() => this.refreshBatchAndProgress());
    }
  }

  private refreshBatchAndProgress() {
    this.certificateBatchService
      .fetchCertificateBatch(this.batch.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((freshBatch) => {
        // Mutate in place (same object reference) rather than emitting a new
        // object - sibling sections bind [batch]="batch" too, and a new
        // reference re-fires their ngOnChanges, causing a full refetch/flash
        // in every section on every poll tick. Mutating keeps this panel's
        // own bindings live without disturbing anything else.
        Object.assign(this.batch, freshBatch);
        this.batchUpdated.emit(this.batch);
        // Mutating doesn't re-fire ngOnChanges, so re-check here whether
        // polling should stop now that status may have moved past SENDING.
        this.togglePolling();
      });
    this.fetchProgress();
  }

  issueCertificates() {
    if (!this.batch?.design || this.isIssuing) {
      return;
    }
    // Some recipients may already have a certificate from an earlier
    // "Issue Certificates" run under a since-changed design - ask which
    // ones should be (re)issued, same prompt already used for the
    // send/resend flow. Nothing to ask if no one's been issued yet.
    if (this.batch.generated_count > 0) {
      const alreadyIssuedCount = this.batch.generated_count;
      const newCount = Math.max((this.batch.recipients_count || 0) - alreadyIssuedCount, 0);
      this.dialogService
        .open(CertificateReissueDialogComponent, { context: { newCount, alreadyIssuedCount } })
        .onClose.pipe(takeUntil(this.destroy$))
        .subscribe((scope: ECertificateReissueScope | undefined) => {
          if (scope === 'all') {
            this.runIssueBatch({ force: true });
          } else if (scope === 'unissued') {
            this.runIssueBatch();
          }
        });
      return;
    }
    this.runIssueBatch();
  }

  private runIssueBatch(options?: { force?: boolean }) {
    this.isIssuing = true;
    this.certificateBatchService
      .issueBatch(this.batch.uuid, options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isIssuing = false;
          this.toastLogService.successDialog(
            'Issuing certificates in the background - use the refresh button on the recipients table below to check progress.',
            4000,
          );
        },
        error: (err) => {
          this.isIssuing = false;
          this.toastLogService.errorDialog(err?.error?.message || 'Could not start issuing certificates');
        },
      });
  }

  send() {
    if (!this.canSend) {
      return;
    }
    this.isSending = true;
    this.confirmMissingValuesThenRun(
      undefined,
      (selection) => {
        this.certificateBatchService
          .updateCertificateBatch(this.batch.uuid, {
            email_subject: this.emailSubject.trim(),
            email_body: this.emailBody.trim(),
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updated) => {
              Object.assign(this.batch, updated);
              this.certificateBatchService
                .sendBatch(this.batch.uuid, selection)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    this.isSending = false;
                    this.toastLogService.successDialog('Sending started');
                    this.refreshBatchAndProgress();
                  },
                  error: (err) => {
                    this.isSending = false;
                    this.toastLogService.errorDialog(err?.error?.message || 'Could not start sending');
                  },
                });
            },
            error: () => {
              this.isSending = false;
              this.toastLogService.errorDialog('Could not save the email subject/body before sending');
            },
          });
      },
      () => {
        this.isSending = false;
      },
    );
  }

  resend() {
    this.openResendDialog({
      title: 'Resend certificates',
      confirmLabel: 'Resend',
      unsentOnly: false,
    });
  }

  resendUnsentOnly() {
    this.openResendDialog({
      title: 'Resend to unsent recipients only',
      confirmLabel: 'Resend',
      unsentOnly: true,
    });
  }

  // Lets the organizer see exactly what went out - including on the very
  // first send, not just before a resend - without being able to change it
  // (editing here wouldn't do anything: the email already sent).
  viewSentContent() {
    this.dialogService.open(CertificateResendDialogComponent, {
      context: {
        title: 'Email content sent',
        emailSubject: this.batch.email_subject || '',
        emailBody: this.batch.email_body || '',
        readOnly: true,
      },
    });
  }

  // resend/resend_unsent_only on the backend just re-fire the worker with
  // whatever email_subject/email_body are already saved on the batch -
  // there's no single-call "update and resend". So an edit here first goes
  // through updateCertificateBatch, then the resend call, same two-step
  // `send()` already does for the very first send.
  private openResendDialog(options: { title: string; confirmLabel: string; unsentOnly: boolean }) {
    this.dialogService
      .open(CertificateResendDialogComponent, {
        context: {
          title: options.title,
          emailSubject: this.batch.email_subject || '',
          emailBody: this.batch.email_body || '',
          confirmLabel: options.confirmLabel,
        },
        closeOnBackdropClick: false,
        closeOnEsc: false,
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((result: ICertificateResendDialogResult | undefined) => {
        if (!result) {
          return;
        }
        const isSendingFlag = options.unsentOnly ? 'isResendingUnsentOnly' : 'isSending';
        this[isSendingFlag] = true;
        const initialSelection = options.unsentOnly ? { unsent_only: true } : undefined;
        this.confirmMissingValuesThenRun(
          initialSelection,
          (selection) => {
            this.certificateBatchService
              .updateCertificateBatch(this.batch.uuid, {
                email_subject: result.emailSubject,
                email_body: result.emailBody,
              })
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (updated) => {
                  Object.assign(this.batch, updated);
                  this.certificateBatchService
                    .resendBatch(this.batch.uuid, selection)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                      next: () => {
                        this[isSendingFlag] = false;
                        this.toastLogService.successDialog(
                          options.unsentOnly ? 'Resending to unsent recipients started' : 'Resending started',
                        );
                        this.refreshBatchAndProgress();
                      },
                      error: (err) => {
                        this[isSendingFlag] = false;
                        this.toastLogService.errorDialog(err?.error?.message || 'Could not resend');
                      },
                    });
                },
                error: () => {
                  this[isSendingFlag] = false;
                  this.toastLogService.errorDialog('Could not save the email subject/body before resending');
                },
              });
          },
          () => {
            this[isSendingFlag] = false;
          },
        );
      });
  }

  // Checks missingValuesPreview() for `selection` (undefined = everyone,
  // matching what send/resend themselves default to) before letting a batch
  // send/resend actually fire. No missing values -> proceeds immediately
  // with the original selection. Missing values found -> shows the confirm
  // dialog; "Wait" calls onCancel and stops here; "Skip and Send" resolves
  // the full eligible id list (same unsent_only filter, applied client-side
  // since we're about to pass explicit recipient_ids instead) minus the
  // recipients the dialog listed, and proceeds with that as the selection.
  // If the preview call itself fails, proceeds with the original selection
  // rather than silently blocking a send over a read-only check failing.
  private confirmMissingValuesThenRun(
    selection: { recipient_ids?: number[]; unsent_only?: boolean } | undefined,
    onProceed: (selection?: { recipient_ids?: number[]; unsent_only?: boolean }) => void,
    onCancel: () => void,
  ) {
    this.certificateBatchService
      .missingValuesPreview(this.batch.uuid, selection)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preview) => {
          if (preview.missing_values.length === 0) {
            onProceed(selection);
            return;
          }
          this.dialogService
            .open(CertificateMissingValuesDialogComponent, {
              context: { rows: preview.missing_values },
              closeOnBackdropClick: false,
              closeOnEsc: false,
            })
            .onClose.pipe(takeUntil(this.destroy$))
            .subscribe((result: { choice: ECertificateMissingValuesChoice; ids?: number[] } | undefined) => {
              if (!result || result.choice === 'wait') {
                onCancel();
                return;
              }
              const skipIds = new Set(result.ids);
              this.resolveSendableRecipientIds(!!selection?.unsent_only)
                .pipe(takeUntil(this.destroy$))
                .subscribe((allIds) => {
                  onProceed({ recipient_ids: allIds.filter((id) => !skipIds.has(id)) });
                });
            });
        },
        error: () => {
          onProceed(selection);
        },
      });
  }

  // Fetches every non-revoked recipient's id for this batch (one page sized
  // to the batch's own recipients_count - these lists are small enough for
  // an occasional admin action) so "Skip and Send" can pass an explicit
  // recipient_ids list that's everyone-minus-the-skipped, since the send/
  // resend endpoints only support an inclusion list, not an exclusion one.
  private resolveSendableRecipientIds(unsentOnly: boolean): Observable<number[]> {
    const count = Math.max(this.batch.recipients_count || 1, 1);
    return this.certificateRecipientService.indexCertificateRecipients(this.batch.uuid, 1, count).pipe(
      map((res) =>
        res.values
          .filter((recipient) => !recipient.revoked_at)
          .filter(
            (recipient) =>
              !unsentOnly ||
              ![ECertificateRecipientStatus.SENT, ECertificateRecipientStatus.DELIVERED].includes(recipient.status),
          )
          .map((recipient) => recipient.id),
      ),
    );
  }

  toggleRevoke() {
    const message = this.isRevoked
      ? 'Un-revoke this batch? All its certificates become publicly viewable again.'
      : 'Revoke this whole batch? Every certificate in it 404s on its public page until un-revoked.';
    openCertificateConfirmDialog(this.dialogService, { message, danger: !this.isRevoked })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        const action = this.isRevoked
          ? this.certificateBatchService.unrevokeBatch(this.batch.uuid)
          : this.certificateBatchService.revokeBatch(this.batch.uuid);
        action.pipe(takeUntil(this.destroy$)).subscribe({
          next: (batch) => {
            this.toastLogService.successDialog(this.isRevoked ? 'Un-revoked' : 'Revoked');
            this.batchUpdated.emit(batch);
          },
          error: () => {
            this.toastLogService.errorDialog('Could not update the revoke status');
          },
        });
      });
  }
}
