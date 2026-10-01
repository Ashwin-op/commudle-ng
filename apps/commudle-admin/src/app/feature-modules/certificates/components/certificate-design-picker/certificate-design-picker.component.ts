import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { NbDialogService } from '@commudle/theme';
import { CommudleButtonModule } from '@commudle/commudle-theme';
import { ECertificateDesignType, ICertificateBatch, ICertificateDesign } from '@commudle/shared-models';
import { CertificateBatchService, CertificateDesignService } from '@commudle/shared-services';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faEllipsisVertical, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';
import { CertificateUploadDesignDialogComponent } from '../certificate-upload-design-dialog/certificate-upload-design-dialog.component';
import { openCertificateConfirmDialog } from '../certificate-confirm-dialog/certificate-confirm-dialog.component';

type DesignAction = 'delete';

@Component({
  selector: 'commudle-certificate-design-picker',
  standalone: true,
  imports: [CommonModule, CommudleButtonModule, FontAwesomeModule, SharedComponentsModule],
  templateUrl: './certificate-design-picker.component.html',
  styleUrls: ['./certificate-design-picker.component.scss'],
})
export class CertificateDesignPickerComponent implements OnChanges, OnDestroy {
  @Input() batch: ICertificateBatch;
  @Output() batchUpdated = new EventEmitter<ICertificateBatch>();

  designs: ICertificateDesign[] = [];
  isLoading = true;
  ECertificateDesignType = ECertificateDesignType;
  icons = { faPlus, faCheck, faEllipsisVertical };

  designPage = 1;
  designTotal = 0;
  readonly designPageSize = 5;

  private destroy$ = new Subject<void>();
  // The parent merges emitted updates into the same `batch` reference
  // (see certificate-batch-detail's onBatchUpdated()), so ngOnChanges
  // normally won't refire from this component's own batchUpdated emits.
  // This guard is for the case that still legitimately changes the
  // reference - navigating to a different batch entirely - so a fresh
  // fetch only happens then, not on every local update.
  private loadedBatchUuid: string;

  constructor(
    private certificateDesignService: CertificateDesignService,
    private certificateBatchService: CertificateBatchService,
    private toastLogService: LibToastLogService,
    private dialogService: NbDialogService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.batch && this.batch && this.batch.uuid !== this.loadedBatchUuid) {
      this.loadedBatchUuid = this.batch.uuid;
      this.designPage = 1;
      this.fetchDesigns();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchDesigns() {
    this.isLoading = true;
    this.certificateDesignService
      .indexCertificateDesigns(this.batch.issuer_id, 'all', this.designPage, this.designPageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.designs = res.values;
        this.designTotal = res.total;
        this.isLoading = false;
      });
  }

  onDesignPageChange(page: number) {
    this.designPage = page;
    this.fetchDesigns();
  }

  selectDesign(design: ICertificateDesign) {
    if (design.id === this.batch.design?.id) {
      return;
    }
    // A design can be swapped even after some certificates were already
    // issued under the old one - those PDFs are permanent, stored bytes
    // that never change on their own, so a swap only matters for
    // recipients if the organizer explicitly reissues them (via "Issue
    // Certificates" or the per-recipient "Reissue" button). No prompt or
    // scope choice here - just a heads-up that existing certificates
    // weren't touched by this swap.
    const hadPreviousDesign = !!this.batch.design;
    this.certificateBatchService
      .updateCertificateBatch(this.batch.uuid, { certificate_design_id: design.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedBatch) => {
          this.toastLogService.successDialog('Design updated');
          this.batchUpdated.emit(updatedBatch);
          if (hadPreviousDesign && (updatedBatch.sent_count > 0 || updatedBatch.generated_count > 0)) {
            this.toastLogService.warningDialog(
              'Existing issued certificates will not be changed unless you reissue them',
            );
          }
        },
        error: () => {
          this.toastLogService.errorDialog('Could not update the design');
        },
      });
  }

  openUploadDialog() {
    this.dialogService
      .open(CertificateUploadDesignDialogComponent, {
        context: { issuerId: this.batch.issuer_id, defaultName: this.batch.name },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((design: ICertificateDesign | undefined) => {
        if (!design) {
          return;
        }
        // Prepend locally rather than refetching (see the "mutate locally,
        // don't refetch" note elsewhere in this feature) - but with real
        // server-side pagination now in place, page 1 can only ever hold
        // `designPageSize` items, so cap it the same way a fresh fetch of
        // page 1 would.
        this.designPage = 1;
        this.designs = [design, ...this.designs].slice(0, this.designPageSize);
        this.designTotal += 1;
        this.selectDesign(design);
      });
  }

  onDesignAction(design: ICertificateDesign, action: DesignAction | '', event: Event) {
    // The card itself is clickable (selects the design) - the select's own
    // click listener already stops that bubbling, but the change event
    // still needs to be kept from doing so too.
    event.stopPropagation();
    if (action === 'delete') {
      this.deleteDesign(design);
    }
  }

  deleteDesign(design: ICertificateDesign) {
    openCertificateConfirmDialog(this.dialogService, {
      message: `Delete "${design.name}"? If it's already been used by a sent batch, it'll be archived instead (hidden from this picker, but kept for that batch's existing certificates) rather than deleted outright.`,
      danger: true,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.certificateDesignService
          .deleteCertificateDesign(design.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (result) => {
              this.designs = this.designs.filter((d) => d.id !== design.id);
              this.designTotal = Math.max(0, this.designTotal - 1);
              this.toastLogService.successDialog(
                result.archived
                  ? `"${design.name}" was already in use, so it's been archived instead of deleted`
                  : `"${design.name}" deleted`,
              );
              // A hard delete nullifies certificate_design_id server-side
              // for any batch using it - reflect that locally so this
              // batch's own !batch.design guards recompute. An archive
              // doesn't touch the batch's assignment - it stays usable for
              // whichever batch already had it selected, just hidden from
              // the picker for new selections.
              if (result.deleted && design.id === this.batch.design?.id) {
                this.batchUpdated.emit({ ...this.batch, design: null, certificate_design_id: null });
              }
            },
            error: (err) => {
              this.toastLogService.errorDialog(err?.error?.message || 'Could not delete this design');
            },
          });
      });
  }
}
