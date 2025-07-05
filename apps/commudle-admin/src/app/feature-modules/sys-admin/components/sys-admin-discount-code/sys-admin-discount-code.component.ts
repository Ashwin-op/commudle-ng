import { Component, OnInit } from '@angular/core';
import { EDbModels, IDiscountCode, EDiscountType } from '@commudle/shared-models';
import { DiscountCodesService, ToastrService } from '@commudle/shared-services';
import { faAdd, faEdit, faTrash, faTicket, faCopy } from '@fortawesome/free-solid-svg-icons';
import { NbDialogService } from '@commudle/theme';
import { finalize } from 'rxjs/operators';
import { DiscountCodeFormComponent } from './discount-code-form/discount-code-form.component';
import * as moment from 'moment';

@Component({
  selector: 'commudle-sys-admin-discount-code',
  templateUrl: './sys-admin-discount-code.component.html',
  styleUrls: ['./sys-admin-discount-code.component.scss'],
})
export class SysAdminDiscountCodeComponent implements OnInit {
  discountCodes: IDiscountCode[] = [];
  isLoading = false;
  selectedModelType: EDbModels = EDbModels.CAMPAIGN;

  // Constants and enums
  readonly EDbModels = EDbModels;
  readonly EDiscountType = EDiscountType;

  // Icons
  readonly icons = {
    faAdd,
    faEdit,
    faTrash,
    faTicket,
    faCopy,
  };

  readonly moment = moment;

  constructor(
    private discountCodesService: DiscountCodesService,
    private dialogService: NbDialogService,
    private toastrService: ToastrService,
  ) {}

  ngOnInit(): void {
    this.getDiscountCodes();
  }

  onModelTypeChange(): void {
    this.getDiscountCodes();
  }

  getDiscountCodes(): void {
    this.isLoading = true;

    this.discountCodesService
      .indexByParentOrObject(0, this.selectedModelType, false)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((data) => {
        this.discountCodes = data;
      });
  }

  openCreateForm(): void {
    this.dialogService
      .open(DiscountCodeFormComponent, {
        context: {
          modelType: this.selectedModelType,
        },
        closeOnBackdropClick: false,
        closeOnEsc: true,
      })
      .onClose.subscribe((discountCode) => {
        if (discountCode) {
          this.discountCodes.unshift(discountCode);
        }
      });
  }

  editDiscountCode(code: IDiscountCode, index): void {
    this.dialogService
      .open(DiscountCodeFormComponent, {
        context: {
          discountCode: code,
          modelType: this.selectedModelType,
          isEdit: true,
        },
        closeOnBackdropClick: false,
        closeOnEsc: true,
      })
      .onClose.subscribe((discountCode) => {
        if (discountCode) {
          this.discountCodes[index] = discountCode;
        }
      });
  }

  deleteDiscountCode(id: number, index): void {
    if (confirm('Are you sure you want to delete this discount code? This action cannot be undone.')) {
      this.discountCodesService.destroy(id).subscribe((data) => {
        if (data) {
          this.discountCodes.splice(index, 1);
          this.toastrService.successDialog('Discount code deleted successfully');
        }
      });
    }
  }

  isExpired(code: IDiscountCode): boolean {
    if (!code.expires_at) return false;
    return new Date(code.expires_at) < new Date();
  }

  copyToClipboard(code: string): void {
    navigator.clipboard.writeText(code).then(
      () => {
        this.toastrService.successDialog('Discount code copied to clipboard');
      },
      (err) => {
        this.toastrService.errorDialog('Failed to copy discount code', err);
      },
    );
  }
}
