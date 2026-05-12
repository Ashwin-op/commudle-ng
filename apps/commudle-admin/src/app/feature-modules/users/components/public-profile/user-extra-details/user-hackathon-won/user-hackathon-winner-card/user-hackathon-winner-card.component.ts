import { Component, Input } from '@angular/core';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { faTrophy, faCalendarAlt, faStar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-user-hackathon-winner-card',
  templateUrl: './user-hackathon-winner-card.component.html',
  styleUrls: ['./user-hackathon-winner-card.component.scss'],
  standalone: false,
})
export class UserHackathonWinnerCardComponent {
  @Input() hackathon: IHackathon;
  @Input() prizes: string[] = [];

  faTrophy = faTrophy;
  faCalendarAlt = faCalendarAlt;
  faStar = faStar;
}
