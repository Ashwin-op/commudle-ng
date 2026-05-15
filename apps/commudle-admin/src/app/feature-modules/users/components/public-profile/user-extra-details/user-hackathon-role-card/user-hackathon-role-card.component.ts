import { Component, Input } from '@angular/core';
import { faCalendarAlt, faStar } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@commudle/shared-environments';
import { IHackathon } from '@commudle/shared-models';

@Component({
  selector: 'commudle-user-hackathon-role-card',
  templateUrl: './user-hackathon-role-card.component.html',
  styleUrls: ['./user-hackathon-role-card.component.scss'],
  standalone: false,
})
export class UserHackathonRoleCardComponent {
  @Input() hackathon: IHackathon;
  @Input() roleLabel: string;
  @Input() roleIcon: IconDefinition;
  @Input() roleKey: string;
  @Input() prizes: string[] = [];

  placeholderImage = environment.base_url + '/icons/hackathon-icon-primary.svg';
  icons = { faCalendarAlt, faStar };
}
