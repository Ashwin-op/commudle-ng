import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SysAdminPageAdsService } from 'apps/commudle-admin/src/app/feature-modules/sys-admin/services/sys-admin-page-ads.service';
import { IAttachedFile } from 'apps/shared-models/attached-file.model';
import { IPageAd } from 'apps/shared-models/page-ad.model';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import * as moment from 'moment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-pa-slots-form',
  templateUrl: './admin-page-ads-form.component.html',
  styleUrls: ['./admin-page-ads-form.component.scss'],
  standalone: false,
})
export class AdminPageAdsFormComponent implements OnInit, OnDestroy {
  pageAd: IPageAd;
  pageAdForm: FormGroup;
  uploadedFiles: IAttachedFile[] = [];

  subscriptions: Subscription[] = [];

  @ViewChild('inputFile') inputFile: ElementRef;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private libToastLogService: LibToastLogService,
    private sysAdminPageAdsService: SysAdminPageAdsService,
  ) {
    this.pageAdForm = this.fb.group(
      {
        title: ['', Validators.required],
        content: ['', Validators.required],
        link: ['', [Validators.required, this.externalLinkValidator()]],
        external_link: [true, Validators.required],
        is_default: [false, Validators.required],
        slot: ['', Validators.required],
        iframe: ['', this.iframeValidator()],
        start_at: [''],
        end_at: [''],
      },
      { validators: this.checkDates },
    );
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((params) => {
        this.getPageAd(+params.pageAdId || 0);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((value) => value.unsubscribe());
  }

  checkDates(group: FormGroup): null | { notValid: true } {
    if (group.controls.start_at.value > group.controls.end_at.value) {
      return { notValid: true };
    }
    return null;
  }

  getPageAd(pageAdId: number): void {
    if (pageAdId > 0) {
      this.subscriptions.push(
        this.sysAdminPageAdsService.getAdById(pageAdId).subscribe((value) => {
          this.pageAd = value;
          this.prefillPageAd();
        }),
      );
    }
  }

  prefillPageAd(): void {
    this.pageAdForm.patchValue({
      title: this.pageAd.title,
      content: this.pageAd.content,
      link: this.pageAd.link,
      external_link: this.pageAd.external_link,
      is_default: this.pageAd.is_default,
      slot: this.pageAd.slot,
      iframe: this.pageAd.iframe,
    });

    // Patch dates
    if (this.pageAd.start_at) {
      this.pageAdForm.patchValue({
        start_at: moment.parseZone(this.pageAd.start_at).local().format().slice(0, -6),
      });
    }
    if (this.pageAd.end_at) {
      this.pageAdForm.patchValue({
        end_at: moment.parseZone(this.pageAd.end_at).local().format().slice(0, -6),
      });
    }

    // Patch files
    for (const file of this.pageAd.files) {
      this.uploadedFiles.push({
        id: file.id,
        file: null,
        url: file.url,
        name: file.filename,
        type: null,
      });
    }
  }

  addFiles(event: Event): void {
    const fileList: FileList = (event.target as HTMLInputElement).files;
    const inputFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      inputFiles.push(fileList.item(i));
    }
    // Check if total file size is less than 2MB
    if (inputFiles?.map((file) => file.size).reduce((a: number, b: number) => a + b, 0) > 2425190) {
      this.libToastLogService.warningDialog('Files should be less than 2MB', 3000);
    } else {
      if (inputFiles?.length > 0) {
        for (const file of inputFiles) {
          const iAttachedFile: IAttachedFile = {
            id: null,
            file,
            url: null,
            name: null,
            type: null,
          };
          this.uploadedFiles.push(iAttachedFile);
        }
      }
    }
  }

  deleteFile(index: number): void {
    if (this.uploadedFiles[index].id) {
      this.uploadedFiles[index]['delete'] = true;
    } else {
      this.uploadedFiles.splice(index, 1);
    }

    this.inputFile.nativeElement.value = '';
  }

  submitForm(): void {
    if (!this.pageAd) {
      this.createPageAd();
    } else {
      this.updatePageAd();
    }
  }

  createPageAd(): void {
    this.subscriptions.push(
      this.sysAdminPageAdsService.createAd(this.buildFormData()).subscribe(() => {
        this.router.navigate(['/sys-admin', 'pa']).then(
          () => {
            this.libToastLogService.successDialog('Created ad successfully!');
          },
          () => {},
        );
      }),
    );
  }

  updatePageAd(): void {
    this.subscriptions.push(
      this.sysAdminPageAdsService.updateAd(this.buildFormData(), this.pageAd.id).subscribe(() => {
        this.router.navigate(['/sys-admin', 'pa']).then(
          () => {
            this.libToastLogService.successDialog('Updated ad successfully!');
          },
          () => {},
        );
      }),
    );
  }

  buildFormData(): FormData {
    const formData: FormData = new FormData();
    const pageAdFormValue = this.pageAdForm.value;

    Object.keys(pageAdFormValue).forEach((value) => {
      if (pageAdFormValue[value]) {
        if (['start_at', 'end_at'].includes(value)) {
          const time = pageAdFormValue[value] + this.getTimeZone();
          formData.append(`page_ad[${value}]`, moment.parseZone(time).utc().format());
        } else {
          formData.append(`page_ad[${value}]`, pageAdFormValue[value]);
        }
      }
    });

    this.uploadedFiles.forEach((item) => {
      Object.keys(item).forEach((value) => {
        formData.append(`page_ad[attachments][][${value}]`, item[value]);
      });
    });

    return formData;
  }

  getTimeZone(): string {
    const offset = new Date().getTimezoneOffset();
    const off = Math.abs(offset);
    return (offset < 0 ? '+' : '-') + ('00' + Math.floor(off / 60)).slice(-2) + ':' + ('00' + (off % 60)).slice(-2);
  }

  private externalLinkValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').trim();
      if (!value) {
        return null;
      }

      try {
        const parsed = new URL(value);
        return ['http:', 'https:', 'ftp:', 'file:'].includes(parsed.protocol) ? null : { invalidExternalLink: true };
      } catch {
        return { invalidExternalLink: true };
      }
    };
  }

  private iframeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = (control.value || '').trim();
      if (!value) {
        return null;
      }

      const template = document.createElement('template');
      template.innerHTML = value;
      const firstNode = template.content.firstElementChild;
      const hasOnlyOneElement = template.content.children.length === 1;
      const isIframe = firstNode?.tagName.toLowerCase() === 'iframe';

      return hasOnlyOneElement && isIframe ? null : { invalidIframe: true };
    };
  }
}
