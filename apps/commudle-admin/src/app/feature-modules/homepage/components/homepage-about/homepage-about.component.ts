import { Component } from '@angular/core';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-homepage-about',
  templateUrl: './homepage-about.component.html',
  styleUrls: ['./homepage-about.component.scss'],
  standalone: false,
})
export class HomepageAboutComponent {
  faHashtag = faHashtag;
}
