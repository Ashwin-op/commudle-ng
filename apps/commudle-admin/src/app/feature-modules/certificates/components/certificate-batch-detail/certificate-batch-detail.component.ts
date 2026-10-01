import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NbInputModule } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { ECertificateBatchStatus, ICertificateBatch, ICommunity, IFaq } from '@commudle/shared-models';
import { CertificateBatchService, SeoService } from '@commudle/shared-services';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SharedComponentsModule as LibSharedComponentsModule } from '@commudle/shared-components';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faPen } from '@fortawesome/free-solid-svg-icons';
import { CertificateDesignPickerComponent } from '../certificate-design-picker/certificate-design-picker.component';
import { CertificateRecipientsTableComponent } from '../certificate-recipients-table/certificate-recipients-table.component';
import { CertificateCanvasComponent } from '../certificate-canvas/certificate-canvas.component';
import { CertificateSendPanelComponent } from '../certificate-send-panel/certificate-send-panel.component';

@Component({
  selector: 'commudle-certificate-batch-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CommudleCardModule,
    CommudleButtonModule,
    NbInputModule,
    SharedComponentsModule,
    LibSharedComponentsModule,
    FontAwesomeModule,
    CertificateDesignPickerComponent,
    CertificateRecipientsTableComponent,
    CertificateCanvasComponent,
    CertificateSendPanelComponent,
  ],
  templateUrl: './certificate-batch-detail.component.html',
  styleUrls: ['./certificate-batch-detail.component.scss'],
})
export class CertificateBatchDetailComponent implements OnInit, OnDestroy {
  @ViewChild(CertificateRecipientsTableComponent) recipientsTable: CertificateRecipientsTableComponent;
  @ViewChild(CertificateCanvasComponent) canvasComponent: CertificateCanvasComponent;

  batch: ICertificateBatch;
  isLoading = true;
  moment = moment;
  ECertificateBatchStatus = ECertificateBatchStatus;
  icons = { faArrowLeft, faPen };

  isEditingName = false;
  isSavingName = false;
  editedName = '';

  faqs: IFaq[] = [
    {
      question: 'What are "variables"?',
      answer:
        'A variable is a placeholder value that changes per recipient, like name, course, or date. They come from your CSV columns, or you can add one manually. "email" is always a fixed recipient field, never a variable, and "name" is dual-purpose - it fills the recipient\'s name and can also be positioned on the design like any other variable.',
    },
    {
      question: 'What does "positioning" a variable do, and why would I leave one unpositioned?',
      answer:
        'Dragging a variable onto the design in step 3 is what makes it actually render on the certificate. A variable that\'s never dragged onto the design (or has "keep" unchecked) stays in your data but never draws on the PDF and never blocks sending, even if some recipients have no value for it.',
    },
    {
      question: 'What does a default value do?',
      answer:
        'If you set a default value for a variable, any recipient whose row is blank for that field uses the default instead - so you only need to fill in exceptions, not every row.',
    },
    {
      question: 'What do the icons on this page mean?',
      answer:
        "The plus icon adds a design, recipient, or field. The pencil renames the batch. The checkmark marks the currently selected design. The three-dot menu opens a row's more-actions menu. The eye previews a certificate. The upload arrow sends a design image or CSV up; the download arrow pulls a generated PDF down. The paper plane sends certificates by email. The circular arrows are reissue/resend vs. revoke/unrevoke. The trash can deletes. The warning triangle flags a missing required value. The spinner shows work in progress. The back arrow goes back to the batches list, and the ban icon marks a revoked or blocked recipient.",
    },
    {
      question: 'What are the steps to generate a certificate?',
      answer:
        '1) Create a batch. 2) Choose or upload a design. 3) Add recipients, by CSV or manually - this is also where variables get defined. 4) Drag each variable onto the design and style its text. 5) Issue certificates (renders the PDFs, no email) and/or Send them (renders and emails). 6) Track delivery status, and resend or revoke as needed.',
    },
    {
      question: "What's the difference between Issue and Send?",
      answer:
        'Issue only renders and stores each certificate as a PDF - no email goes out. Send does the same render, then also emails it. This lets you have certificates ready to view or download (e.g. linked from an event page) well before, or entirely without, emailing anyone.',
    },
    {
      question: 'What happens if I revoke or delete a recipient or batch?',
      answer:
        "Revoke is reversible and immediately hides the certificate from its public verify page and profile listing - you can unrevoke it later. Delete is permanent: if the recipient or batch was ever sent, deleting it revokes it first, so it can't quietly become public again if it's ever restored.",
    },
    {
      question: "Can I change the design after I've already sent certificates?",
      answer:
        "Yes. Swapping the design only affects certificates generated or sent after the change - any PDF that's already been issued stays exactly as it was.",
    },
    {
      question: 'What happens if a recipient is missing a required value?',
      answer:
        "Before sending, you'll be shown which recipients are missing a value that would render blank on their certificate. You can choose to skip just those recipients, or proceed anyway and send them with that field left empty.",
    },
  ];

