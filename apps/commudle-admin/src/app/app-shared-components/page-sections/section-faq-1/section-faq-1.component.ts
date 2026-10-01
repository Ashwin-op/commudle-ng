import { ChangeDetectionStrategy, Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { SharedComponentsModule } from '@commudle/shared-components';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { IFaq1Config } from './section-faq-1.config';

@Component({
  selector: 'commudle-section-faq-1',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedComponentsModule, FontAwesomeModule],
  templateUrl: './section-faq-1.component.html',
  styleUrls: ['./section-faq-1.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionFaq1Component implements OnDestroy {
  @Input({ required: true }) config!: IFaq1Config;

  readonly icons = { faArrowRight, faHashtag };

  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
