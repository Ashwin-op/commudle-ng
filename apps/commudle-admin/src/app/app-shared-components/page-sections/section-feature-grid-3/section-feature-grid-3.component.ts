import { ChangeDetectionStrategy, Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { resolveSectionIcon } from '../shared/section-icons';
import { IFeatureGrid3Config } from './section-feature-grid-3.config';

@Component({
  selector: 'commudle-section-feature-grid-3',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './section-feature-grid-3.component.html',
  styleUrls: ['./section-feature-grid-3.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionFeatureGrid3Component implements OnDestroy {
  @Input({ required: true }) config!: IFeatureGrid3Config;

  /** Fragment-link permalink icon — see `.november/rules/section-fragment-links.md`. */
  readonly faHashtag = faHashtag;

  private destroy$ = new Subject<void>();

  iconFor(key: string): IconDefinition {
    return resolveSectionIcon(key);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
