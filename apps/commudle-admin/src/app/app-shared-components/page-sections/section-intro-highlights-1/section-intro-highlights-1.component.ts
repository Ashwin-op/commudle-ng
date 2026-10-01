import { ChangeDetectionStrategy, Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition, faHashtag, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { resolveSectionIcon } from '../shared/section-icons';
import { IIntroHighlights1Config } from './section-intro-highlights-1.config';

/**
 * Icon-badge colour rotation for the highlight list — cycles by index so a
 * config with any number of highlights still reads as varied and colourful
 * rather than repeating a single tint.
 */
const BADGE_PALETTE = ['highlight__icon--blue', 'highlight__icon--yellow', 'highlight__icon--red', 'highlight__icon--green'];

@Component({
  selector: 'commudle-section-intro-highlights-1',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './section-intro-highlights-1.component.html',
  styleUrls: ['./section-intro-highlights-1.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionIntroHighlights1Component implements OnDestroy {
  @Input({ required: true }) config!: IIntroHighlights1Config;

  /** Centred icon in the decorative illustration. */
  readonly illustrationIcon: IconDefinition = faLightbulb;

  /** Fragment-link permalink icon — see `.november/rules/section-fragment-links.md`. */
  readonly faHashtag = faHashtag;

  private destroy$ = new Subject<void>();

  iconFor(key: string): IconDefinition {
    return resolveSectionIcon(key);
  }

  paletteFor(index: number): string {
    return BADGE_PALETTE[index % BADGE_PALETTE.length];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
