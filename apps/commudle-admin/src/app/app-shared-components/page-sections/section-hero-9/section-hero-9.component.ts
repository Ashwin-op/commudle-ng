import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { NbButtonModule, NbCardModule, NbDialogService } from '@commudle/theme';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition, faCirclePlay } from '@fortawesome/free-solid-svg-icons';
import gsap from 'gsap';
import { resolveSectionIcon } from '../shared/section-icons';
import { IHero9Config } from './section-hero-9.config';

/**
 * Corner position classes for floating accents — cycled through by index so
 * up to 4 accents spread around the photo instead of stacking. See
 * `.floating-accent--pos-*` in the stylesheet.
 */
const FLOATING_POSITION_CLASSES = [
  'floating-accent--pos-1',
  'floating-accent--pos-2',
  'floating-accent--pos-3',
  'floating-accent--pos-4',
];

@Component({
  selector: 'commudle-section-hero-9',
  standalone: true,
  imports: [CommonModule, RouterModule, NbButtonModule, NbCardModule, FontAwesomeModule],
  templateUrl: './section-hero-9.component.html',
  styleUrls: ['./section-hero-9.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHero9Component implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) config!: IHero9Config;

  /** Emitted when the primary CTA is clicked and no `routerLink` was configured. */
  @Output() primaryCtaClick = new EventEmitter<void>();

  @ViewChild('videoDialog') videoDialog!: TemplateRef<unknown>;

  /** The floating icon/text accents around the photo — see animateFloatingAccents(). */
  @ViewChildren('floatingAccent') private floatingAccentRefs?: QueryList<ElementRef<HTMLElement>>;

  readonly icons = { faCirclePlay };

  safeLine1: SafeHtml = '';
  safeLine2: SafeHtml = '';
  safeVideoUrl: SafeResourceUrl | null = null;

  private destroy$ = new Subject<void>();
  private floatTweens: gsap.core.Tween[] = [];

  constructor(private readonly sanitizer: DomSanitizer, private readonly dialogService: NbDialogService) {}

  ngOnInit(): void {
    this.safeLine1 = this.sanitizer.bypassSecurityTrustHtml(this.config.headingLine1);
    this.safeLine2 = this.sanitizer.bypassSecurityTrustHtml(this.config.headingLine2);
    if (this.config.videoCta?.videoUrl) {
      this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.config.videoCta.videoUrl);
    }
  }

  ngAfterViewInit(): void {
    this.animateFloatingAccents();
  }

  ngOnDestroy(): void {
    this.floatTweens.forEach((tween) => tween.kill());
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPrimaryClick(): void {
    if (!this.config.primaryCta.routerLink) {
      this.primaryCtaClick.emit();
    }
  }

  openVideo(): void {
    this.dialogService.open(this.videoDialog, { closeOnBackdropClick: true, closeOnEsc: true });
  }

  iconFor(key: string): IconDefinition {
    return resolveSectionIcon(key);
  }

  positionFor(index: number): string {
    return FLOATING_POSITION_CLASSES[index % FLOATING_POSITION_CLASSES.length];
  }

  /**
   * Gives each floating accent its own slow, independent up/down drift via
   * GSAP — opacity + transform only. Each tween gets a different duration
   * and start delay (derived from its index) so the group reads as loose,
   * organic motion rather than everything bobbing in lockstep. Skipped
   * under reduced motion; every tween is killed in ngOnDestroy.
   */
  private animateFloatingAccents(): void {
    const elements = this.floatingAccentRefs?.toArray();
    if (!elements?.length) return;
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    elements.forEach((elRef, i) => {
      const el = elRef.nativeElement;
      const distance = 10 + (i % 2) * 6; // px — alternate amplitude for variety
      const duration = 2.6 + i * 0.5; // s

      gsap.set(el, { opacity: 0, y: 12, scale: 0.9 });
      const entrance = gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.2 + i * 0.12, ease: 'back.out(1.6)' });

      const float = gsap.to(el, {
        y: `-=${distance}`,
        duration,
        delay: 0.8 + i * 0.12,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      this.floatTweens.push(entrance, float);
    });
  }
}
