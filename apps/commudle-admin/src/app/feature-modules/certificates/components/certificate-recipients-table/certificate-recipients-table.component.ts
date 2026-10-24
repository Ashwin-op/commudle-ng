import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NbCheckboxModule, NbDialogService, NbInputModule, NbTooltipModule } from '@commudle/theme';
import { CommudleButtonModule } from '@commudle/commudle-theme';
import {
  ECertificateBatchStatus,
  ECertificateRecipientStatus,
  ICertificateBatch,
  ICertificateRecipient,
  ICertificateVariable,
} from '@commudle/shared-models';
import {
  CertificateBatchService,
  CertificateRecipientService,
  CertificateVariableService,
} from '@commudle/shared-services';
import {
  faPlus,
  faPen,
  faTrash,
  faUpload,
  faEye,
  faPaperPlane,
  faBan,
  faCertificate,
  faDownload,
  faSpinner,
  faRedo,
  faUndo,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { Subject, debounceTime, forkJoin, interval, switchMap, take, takeUntil, takeWhile } from 'rxjs';
import { CertificateRecipientFormDialogComponent } from '../certificate-recipient-form-dialog/certificate-recipient-form-dialog.component';
import { CertificateCsvUploadDialogComponent } from '../certificate-csv-upload-dialog/certificate-csv-upload-dialog.component';
import { CertificateRecipientPreviewDialogComponent } from '../certificate-recipient-preview-dialog/certificate-recipient-preview-dialog.component';
import { openCertificateConfirmDialog } from '../certificate-confirm-dialog/certificate-confirm-dialog.component';
import {
  CertificateMissingValuesDialogComponent,
  ECertificateMissingValuesChoice,
} from '../certificate-missing-values-dialog/certificate-missing-values-dialog.component';
import {
  CertificateResendDialogComponent,
  ICertificateResendDialogResult,
} from '../certificate-resend-dialog/certificate-resend-dialog.component';

const ISSUED_STATUSES = [
  ECertificateRecipientStatus.GENERATED,
  ECertificateRecipientStatus.SENT,
  ECertificateRecipientStatus.DELIVERED,
];

// certificate-send-panel polls the batch itself every 4s while SENDING, but
// mutates that shared `batch` object in place rather than reassigning it
// (see its own refreshBatchAndProgress()) specifically so sibling sections'
// [batch]="batch" bindings don't re-fire ngOnChanges and flash the page -
// which also means this table is never notified to refresh its own rows.
// This is this table's own poll for that, on a slower, independent 10s
// cadence, covering only the currently visible page/search (fetchRecipients
// already scopes to that, same as any other refresh here).
const RECIPIENT_POLL_INTERVAL_MS = 10000;

@Component({
  selector: 'commudle-certificate-recipients-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommudleButtonModule,
    NbInputModule,
    NbCheckboxModule,
    NbTooltipModule,
    FontAwesomeModule,
    SharedComponentsModule,
  ],
  templateUrl: './certificate-recipients-table.component.html',
  styleUrls: ['./certificate-recipients-table.component.scss'],
})
export class CertificateRecipientsTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() batch: ICertificateBatch;
  @Output() variablesChanged = new EventEmitter<void>();

  recipients: ICertificateRecipient[] = [];
  variables: ICertificateVariable[] = [];
  isLoading = true;
  page = 1;
  count = 10;
  total = 0;
  query = '';
  searchForm: FormGroup;
  selectedIds = new Set<number>();
  isSendingSelected = false;
  isDeletingSelected = false;
  ECertificateRecipientStatus = ECertificateRecipientStatus;
  icons = {
    faPlus,
    faPen,
    faTrash,
    faUpload,
    faEye,
    faPaperPlane,
    faBan,
    faCertificate,
    faDownload,
    faSpinner,
    faRedo,
    faUndo,
    faExclamationTriangle,
  };

  private destroy$ = new Subject<void>();
  private pollDestroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private certificateRecipientService: CertificateRecipientService,
    private certificateVariableService: CertificateVariableService,
    private certificateBatchService: CertificateBatchService,
    private dialogService: NbDialogService,
    private toastLogService: LibToastLogService,
  ) {
    this.searchForm = this.fb.group({ q: [''] });
  }

  ngOnInit() {
    this.search();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.batch && this.batch) {
      this.fetchVariables();
      this.fetchRecipients();
      this.toggleRecipientPolling();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollDestroy$.next();
    this.pollDestroy$.complete();
  }

  // `batch` never changes reference after this table's first ngOnChanges
  // (see the comment on RECIPIENT_POLL_INTERVAL_MS above), so this only
  // actually runs once per batch load - each tick re-reads `this.batch.status`
  // directly (rather than depending on Angular noticing a change) since
  // certificate-send-panel keeps that same shared object's status field
  // current via its own in-place mutation.
  private toggleRecipientPolling() {
    this.pollDestroy$.next();
    if (this.batch.status === ECertificateBatchStatus.SENDING) {
      interval(RECIPIENT_POLL_INTERVAL_MS)
        .pipe(takeUntil(this.pollDestroy$), takeUntil(this.destroy$))
        .subscribe(() => {
          this.fetchRecipients(false);
          this.toggleRecipientPolling();
        });
    }
  }

  search() {
    this.searchForm
      .get('q')
      .valueChanges.pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe((value: string) => {
        this.query = value?.trim() || '';
        this.page = 1;
        this.clearSelection();
        this.fetchRecipients(false);
      });
  }

  fetchVariables() {
    this.certificateVariableService
      .indexCertificateVariables(this.batch.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.variables = res.certificate_variables;
      });
  }

  // showLoading is false for background refreshes after add/edit/delete/CSV
  // upload - toggling isLoading there would hide the whole table behind the
  // spinner (*ngIf="!isLoading") for an operation that only changed one row,
  // producing a visible flicker each time.
  fetchRecipients(showLoading = true) {
    if (showLoading) {
      this.isLoading = true;
    }
    this.certificateRecipientService
      .indexCertificateRecipients(this.batch.uuid, this.page, this.count, undefined, this.query || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.recipients = res.values;
        this.page = res.page;
        this.total = res.total;
        this.isLoading = false;
      });
  }

  onPageChange(page: number) {
    this.page = page;
    this.clearSelection();
    this.fetchRecipients();
  }

  statusLabel(status: ECertificateRecipientStatus): string {
    return status ?? 'unknown';
  }

  statusColor(status: ECertificateRecipientStatus): string {
    switch (status) {
      case ECertificateRecipientStatus.QUEUED:
      case ECertificateRecipientStatus.GENERATED:
        return 'com-bg-blue-100';
      case ECertificateRecipientStatus.SENT:
      case ECertificateRecipientStatus.DELIVERED:
        return 'com-bg-green-100';
      case ECertificateRecipientStatus.SKIPPED:
        return 'com-bg-yellow-100';
      case ECertificateRecipientStatus.BOUNCED:
      case ECertificateRecipientStatus.FAILED:
      case ECertificateRecipientStatus.BLOCKED:
        return 'com-bg-red-100';
      default:
        return 'com-bg-gray-100';
    }
  }

  statusFontColor(status: ECertificateRecipientStatus): string {
    switch (status) {
      case ECertificateRecipientStatus.QUEUED:
      case ECertificateRecipientStatus.GENERATED:
        return 'com-text-Ultramarine-Blue';
      case ECertificateRecipientStatus.SENT:
      case ECertificateRecipientStatus.DELIVERED:
        return 'com-text-green-700';
      case ECertificateRecipientStatus.SKIPPED:
        return 'com-text-yellow-700';
      case ECertificateRecipientStatus.BOUNCED:
      case ECertificateRecipientStatus.FAILED:
      case ECertificateRecipientStatus.BLOCKED:
        return 'com-text-Infra-Red';
      default:
        return 'com-text-gray-500';
    }
  }

  openAddDialog() {
    this.dialogService
      .open(CertificateRecipientFormDialogComponent, {
        context: { certificateBatchId: this.batch.uuid, variables: this.variables, recipient: null },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((result: { recipient: ICertificateRecipient; variablesAdded: boolean } | undefined) => {
        if (result?.recipient) {
          this.fetchRecipients(false);
          this.refreshBatchCounts();
          if (result.variablesAdded) {
            this.fetchVariables();
            this.variablesChanged.emit();
          }
        }
      });
  }

  openEditDialog(recipient: ICertificateRecipient) {
    this.dialogService
      .open(CertificateRecipientFormDialogComponent, {
        context: { certificateBatchId: this.batch.uuid, variables: this.variables, recipient },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((result: { recipient: ICertificateRecipient; variablesAdded: boolean } | undefined) => {
        if (result?.recipient) {
          this.fetchRecipients(false);
          if (result.variablesAdded) {
            this.fetchVariables();
            this.variablesChanged.emit();
          }
        }
      });
  }

  openCsvUploadDialog() {
    this.dialogService
      .open(CertificateCsvUploadDialogComponent, {
        context: { certificateBatchId: this.batch.uuid },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.fetchVariables();
          this.fetchRecipients(false);
          this.refreshBatchCounts();
          this.variablesChanged.emit();
        }
      });
  }

  // recipients_count/generated_count live on `batch`, not this table's own
  // recipient list - anything that adds/removes a recipient, or changes
  // whether one counts as issued, leaves those two fields stale on the
  // shared `batch` object otherwise. Left stale, certificate-send-panel's
  // "Issue Certificates" reissue-scope dialog (which reads them straight off
  // `batch`) can't tell a brand-new recipient apart from one that was
  // already issued - see the 2026-09-22 bug where a just-added recipient
  // wasn't offered "issue only to new attendees" because the batch object
  // still reflected the counts from before it existed.
  //
  // Mutates `batch` in place (same reference passed to every sibling
  // section via [batch]="batch") rather than reassigning it - reassigning
  // would re-fire ngOnChanges on every sibling and flash the whole page,
  // same reasoning as certificate-send-panel's own refreshBatchAndProgress().
  private refreshBatchCounts() {
    this.certificateBatchService
      .fetchCertificateBatch(this.batch.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((freshBatch) => Object.assign(this.batch, freshBatch));
  }

  openPreviewDialog(recipient: ICertificateRecipient) {
    if (!this.batch.design) {
      this.toastLogService.warningDialog('Choose a design for this batch first');
      return;
    }
    this.dialogService.open(CertificateRecipientPreviewDialogComponent, {
      context: { certificateBatchId: this.batch.uuid, recipient },
    });
  }

  // `name` is a dual-purpose variable (see certificate-recipient-form-dialog) -
  // it's already shown via the fixed NAME column below, so it's dropped here
  // to avoid a redundant duplicate column. It still belongs in `variables`
  // itself (unfiltered) for the canvas/dialogs, where it needs to stay
  // positionable like any other variable.
  get tableVariables(): ICertificateVariable[] {
    return this.variables.filter((variable) => variable.key !== 'name');
  }

  get canSendIndividually(): boolean {
    return !!this.batch.locked_at;
  }

  // recipient.sendable is now purely structural (email.present? on the
  // backend, 2026-09-22 design change) - counts recipients on the current
  // page with no email, so the table header can flag it. Email is a
  // required column, so in practice this is always 0 - kept as a visible
  // safeguard rather than assumed impossible.
  get noEmailCount(): number {
    return this.recipients.filter((recipient) => recipient.sendable === false).length;
  }

  // Revoking a batch only stamps certificate_batches.revoked_at - it
  // doesn't cascade to each recipient's own revoked_at, so this checks
  // the batch separately from recipient.revoked_at (individual revoke).
  // Every certificate in a revoked batch 404s on its public page (see the
  // banner in certificate-send-panel), so send/generate/reissue/download
  // would all be misleading to offer here.
  get isBatchRevoked(): boolean {
    return !!this.batch.revoked_at;
  }

  // send_one is fire-and-forget (enqueued on Sidekiq, no finished recipient
  // in the response) - this optimistically marks the row queued locally,
  // then polls showCertificateRecipient() (gdgapp, added 2026-09-22) every
  // few seconds until the job actually finishes and the status moves off
  // QUEUED, patching just that row instead of refetching the whole table.
  //
  // A missing required value no longer hard-blocks this (2026-09-22 design
  // change) - the API 422s once with missing_keys, so confirmMissingValues
  // is retried true after the row-level confirm dialog below.
  sendOne(recipient: ICertificateRecipient, confirmMissingValues = false) {
    this.certificateRecipientService
      .sendOne(this.batch.uuid, recipient.id, confirmMissingValues)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          recipient.status = ECertificateRecipientStatus.QUEUED;
          this.toastLogService.successDialog(`Queued a send for ${recipient.email}`);
          this.pollRecipientStatus(recipient);
        },
        error: (err) => {
          const missingKeys: string[] | undefined = err?.error?.data?.missing_keys;
          if (missingKeys?.length && !confirmMissingValues) {
            this.confirmMissingValuesThenRetry(recipient, missingKeys, () => this.sendOne(recipient, true));
            return;
          }
          this.toastLogService.errorDialog(err?.error?.message || 'Could not send to this recipient');
        },
      });
  }

  // Polls every 3s, up to 20 attempts (~1 minute) - a bounded ceiling so a
  // stuck/failed Sidekiq job doesn't poll forever. Stops as soon as the
  // status leaves QUEUED (takeWhile with inclusive=true lets the last,
  // resolving emission through before completing). Silent on error/timeout -
  // this is a background refresh, not a user-initiated action, so there's
  // nothing worth surfacing beyond leaving the row at "Queued" until the
  // next full table refresh picks it up.
  private pollRecipientStatus(recipient: ICertificateRecipient) {
    interval(3000)
      .pipe(
        switchMap(() => this.certificateRecipientService.showCertificateRecipient(this.batch.uuid, recipient.id)),
        takeWhile((updated) => updated.status === ECertificateRecipientStatus.QUEUED, true),
        take(20),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (updated) => Object.assign(recipient, updated),
        error: () => undefined,
      });
  }

  // Synchronous now - the API returns the finished recipient (status,
  // generated_at, uuid) in the response, so the row is updated in place and
  // the button swaps to "Download" immediately, without refetching the table.
  generateOne(recipient: ICertificateRecipient) {
    this.runGenerate(recipient, false, `Generated a certificate for ${recipient.email}`);
  }

  // Same generate_one endpoint as generateOne() - it re-renders and
  // re-attaches the PDF unconditionally (Active Storage purges the old
  // blob on attach), so it doubles as "reissue against the current design"
  // for a recipient who was already issued under a since-changed design.
  // Confirmed first since it permanently replaces the existing certificate.
  reissueOne(recipient: ICertificateRecipient) {
    openCertificateConfirmDialog(this.dialogService, {
      message: `Reissue the certificate for ${recipient.email} using the current design? This permanently replaces their existing certificate.`,
      danger: true,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.runGenerate(recipient, false, `Reissued the certificate for ${recipient.email}`);
      });
  }

  // Shared by generateOne()/reissueOne() - same generate_one call, same
  // missing-values confirm-and-retry as sendOne(), just with a caller-chosen
  // success message.
  private runGenerate(recipient: ICertificateRecipient, confirmMissingValues: boolean, successMessage: string) {
    recipient.isGenerating = true;
    this.certificateRecipientService
      .generateOne(this.batch.uuid, recipient.id, confirmMissingValues)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          recipient.isGenerating = false;
          Object.assign(recipient, updated);
          this.toastLogService.successDialog(successMessage);
          this.refreshBatchCounts();
        },
        error: (err) => {
          recipient.isGenerating = false;
          const missingKeys: string[] | undefined = err?.error?.data?.missing_keys;
          if (missingKeys?.length && !confirmMissingValues) {
            this.confirmMissingValuesThenRetry(recipient, missingKeys, () =>
              this.runGenerate(recipient, true, successMessage),
            );
            return;
          }
          this.toastLogService.errorDialog(err?.error?.message || 'Could not generate this certificate');
        },
      });
  }

  // Row-level counterpart to the batch Send confirm dialog - one recipient
  // at a time, so a plain yes/no confirm is enough instead of the scrollable
  // table dialog used for a batch send.
  private confirmMissingValuesThenRetry(
    recipient: ICertificateRecipient,
    missingKeys: string[],
    onConfirm: () => void,
  ) {
    openCertificateConfirmDialog(this.dialogService, {
      message: `${recipient.email} is missing a value for: ${missingKeys.join(
        ', ',
      )}. Proceed anyway? The field will render blank.`,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          onConfirm();
        }
      });
  }

  // Selection is for selective send - see sendSelected(). Cleared on
  // any page/search change since a selected id might not exist on the new
  // page, and there's no cross-page "select all" concept here.
  isSelected(recipient: ICertificateRecipient): boolean {
    return this.selectedIds.has(recipient.id);
  }

  get isAllOnPageSelected(): boolean {
    return this.recipients.length > 0 && this.recipients.every((r) => this.selectedIds.has(r.id));
  }

  toggleSelect(recipient: ICertificateRecipient, checked: boolean) {
    if (checked) {
      this.selectedIds.add(recipient.id);
    } else {
      this.selectedIds.delete(recipient.id);
    }
  }

  toggleSelectAllOnPage(checked: boolean) {
    this.recipients.forEach((r) => (checked ? this.selectedIds.add(r.id) : this.selectedIds.delete(r.id)));
  }

  clearSelection() {
    this.selectedIds.clear();
  }

  // Works whether or not the batch has ever been sent - resend() 422s with
  // "This batch has never been sent" if consent_confirmed_at isn't set yet
  // (gdgapp certificate_batches_api_controller.rb#resend), so a never-sent
  // batch routes to sendBatch() instead (consent_confirmed:true is already
  // baked into CertificateBatchService#sendBatch). A never-sent batch still
  // needs a design either way - that can only be chosen in the Send step
  // below, so it stays a blocking warning - but the subject/body no longer
  // has to already be saved there first: openSendSelectedDialog() below
  // prompts for it inline, pre-filled with a sensible default.
  sendSelected() {
    if (this.selectedIds.size === 0) {
      return;
    }
    const hasBeenSent = !!this.batch.consent_confirmed_at;
    if (!hasBeenSent && !this.batch.design) {
      this.toastLogService.warningDialog(
        'Choose a design in the Send step below before sending to selected recipients.',
      );
      return;
    }
    const ids = Array.from(this.selectedIds);
    if (!hasBeenSent) {
      this.openSendSelectedDialog(ids);
      return;
    }
    openCertificateConfirmDialog(this.dialogService, {
      message: `Resend to the ${ids.length} selected recipient(s)?`,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.confirmSelectedMissingValuesThenSend(ids, true);
        }
      });
  }

  // Never-sent-yet path only (see sendSelected()) - reuses the same
  // subject/body dialog the Send step's Resend actions already use,
  // pre-filled with whatever's already typed in that step (kept live on
  // `batch.email_subject`/`email_body` via its (ngModelChange) bindings) or
  // a sensible default otherwise, so this bulk action never has to just
  // block and point the user elsewhere to type something first.
  private openSendSelectedDialog(ids: number[]) {
    this.dialogService
      .open(CertificateResendDialogComponent, {
        context: {
          title: 'Send to selected recipients',
          emailSubject: this.batch.email_subject || `Link certificate for ${this.batch.name}`,
          emailBody: this.batch.email_body || 'Here is your certificate.',
          confirmLabel: 'Send',
        },
        closeOnBackdropClick: false,
        closeOnEsc: false,
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((result: ICertificateResendDialogResult | undefined) => {
        if (!result) {
          return;
        }
        this.isSendingSelected = true;
        this.certificateBatchService
          .updateCertificateBatch(this.batch.uuid, {
            email_subject: result.emailSubject,
            email_body: result.emailBody,
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updated) => {
              Object.assign(this.batch, updated);
              this.isSendingSelected = false;
              this.confirmSelectedMissingValuesThenSend(ids, false);
            },
            error: () => {
              this.isSendingSelected = false;
              this.toastLogService.errorDialog('Could not save the email subject/body before sending');
            },
          });
      });
  }

  private confirmSelectedMissingValuesThenSend(ids: number[], hasBeenSent: boolean) {
    this.certificateBatchService
      .missingValuesPreview(this.batch.uuid, { recipient_ids: ids })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preview) => {
          if (preview.missing_values.length === 0) {
            this.runSendSelected(ids, hasBeenSent);
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
                return;
              }
              const skipIds = new Set(result.ids);
              const finalIds = ids.filter((id) => !skipIds.has(id));
              if (finalIds.length === 0) {
                return;
              }
              this.runSendSelected(finalIds, hasBeenSent);
            });
        },
        error: () => {
          this.runSendSelected(ids, hasBeenSent);
        },
      });
  }

  private runSendSelected(ids: number[], hasBeenSent: boolean) {
    this.isSendingSelected = true;
    const verb = hasBeenSent ? 'Resending' : 'Sending';
    const action = hasBeenSent
      ? this.certificateBatchService.resendBatch(this.batch.uuid, { recipient_ids: ids })
      : this.certificateBatchService.sendBatch(this.batch.uuid, { recipient_ids: ids });
    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSendingSelected = false;
        this.toastLogService.successDialog(`${verb} to selected recipients started`);
        this.clearSelection();
        this.fetchRecipients(false);
      },
      error: (err) => {
        this.isSendingSelected = false;
        this.toastLogService.errorDialog(
          err?.error?.message || `Could not ${verb.toLowerCase()} to the selected recipients`,
        );
      },
    });
  }

  // No bulk-delete endpoint exists (same as revoke) - loops the existing
  // per-recipient DELETE, same pattern as sendSelected() delegates to the
  // batch-level recipient_ids param, just without a batch-level
  // equivalent to delegate to here.
  deleteSelected() {
    if (this.selectedIds.size === 0) {
      return;
    }
    const ids = Array.from(this.selectedIds);
    const anyIssued = this.recipients.some((r) => ids.includes(r.id) && ISSUED_STATUSES.includes(r.status));
    const message = anyIssued
      ? `Remove the ${ids.length} selected recipient(s) from this batch? This also revokes any of their already-issued certificates - they will no longer be viewable, and this cannot be undone.`
      : `Remove the ${ids.length} selected recipient(s) from this batch? This cannot be undone.`;
    openCertificateConfirmDialog(this.dialogService, { message, danger: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.isDeletingSelected = true;
        forkJoin(ids.map((id) => this.certificateRecipientService.deleteCertificateRecipient(this.batch.uuid, id)))
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.isDeletingSelected = false;
              this.toastLogService.successDialog('Selected recipients removed');
              this.clearSelection();
              this.fetchRecipients(false);
              this.refreshBatchCounts();
            },
            error: (err) => {
              this.isDeletingSelected = false;
              this.toastLogService.errorDialog(
                err?.error?.message || 'Could not remove some of the selected recipients',
              );
              this.clearSelection();
              this.fetchRecipients(false);
              this.refreshBatchCounts();
            },
          });
      });
  }

  deleteRecipient(recipient: ICertificateRecipient) {
    const message = ISSUED_STATUSES.includes(recipient.status)
      ? `Remove ${recipient.email} from this batch? This also revokes their certificate - it will no longer be viewable, and this cannot be undone.`
      : `Remove ${recipient.email} from this batch? This cannot be undone.`;
    openCertificateConfirmDialog(this.dialogService, { message, danger: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.certificateRecipientService
          .deleteCertificateRecipient(this.batch.uuid, recipient.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.toastLogService.successDialog('Recipient removed');
              this.fetchRecipients(false);
              this.refreshBatchCounts();
            },
            error: () => {
              this.toastLogService.errorDialog('Could not remove the recipient');
            },
          });
      });
  }

  canToggleRevoke(recipient: ICertificateRecipient): boolean {
    return !!recipient.revoked_at || ISSUED_STATUSES.includes(recipient.status);
  }

  // Once a recipient's certificate is actually issued, "Preview" (which
  // re-renders a throwaway copy every time) is misleading - it should link
  // to the real, permanently-stored one instead. Hidden if revoked too,
  // since the link would just 404.
  isIssued(recipient: ICertificateRecipient): boolean {
    return ISSUED_STATUSES.includes(recipient.status) && !recipient.revoked_at;
  }

  // recipient.sendable is false when a required variable's cell is blank,
  // but the API doesn't send back which ones - computed here instead,
  // mirroring CertificateRecipient#missing_required_values on the backend
  // exactly (rendered + positioned + no default + blank cell), using the
  // same `variables` already loaded for the table's columns.
  missingValueLabels(recipient: ICertificateRecipient): string[] {
    return this.variables
      .filter((variable) => variable.keep && variable.positioned && !variable.default_set)
      .filter((variable) => !(recipient.row_values?.[variable.key] || '').trim())
      .map((variable) => variable.label || variable.key);
  }

  missingValuesTooltip(recipient: ICertificateRecipient): string {
    const labels = this.missingValueLabels(recipient);
    return `Missing value${labels.length === 1 ? '' : 's'}: ${labels.join(', ')}`;
  }

  // Links to the public verify/view page, not the raw PDF - lets a viewer
  // see who issued it and confirm it's genuine before downloading.
  certificateViewUrl(recipient: ICertificateRecipient): string {
    return `/certificates/verify/${recipient.uuid}`;
  }

  toggleRecipientRevoke(recipient: ICertificateRecipient) {
    const isRevoked = !!recipient.revoked_at;
    const message = isRevoked
      ? `Un-revoke the certificate for ${recipient.email}? It becomes publicly viewable again.`
      : `Revoke the certificate for ${recipient.email}? Their certificate's public page 404s until un-revoked.`;
    openCertificateConfirmDialog(this.dialogService, { message, danger: !isRevoked })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        const action = isRevoked
          ? this.certificateRecipientService.unrevokeCertificateRecipient(this.batch.uuid, recipient.id)
          : this.certificateRecipientService.revokeCertificateRecipient(this.batch.uuid, recipient.id);
        action.pipe(takeUntil(this.destroy$)).subscribe({
          next: (updated) => {
            recipient.revoked_at = updated.revoked_at;
            this.toastLogService.successDialog(isRevoked ? 'Un-revoked' : 'Revoked');
            this.refreshBatchCounts();
          },
          error: () => {
            this.toastLogService.errorDialog('Could not update the revoke status');
          },
        });
      });
  }
}
