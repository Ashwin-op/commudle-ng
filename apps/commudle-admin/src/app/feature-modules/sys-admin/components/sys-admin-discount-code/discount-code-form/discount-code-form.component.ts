import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EDbModels, EDiscountType, IDiscountCode } from '@commudle/shared-models';
import { DiscountCodesService, ToastrService } from '@commudle/shared-services';
import { NbDialogRef } from '@commudle/theme';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import * as moment from 'moment';

@Component({
  selector: 'commudle-discount-code-form',
  templateUrl: './discount-code-form.component.html',
  styleUrls: ['./discount-code-form.component.scss'],
})
export class DiscountCodeFormComponent implements OnInit {
  @Input() discountCode?: IDiscountCode;
  @Input() modelType: EDbModels = EDbModels.CAMPAIGN;
  @Input() isEdit = false;

  discountCodeForm!: FormGroup;
  isSubmitting = false;

  // Constants and enums
  readonly EDiscountType = EDiscountType;
  readonly EDbModels = EDbModels;

  // Icons
  readonly icons = {
    faClose,
  };

  constructor(
    private fb: FormBuilder,
    private discountCodesService: DiscountCodesService,
    private dialogRef: NbDialogRef<DiscountCodeFormComponent>,
    private toastrService: ToastrService,
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.isEdit && this.discountCode) {
      this.patchFormValues();
    }
  }

  initForm(): void {
    this.discountCodeForm = this.fb.group({
      code: ['', [Validators.required]],
      discount_type: [EDiscountType.PERCENTAGE, [Validators.required]],
      discount_value: [null, [Validators.required, Validators.min(1)]],
      object_type: [this.modelType, [Validators.required]],
      is_limited: [false],
      max_limit: [{ value: null, disabled: true }],
      min_users_count: [null, [Validators.min(0)]],
      max_users_count: [null, [Validators.min(1)]],
      expires_at: [null],
    });

    // Add conditional validation for max_limit
    this.discountCodeForm.get('is_limited')?.valueChanges.subscribe((isLimited) => {
      const maxLimitControl = this.discountCodeForm.get('max_limit');

      if (maxLimitControl) {
        if (isLimited) {
          maxLimitControl.setValidators([Validators.required, Validators.min(1)]);
          maxLimitControl.enable();
        } else {
          maxLimitControl.clearValidators();
          maxLimitControl.disable();
        }

        maxLimitControl.updateValueAndValidity();
      }
    });

    // Add conditional validation for discount_value based on discount_type
    this.discountCodeForm.get('discount_type')?.valueChanges.subscribe((type) => {
      const discountValueControl = this.discountCodeForm.get('discount_value');

      if (discountValueControl) {
        if (type === EDiscountType.PERCENTAGE) {
          discountValueControl.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
        } else {
          discountValueControl.setValidators([Validators.required, Validators.min(1)]);
        }

        discountValueControl.updateValueAndValidity();
      }
    });
  }

  patchFormValues(): void {
    if (!this.discountCode) return;

    // Format date for datetime-local input
    let expiryDate = null;
    if (this.discountCode.expires_at) {
      const date = new Date(this.discountCode.expires_at);
      expiryDate = this.formatDateForInput(date);
    }

    this.discountCodeForm.patchValue({
      code: this.discountCode.code,
      discount_type: this.discountCode.discount_type,
      discount_value:
        this.discountCode.discount_type === EDiscountType.FIXED_AMOUNT
          ? this.discountCode.discount_value / 100
          : this.discountCode.discount_value,
      object_type: this.discountCode.object_type || this.modelType,
      max_limit: this.discountCode.max_limit,
      min_users_count: this.discountCode.min_users_count,
      max_users_count: this.discountCode.max_users_count,
      expires_at: expiryDate,
    });
  }

  onSubmit(): void {
    if (this.discountCodeForm.invalid) return;

    // Ensure code is uppercase before submitting
    const codeControl = this.discountCodeForm.get('code');
    const expireAtControl = this.discountCodeForm.get('expires_at');
    const discountTypeControl = this.discountCodeForm.get('discount_type');
    const discountValueControl = this.discountCodeForm.get('discount_value');
    if (codeControl && codeControl.value) {
      codeControl.setValue(codeControl.value.toUpperCase());
    }

    this.discountCodeForm.patchValue({
      expires_at: moment(expireAtControl.value).local(),
    });

    if (discountTypeControl && discountTypeControl.value === EDiscountType.FIXED_AMOUNT) {
      discountValueControl.setValue(discountValueControl.value * 100);
    }

    this.isSubmitting = true;

    if (this.isEdit && this.discountCode) {
      this.updateDiscountCode();
    } else {
      this.createDiscountCode();
    }
  }

  createDiscountCode(): void {
    this.discountCodesService.createDiscountCode({ discount_code: this.discountCodeForm.value }).subscribe((data) => {
      this.toastrService.successDialog('Discount code created successfully');
      this.dialogRef.close(data);
    });
  }

  updateDiscountCode(): void {
    this.discountCodesService
      .updateDiscountCodes({ discount_code: this.discountCodeForm.value }, this.discountCode.id)
      .subscribe((data) => {
        this.toastrService.successDialog('Discount code updated successfully');
        this.dialogRef.close(data);
      });
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  convertToUppercase(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase();
    this.discountCodeForm.get('code').setValue(value, { emitEvent: false });
  }

  closeDialog(): void {
    this.dialogRef.close(false);
  }
}
