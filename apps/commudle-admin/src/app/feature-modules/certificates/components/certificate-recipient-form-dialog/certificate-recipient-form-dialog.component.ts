import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbDialogRef, NbInputModule } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { ICertificateRecipient, ICertificateVariable } from '@commudle/shared-models';
import { CertificateRecipientService, CertificateVariableService } from '@commudle/shared-services';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { forkJoin, of } from 'rxjs';

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
export class CertificateRecipientFormDialogComponent implements OnInit {
  @Input() certificateBatchId: string;
  @Input() variables: ICertificateVariable[] = [];
  @Input() recipient: ICertificateRecipient | null = null;

  recipientForm: FormGroup;
  newFields: FormArray;
  isSaving = false;
  icons = { faXmark, faPlus };

  constructor(
    private fb: FormBuilder,
    private dialogRef: NbDialogRef<CertificateRecipientFormDialogComponent>,
    private certificateRecipientService: CertificateRecipientService,
    private certificateVariableService: CertificateVariableService,
    private toastLogService: LibToastLogService,
  ) {}

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
        this.isSaving = false;
        this.dialogRef.close({ recipient, variablesAdded: createdVariables.length > 0 });
      },
      error: () => {
        this.isSaving = false;
        this.toastLogService.errorDialog('Could not save the recipient');
      },
    });
  }

  close() {
    this.dialogRef.close();
  }
}
