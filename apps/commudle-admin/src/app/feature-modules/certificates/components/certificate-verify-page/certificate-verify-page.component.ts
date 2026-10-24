import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { ICertificatePublicRecipient } from '@commudle/shared-models';
import { CertificateRecipientService, SeoService, ShareService } from '@commudle/shared-services';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import {
  faCalendarDays,
  faCircleCheck,
  faClock,
  faCopy,
  faDownload,
  faFileLines,
  faLandmark,
  faLink,
  faShareNodes,
  faShieldHalved,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';

@Component({
  selector: 'commudle-certificate-verify-page',
  standalone: true,
  imports: [
    CommonModule,
    CommudleCardModule,
    CommudleButtonModule,
    FontAwesomeModule,
    SharedComponentsModule,
    SharedPipesModule,
  ],
  templateUrl: './certificate-verify-page.component.html',
  styleUrls: ['./certificate-verify-page.component.scss'],
})
export class CertificateVerifyPageComponent implements OnInit, OnDestroy {
  recipient: ICertificatePublicRecipient | null = null;
  isLoading = true;
  notFound = false;
  verificationLink = '';
  verifiedOnLabel = '';
  pdfObjectUrl: string | null = null;
  icons = {
    faCalendarDays,
    faCircleCheck,
    faClock,
    faCopy,
    faDownload,
    faFileLines,
    faLandmark,
    faLink,
    faShareNodes,
    faShieldHalved,
    faUser,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private certificateRecipientService: CertificateRecipientService,
    private clipboard: Clipboard,
    private shareService: ShareService,
    private toastLogService: LibToastLogService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    this.certificateRecipientService
      .verifyCertificate(uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recipient) => {
          this.recipient = recipient;
          this.verificationLink = `${environment.app_url}/certificates/verify/${recipient.uuid}`;
          this.verifiedOnLabel = this.formatVerifiedOn(new Date());
          this.isLoading = false;
          this.setMeta(recipient);
          if (recipient.pdf_url) {
            this.loadPdfPreview(recipient.uuid);
          }
        },
        error: () => {
          this.notFound = true;
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
    }
  }

  // Fetched as bytes rather than linked directly via `<object data>` -
  // a direct link is subject to the response's Content-Disposition and
  // X-Frame-Options headers, neither of which apply to a JS-level fetch.
  // Same pattern as certificate-recipient-preview-dialog.
  private loadPdfPreview(uuid: string) {
    this.certificateRecipientService
      .downloadCertificatePdf(uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.pdfObjectUrl = URL.createObjectURL(blob);
        },
        error: () => {
          this.toastLogService.errorDialog('Could not load the certificate preview');
        },
      });
  }

  private setMeta(recipient: ICertificatePublicRecipient) {
    const namePart = recipient.recipient_name ? `${recipient.recipient_name} - ` : '';
    const title = `${namePart}Certificate - ${recipient.title} | Commudle`;

    let description = `Certificate of ${recipient.title}`;
    if (recipient.recipient_name) {
      description += ` issued to ${recipient.recipient_name}`;
    }
    if (recipient.issuer?.name) {
      description += ` by ${recipient.issuer.name}`;
    }
    if (recipient.issued_on) {
      description += ` on ${moment(recipient.issued_on).format('MMM D, YYYY')}`;
    }
    description += '. Verified on Commudle.';

    this.seoService.setTags(title, description, recipient.thumbnail_url || undefined);
    this.seoService.setSchema({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: recipient.recipient_name || undefined,
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        name: recipient.title,
        url: this.verificationLink,
        dateCreated: recipient.issued_on || undefined,
        recognizedBy: recipient.issuer?.name ? { '@type': 'Organization', name: recipient.issuer.name } : undefined,
        image: recipient.thumbnail_url || undefined,
      },
    });
  }

  private formatVerifiedOn(date: Date): string {
    const datePart = moment(date).format('MMM D, YYYY · h:mm A');
    const tzName = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value;
    return tzName ? `${datePart} (${tzName})` : datePart;
  }

  copyToClipboard(text: string) {
    if (this.clipboard.copy(text)) {
      this.toastLogService.successDialog('Copied to clipboard');
    }
  }

  shareCertificate() {
    if (!this.recipient) {
      return;
    }
    if (!this.shareService.canShare()) {
      this.copyToClipboard(this.verificationLink);
      return;
    }
    this.shareService
      .share({
        title: `${this.recipient.recipient_name || 'Certificate'} - ${this.recipient.title}`,
        url: this.verificationLink,
      })
      .then(() => {
        this.toastLogService.successDialog('Shared successfully');
      });
  }
}
