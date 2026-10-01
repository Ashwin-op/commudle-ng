import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { UserProfileMenuService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-menu.service';
import { ICertificatePublicRecipient, IUser } from '@commudle/shared-models';
import { CertificateRecipientService } from '@commudle/shared-services';
import { faCertificate, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-certificates',
  templateUrl: './user-certificates.component.html',
  styleUrls: ['./user-certificates.component.scss'],
  standalone: false,
})
export class UserCertificatesComponent implements OnChanges, OnDestroy {
  @Input() user: IUser;

  certificates: ICertificatePublicRecipient[] = [];
  isLoading = true;
  icons = { faCertificate };
  faHashtag = faHashtag;

  private subscriptions: Subscription[] = [];

  constructor(
    private certificateRecipientService: CertificateRecipientService,
    private userProfileMenuService: UserProfileMenuService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.user) {
      this.fetchCertificates();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  fetchCertificates(): void {
    this.subscriptions.push(
      this.certificateRecipientService.indexPublicCertificates(this.user.username).subscribe((res) => {
        this.certificates = res.values;
        this.isLoading = false;
        this.userProfileMenuService.addMenuItem('certificates', this.certificates.length > 0);
      }),
    );
  }

  certificateViewUrl(certificate: ICertificatePublicRecipient): string {
    return `/certificates/verify/${certificate.uuid}`;
  }
}
