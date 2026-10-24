import { Component } from '@angular/core';
import { faXTwitter, faYoutube, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { AwsS3Bucket, staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false,
})
export class FooterComponent {
  staticAssets = staticAssets;
  faYoutube = faYoutube;
  awsS3Bucket = AwsS3Bucket;
  faXTwitter = faXTwitter;
  faInstagram = faInstagram;
  faWhatsapp = faWhatsapp;

  showFooter$: Observable<boolean> = this.footerService.footerStatus$;
  showMiniFooter$: Observable<boolean> = this.footerService.miniFooterStatus$;

  constructor(private footerService: FooterService) {}
}
