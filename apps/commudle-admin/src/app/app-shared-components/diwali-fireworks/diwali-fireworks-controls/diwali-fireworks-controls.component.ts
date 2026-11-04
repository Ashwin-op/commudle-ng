import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Inject, Input, PLATFORM_ID } from '@angular/core';
import { NbButtonModule, NbIconModule } from '@commudle/theme';
import { SeoService } from 'apps/shared-services/seo.service';
import { DiwaliFireworksService } from '../diwali-fireworks.service';

// Replay and sound buttons for the Diwali fireworks, stacked above the chat button (bottom right).
@Component({
  selector: 'commudle-diwali-fireworks-controls',
  standalone: true,
  imports: [CommonModule, NbButtonModule, NbIconModule],
  templateUrl: './diwali-fireworks-controls.component.html',
  styleUrls: ['./diwali-fireworks-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiwaliFireworksControlsComponent {
  // True while the chat button is on screen, so the buttons sit above it instead of in its place.
  @Input() @HostBinding('class.above-chat') aboveChat = false;

  // Same checks as the fireworks canvas: nothing would play for bots, SSR or reduced-motion visitors.
  readonly visible: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    seoService: SeoService,
    readonly diwaliFireworksService: DiwaliFireworksService,
  ) {
    this.visible =
      isPlatformBrowser(platformId) &&
      !seoService.isBot &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
