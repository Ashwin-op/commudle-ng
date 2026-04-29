import { CommonModule } from '@angular/common';
import { Component, Input, HostBinding } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NbIconModule } from '@commudle/theme';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, NbIconModule, FontAwesomeModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
})
export class BadgeComponent {
  @Input() text: string | number;
  @Input() fontSize: 'small' | 'x-small' | 'xx-small' | 'regular';
  @Input() color = 'com-bg-Bright-Gray';
  @Input() fontColor = 'com-text-tWhite';
  @Input() nbIcon: string;
  @Input() faIcon: any;
  @Input() dotMode: boolean;
  @Input() position: 'top right' | 'top left' | 'right center' | 'left center' | 'center right' | 'center left';
  @Input() borderRadius: 'rectangle' | 'semi-round' | 'round' | 'full-round' = 'rectangle';

  // bg;

  @HostBinding('class')
  get themeClass(): string {
    return this.position || '';
  }
}
