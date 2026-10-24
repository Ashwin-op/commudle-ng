import { Component } from '@angular/core';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'commudle-public-page-signup-newsletter',
  templateUrl: './public-page-signup-newsletter.component.html',
  styleUrls: ['./public-page-signup-newsletter.component.scss'],
  standalone: false,
})
export class PublicPageSignupNewsletterComponent {
  faHashtag = faHashtag;
}
