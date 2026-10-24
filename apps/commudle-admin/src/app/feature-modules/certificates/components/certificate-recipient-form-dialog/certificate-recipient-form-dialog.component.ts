import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService, NbInputModule } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { ECertificateRecipientStatus, ICertificateRecipient, ICertificateVariable } from '@commudle/shared-models';
import { CertificateRecipientService, CertificateVariableService } from '@commudle/shared-services';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import { forkJoin, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { openCertificateConfirmDialog } from '../certificate-confirm-dialog/certificate-confirm-dialog.component';

const ISSUED_STATUSES = [
  ECertificateRecipientStatus.GENERATED,
  ECertificateRecipientStatus.SENT,
  ECertificateRecipientStatus.DELIVERED,
];

@Component({
  selector: 'commudle-certificate-recipient-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommudleCardModule,
    CommudleButtonModule,
    NbInputModule,
    FontAwesomeModule,
    SharedComponentsModule,
  ],
  templateUrl: './certificate-recipient-form-dialog.component.html',
  styleUrls: ['./certificate-recipient-form-dialog.component.scss'],
})
export class CertificateRecipientFormDialogComponent implements OnInit, OnDestroy {
  @Input() certificateBatchId: string;
  @Input() variables: ICertificateVariable[] = [];
  @Input() recipient: ICertificateRecipient | null = null;

  recipientForm: FormGroup;
  newFields: FormArray;
  isSaving = false;
  // Set once the PUT has succeeded but the follow-up reissue hasn't - the
  // details are already saved, so the button then only retries the reissue.
  savedRecipient: ICertificateRecipient | null = null;
  variablesAdded = false;
  destroy$ = new Subject<void>();
  icons = { faXmark, faPlus, faSpinner };

