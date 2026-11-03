import { ChangeDetectionStrategy, Component } from '@angular/core';

// A small lit diya (glow, flickering flame, rising embers, lamp). Purely decorative; size and
// placement are left to the parent.
@Component({
  selector: 'commudle-diwali-diya',
  standalone: true,
  templateUrl: './diwali-diya.component.html',
  styleUrls: ['./diwali-diya.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class DiwaliDiyaComponent {}
