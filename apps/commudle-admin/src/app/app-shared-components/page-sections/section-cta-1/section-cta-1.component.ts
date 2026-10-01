import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { NbButtonModule } from '@commudle/theme';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHashtag, faRocket } from '@fortawesome/free-solid-svg-icons';
import { ICta1Config } from './section-cta-1.config';

@Component({
  selector: 'commudle-section-cta-1',
  standalone: true,
  imports: [CommonModule, RouterModule, NbButtonModule, FontAwesomeModule],
  templateUrl: './section-cta-1.component.html',
  styleUrls: ['./section-cta-1.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCta1Component implements OnDestroy {
  @Input({ required: true }) config!: ICta1Config;

  /** Emitted when the primary CTA is clicked and no `routerLink` was configured. */
  @Output() primaryCtaClick = new EventEmitter<void>();

  /** Fragment-link permalink icon — see `.november/rules/section-fragment-links.md`. */
  readonly faHashtag = faHashtag;

  /** Large background watermark icon — ties "launch" copy to a literal rocket. */
  readonly faRocket = faRocket;

  private destroy$ = new Subject<void>();

  onPrimaryClick(): void {
    if (!this.config.primaryCta.routerLink) {
      this.primaryCtaClick.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