  private destroy$ = new Subject<void>();
  private community: ICommunity;

  constructor(
    private route: ActivatedRoute,
    private certificateBatchService: CertificateBatchService,
    private toastLogService: LibToastLogService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.seoService.noIndex(true);
    this.route.parent.parent.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.community = data.community;
      this.setMeta();
    });
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const batchUuid = params.get('batch_uuid');
      this.fetchBatch(batchUuid);
    });
  }

  ngOnDestroy() {
    this.seoService.noIndex(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchBatch(batchUuid: string) {
    this.isLoading = true;
    this.certificateBatchService
      .fetchCertificateBatch(batchUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe((batch) => {
        this.batch = batch;
        this.isLoading = false;
        this.setMeta();
      });
  }

  private setMeta() {
    if (!this.batch || !this.community) {
      return;
    }
    this.seoService.setTitle(`${this.batch.name} | Certificates | Dashboard | ${this.community.name}`);
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

  get progressPercent(): number {
    if (!this.batch?.recipients_count) {
      return 0;
    }
    return (this.batch.sent_count / this.batch.recipients_count) * 100;
  }

  startEditName() {
    this.editedName = this.batch.name;
    this.isEditingName = true;
  }

  cancelEditName() {
    this.isEditingName = false;
  }

  saveName() {
    const name = this.editedName?.trim();
    if (!name || name === this.batch.name) {
      this.isEditingName = false;
      return;
    }
    this.isSavingName = true;
    this.certificateBatchService
      .updateCertificateBatch(this.batch.uuid, { name })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.batch.name = updated.name;
          this.isSavingName = false;
          this.isEditingName = false;
        },
        error: () => {
          this.isSavingName = false;
          this.toastLogService.errorDialog('Could not rename the batch');
        },
      });
  }

  // Merges rather than reassigns `this.batch` - every section binds
  // [batch]="batch", so swapping the reference re-fires ngOnChanges
  // everywhere (a full recipients-table refetch/spinner flash, a canvas
  // Konva stage rebuild, etc.) even for an update as small as picking a
  // design. Centralizing the merge here means no individual emitter (design
  // picker, send panel, ...) has to remember to mutate-in-place itself -
  // whatever object they emit, it only ever gets folded into the one shared
  // instance.
  onBatchUpdated(batch: ICertificateBatch) {
    Object.assign(this.batch, batch);
  }

  onVariablesChanged() {
    // Refetch directly on the sibling components rather than replacing the
    // `batch` reference - every section binds [batch]="batch", so swapping
    // the reference re-fires ngOnChanges everywhere, causing a visible
    // flash. refreshVariablesList() (rather than fetchVariables()) avoids
    // canvas re-running initCanvas() and rebuilding the whole Konva stage
    // for a change that doesn't need it.
    this.recipientsTable?.fetchVariables();
    this.canvasComponent?.refreshVariablesList();
  }
}
