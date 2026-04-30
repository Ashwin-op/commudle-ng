import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { NbButtonModule } from '@commudle/theme';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { IHero8Config } from './section-hero-8.config';

@Component({
  selector: 'commudle-section-hero-8',
  standalone: true,
  imports: [CommonModule, RouterModule, NbButtonModule, FontAwesomeModule],
  templateUrl: './section-hero-8.component.html',
  styleUrls: ['./section-hero-8.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHero8Component implements OnInit, OnDestroy {
  @Input({ required: true }) config!: IHero8Config;

  safeLine1: SafeHtml = '';
  safeLine2: SafeHtml = '';

  readonly icons = { faTrophy };

  private destroy$ = new Subject<void>();

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.safeLine1 = this.sanitizer.bypassSecurityTrustHtml(this.config.headingLine1);
    this.safeLine2 = this.sanitizer.bypassSecurityTrustHtml(this.config.headingLine2);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
