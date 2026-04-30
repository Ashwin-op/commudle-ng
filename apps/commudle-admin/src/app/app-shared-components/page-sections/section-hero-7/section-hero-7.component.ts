import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { IHero7Config } from './section-hero-7.config';

@Component({
  selector: 'commudle-section-hero-7',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-hero-7.component.html',
  styleUrls: ['./section-hero-7.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHero7Component implements OnInit, OnDestroy {
  @Input({ required: true }) config!: IHero7Config;

  safeHeading: SafeHtml = '';

  private destroy$ = new Subject<void>();

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.safeHeading = this.sanitizer.bypassSecurityTrustHtml(this.config.heading);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
