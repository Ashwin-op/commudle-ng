import { ChangeDetectionStrategy, Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { resolveSectionIcon } from '../shared/section-icons';
import { ISteps1Config } from './section-steps-1.config';

/**
 * Per-step colour rotation — deliberately *not* the site's primary blue
 * (already heavily used everywhere else on the page: hero, glow, the
 * feature-grid-3 cards). Progresses green → yellow → orange → red, reading
 * as rising intensity toward "done" rather than four arbitrary colours.
 * Cycles by index so any step count still gets a colour.
 */
const STEP_PALETTE = ['green', 'yellow', 'orange', 'red'];

@Component({
  selector: 'commudle-section-steps-1',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './section-steps-1.component.html',
  styleUrls: ['./section-steps-1.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSteps1Component implements OnDestroy {
  @Input({ required: true }) config!: ISteps1Config;

  /** Fragment-link permalink icon — see `.november/rules/section-fragment-links.md`. */
  readonly faHashtag = faHashtag;

  private destroy$ = new Subject<void>();

  iconFor(key: string): IconDefinition {
    return resolveSectionIcon(key);
  }

  /** Colour-rotation keyword shared by the numbered badge and the icon badge (same index → same colour). */
  colorFor(index: number): string {
    return STEP_PALETTE[index % STEP_PALETTE.length];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