  constructor(
    private fb: FormBuilder,
    private dialogRef: NbDialogRef<CertificateRecipientFormDialogComponent>,
    private certificateRecipientService: CertificateRecipientService,
    private certificateVariableService: CertificateVariableService,
    private toastLogService: LibToastLogService,
    private dialogService: NbDialogService,
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // An issued certificate keeps its old PDF until generate_one re-renders
  // it, so saving an edit for one must also reissue.
  get reissuesOnSave(): boolean {
    return this.isEditMode && ISSUED_STATUSES.includes(this.recipient.status);
  }

  // Reissuing un-revokes server-side (generate_one clears revoked_at), so the
  // notice only applies where the save actually reissues.
  get revokedReissueNotice(): boolean {
    return this.reissuesOnSave && !!this.recipient.revoked_at;
  }

  get submitLabel(): string {
    if (!this.isEditMode) {
      return 'Add Recipient';
    }
    if (this.savedRecipient) {
      return 'Retry reissue';
    }
    return this.reissuesOnSave ? 'Save changes and reissue the certificate' : 'Save changes';
  }

  get isEditMode(): boolean {
    return !!this.recipient;
  }

  // `name` is a dual-purpose variable (see saveRecipient) - its value always
  // mirrors the fixed "Name" field above, so it gets no input of its own
  // here to avoid a confusing duplicate field.
  get positionableVariables(): ICertificateVariable[] {
    return this.variables.filter((variable) => variable.key !== 'name');
  }

  ngOnInit() {
    const rowValuesGroup: { [key: string]: [string] } = {};
    this.positionableVariables.forEach((variable) => {
      rowValuesGroup[variable.key] = [this.recipient?.row_values?.[variable.key] ?? ''];
    });

    this.newFields = this.fb.array([]);
    this.recipientForm = this.fb.group({
      email: [this.recipient?.email ?? '', [Validators.required, Validators.email]],
      name: [this.recipient?.name ?? ''],
      row_values: this.fb.group(rowValuesGroup),
      newFields: this.newFields,
    });

    if (this.isEditMode) {
      this.recipientForm.get('email').disable();
    }
  }

  addField() {
    this.newFields.push(
      this.fb.group({
        label: ['', Validators.required],
        value: [''],
      }),
    );
  }

  removeField(index: number) {
    this.newFields.removeAt(index);
  }

  onSubmit() {
    if (this.savedRecipient) {
      this.reissue(false);
      return;
    }
    if (this.recipientForm.invalid || this.newFields.invalid) {
      this.recipientForm.markAllAsTouched();
      this.newFields.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const newFieldValues = [...this.newFields.value, ...this.dualPurposeNameField()] as {
      label: string;
      value: string;
    }[];
    this.createNewFields(newFieldValues).subscribe({
      next: (createdVariables) => {
        this.saveRecipient(newFieldValues, createdVariables);
      },
      error: () => {
        this.isSaving = false;
        this.toastLogService.errorDialog('Could not add the new field(s)');
      },
    });
  }

  // Mirrors CSV upload's dual-purpose "name" column (Certificates::CsvUploadService):
  // `name` is copied onto the recipient AND becomes a positionable variable.
  // Only needs creating once per batch - if some earlier recipient (CSV or
  // manual) already established it, this is a no-op.
  private get hasNameVariable(): boolean {
    return this.variables.some((variable) => variable.key === 'name');
  }

  private dualPurposeNameField(): { label: string; value: string }[] {
    const name = this.recipientForm.value.name?.trim();
    if (!name || this.hasNameVariable) {
      return [];
    }
    return [{ label: 'Name', value: name }];
  }

  private createNewFields(newFieldValues: { label: string; value: string }[]) {
    if (newFieldValues.length === 0) {
      return of([] as ICertificateVariable[]);
    }
    return forkJoin(
      newFieldValues.map((field) =>
        this.certificateVariableService.createCertificateVariable(this.certificateBatchId, { label: field.label }),
      ),
    );
  }

  private saveRecipient(newFieldValues: { label: string; value: string }[], createdVariables: ICertificateVariable[]) {
    const formValue = this.recipientForm.getRawValue();
    const rowValues = { ...formValue.row_values };
    createdVariables.forEach((variable, index) => {
      rowValues[variable.key] = newFieldValues[index].value;
    });
    // Keep the positioned "name" variable's value in lockstep with the
    // fixed Name field above, whether it already existed or was just
    // created by dualPurposeNameField() - there's no separate input for it.
    if (this.hasNameVariable || createdVariables.some((variable) => variable.key === 'name')) {
      rowValues.name = formValue.name?.trim() ?? '';
    }

    const request = this.isEditMode
      ? this.certificateRecipientService.updateCertificateRecipient(this.certificateBatchId, this.recipient.id, {
          name: formValue.name,
          row_values: rowValues,
        })
      : this.certificateRecipientService.createCertificateRecipient(this.certificateBatchId, {
          email: formValue.email,
          name: formValue.name,
          row_values: rowValues,
        });

    request.subscribe({
      next: (recipient: ICertificateRecipient) => {
        this.variablesAdded = createdVariables.length > 0;
        if (this.reissuesOnSave) {
          this.savedRecipient = recipient;
          this.reissue(false);
          return;
        }
        this.isSaving = false;
        this.dialogRef.close({ recipient, variablesAdded: this.variablesAdded });
      },
      error: () => {
        this.isSaving = false;
        this.toastLogService.errorDialog('Could not save the recipient');
      },
    });
  }

  // Runs inline on the API side, so isSaving stays true (the button's
  // loading state) until the response arrives. A 422 with missing_keys goes
  // through the same confirm-and-retry as the table's generate flow.
  private reissue(confirmMissingValues: boolean) {
    this.isSaving = true;
    this.certificateRecipientService
      .generateOne(this.certificateBatchId, this.savedRecipient.id, confirmMissingValues)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recipient) => {
          this.isSaving = false;
          this.toastLogService.successDialog(`Reissued the certificate for ${recipient.email}`);
          this.dialogRef.close({ recipient, variablesAdded: this.variablesAdded });
        },
        error: (err) => {
          this.isSaving = false;
          const missingKeys: string[] | undefined = err?.error?.data?.missing_keys;
          if (missingKeys?.length && !confirmMissingValues) {
            openCertificateConfirmDialog(this.dialogService, {
              message: `${this.savedRecipient.email} is missing a value for: ${missingKeys.join(
                ', ',
              )}. Proceed anyway? The field will render blank.`,
            })
              .pipe(takeUntil(this.destroy$))
              .subscribe((confirmed) => {
                if (confirmed) {
                  this.reissue(true);
                }
              });
            return;
          }
          this.toastLogService.errorDialog(
            err?.error?.message
              ? `Your changes were saved, but the reissue failed: ${err.error.message}`
              : 'Your changes were saved, but the reissue failed. Use "Retry reissue" to try again.',
          );
        },
      });
  }

  close() {
    if (this.savedRecipient) {
      this.dialogRef.close({ recipient: this.savedRecipient, variablesAdded: this.variablesAdded });
      return;
    }
    this.dialogRef.close();
  }
}
