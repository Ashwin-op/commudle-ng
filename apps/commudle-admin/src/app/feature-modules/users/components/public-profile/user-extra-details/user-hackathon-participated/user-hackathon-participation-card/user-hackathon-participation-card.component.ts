import { Component, Input } from '@angular/core';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { faCode, faCalendarAlt, faUsers } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-user-hackathon-participation-card',
  templateUrl: './user-hackathon-participation-card.component.html',
  styleUrls: ['./user-hackathon-participation-card.component.scss'],
  standalone: false,
})
export class UserHackathonParticipationCardComponent {
  @Input() hackathon: IHackathon;

  faCode = faCode;
  faCalendarAlt = faCalendarAlt;
  faUsers = faUsers;
}
