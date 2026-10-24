import { Component } from '@angular/core';
import { faCheck, faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'commudle-public-page-cta',
  templateUrl: './public-page-cta.component.html',
  styleUrls: ['./public-page-cta.component.scss'],
  standalone: false,
})
export class PublicPageCtaComponent {
  faCheck = faCheck;
  faHashtag = faHashtag;
}
