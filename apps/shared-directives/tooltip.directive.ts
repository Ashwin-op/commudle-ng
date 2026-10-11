import { NgIf, NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import { CommudleCardModule } from '@commudle/commudle-theme';

type Side = 'top' | 'bottom' | 'left' | 'right';
export type TooltipPlacement = Side | 'start' | 'end';
export type TooltipDelay = 'instant' | 'short' | 'long';
export type TooltipSize = 'sm' | 'md' | 'lg';
export type TooltipVariant = 'default' | 'card';
export type TooltipContent = string | TemplateRef<unknown>;

const SIZES = { sm: 160, md: 240, lg: 360 };
const DELAYS = { instant: 0, short: 300, long: 700 };
const HIDE_DELAY = 100;
const ANIM_MS = 300;
const SLIDE_PX = 8;
const VIEWPORT_MARGIN = 8;
const DOT_SIZE = 8;
const DOT_GAP = 4;
const SPACE_WITH_DOT = DOT_SIZE + DOT_GAP * 2; // trigger -> box distance when the dot is shown
const SPACE_WITHOUT_DOT = 4;

// primary = Commudle logo blue (default). Same status names as Nebular; unknown names fall back to primary.
const COLORS: Record<string, { from: string; to: string; edge: string; glow: string }> = {
  primary: { from: '#5070fc', to: '#24a8fc', edge: '#2b5fd0', glow: 'rgba(60, 120, 252, 0.40)' },
  basic: { from: '#5b6478', to: '#3b4254', edge: '#262b38', glow: 'rgba(59, 66, 84, 0.40)' },
  info: { from: '#4cc9ff', to: '#0095ff', edge: '#0072c6', glow: 'rgba(0, 149, 255, 0.40)' },
  success: { from: '#3ddc84', to: '#00b86b', edge: '#008a4e', glow: 'rgba(0, 184, 107, 0.40)' },
  warning: { from: '#ffc65c', to: '#ff9f00', edge: '#c77800', glow: 'rgba(255, 159, 0, 0.40)' },
  danger: { from: '#ff6b81', to: '#e5304f', edge: '#b01e38', glow: 'rgba(229, 48, 79, 0.40)' },
};

const SHINE = 'radial-gradient(ellipse 80px 50px at 0% 0%, rgba(255,255,255,0.35), transparent)';

@Component({
  selector: 'app-tooltip-container',
  standalone: true,
  imports: [NgIf, NgStyle, NgTemplateOutlet, CommudleCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    <div
      role="tooltip"
      [id]="id"
      [ngStyle]="boxStyle"
      (mouseenter)="hoverChange.emit(true)"
      (mouseleave)="hoverChange.emit(false)"
    >
      <!-- corner shine: behind the text, only in the top-left corner -->
      <span
        *ngIf="variant !== 'card'"
        [style.background]="shine"
        style="position: absolute; inset: 0; border-radius: inherit; pointer-events: none"
      ></span>

      <div style="position: relative">
        <com-card *ngIf="variant === 'card'; else content">
          <ng-container *ngTemplateOutlet="content"></ng-container>
        </com-card>

        <ng-template #content>
          <ng-container *ngIf="template; else plainText">
            <ng-container *ngTemplateOutlet="template"></ng-container>
          </ng-container>
        </ng-template>
        <ng-template #plainText>
          <span [ngStyle]="variant === 'card' ? { display: 'block', padding: '8px 12px' } : null">{{ text }}</span>
        </ng-template>
      </div>

      <span *ngIf="dot" style="position: absolute; pointer-events: none" [ngStyle]="dotStyle"></span>
    </div>
  `,
})
class TooltipContainerComponent {
  content: TooltipContent | null = null;
  side: Side = 'top';
  size: TooltipSize = 'md';
  status = 'primary';
  variant: TooltipVariant = 'default';
  dot = true;
  dotOffset = 0;
  id = '';
  shine = SHINE;
  boxStyle: Record<string, string> = {};
  dotStyle: Record<string, string> = {};

  @Output() hoverChange = new EventEmitter<boolean>();

  shown = false; // false = hidden state: faded out and nudged toward the trigger

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef<HTMLElement>) {}

  enter(): void {
    void this.el.nativeElement.offsetWidth;
    this.setShown(true);
  }

  setShown(shown: boolean): void {
    this.shown = shown;
    this.refresh();
  }

  private hiddenTransform(): string {
    const d = SLIDE_PX;
    return {
      top: `translate(0, ${d}px)`,
      bottom: `translate(0, -${d}px)`,
      left: `translate(${d}px, 0)`,
      right: `translate(-${d}px, 0)`,
    }[this.side];
  }

  get template(): TemplateRef<unknown> | null {
    return this.content instanceof TemplateRef ? this.content : null;
  }

  get text(): string {
    return this.template || this.content == null ? '' : String(this.content);
  }

  refresh(): void {
    const c = COLORS[this.status] || COLORS.primary;
    const maxWidth = `${SIZES[this.size] || SIZES.md}px`;

    const base = {
      position: 'relative',
      width: 'max-content',
      'max-width': maxWidth,
      'font-size': '13px',
      'line-height': '1.45',
      'word-break': 'break-word',
      opacity: this.shown ? '1' : '0',
      transform: this.shown ? 'translate(0, 0)' : this.hiddenTransform(),
      transition: `opacity ${ANIM_MS}ms ease, transform ${ANIM_MS}ms ease`,
    };

    this.boxStyle =
      this.variant === 'card'
        ? { ...base, background: 'transparent', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.14))' }
        : {
            ...base,
            color: '#fff',
            padding: this.template ? '0' : '10px 14px',
            'border-radius': '14px',
            background: `linear-gradient(135deg, ${c.from}, ${c.to})`,

            'box-shadow': `inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 28px -6px ${c.glow}, 0 3px 8px rgba(0,0,0,0.12)`,
          };

    this.dotStyle = {
      width: `${DOT_SIZE}px`,
      height: `${DOT_SIZE}px`,
      'border-radius': '9999px',

      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0) 45%), linear-gradient(135deg, ${c.from}, ${c.to})`,
      'box-shadow': `0 2px 0 ${c.edge}, 0 3px 4px rgba(0,0,0,0.2)`,
      ...this.dotPosition(),
    };

    this.cdr.detectChanges();
  }

  private dotPosition(): Record<string, string> {
    const offset = `${this.dotOffset}px`;
    const away = `calc(100% + ${DOT_GAP}px)`;
    const center = `-${DOT_SIZE / 2}px`;
    switch (this.side) {
      case 'top':
        return { top: away, left: offset, 'margin-left': center };
      case 'bottom':
        return { bottom: away, left: offset, 'margin-left': center };
      case 'left':
        return { left: away, top: offset, 'margin-top': center };
      default:
        return { right: away, top: offset, 'margin-top': center };
    }
  }
}

/* ---------------- public API: [appTooltip] ---------------- */
let nextId = 0;

@Directive({
  selector: '[appTooltip]',
  standalone: false,
})
export class TooltipDirective implements OnChanges, OnDestroy {
  @Input() appTooltip: TooltipContent | null | undefined;
  @Input() appTooltipPlacement: TooltipPlacement = 'top'; // top | bottom | left | right | start | end
  @Input() appTooltipStatus = 'primary'; // primary | basic | info | success | warning | danger
  @Input() appTooltipDot = true; // [appTooltipDot]="false" to hide the dot
  @Input() appTooltipVariant: TooltipVariant = 'default'; // 'card' wraps the content in com-card
  @Input() appTooltipDelay: TooltipDelay = 'short'; // instant (0ms) | short (300ms) | long (700ms)
  @Input() appTooltipSize: TooltipSize = 'md'; // max width: sm 160px | md 240px | lg 360px
  @Input() appTooltipDisabled = false;
  @Input() appTooltipClass = ''; // extra class(es) on the overlay

  @HostBinding('attr.aria-describedby') describedBy: string | null = null;

  private readonly id = `app-tooltip-${nextId++}`;
  private overlayRef?: OverlayRef;
  private subs = new Subscription();
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private tip?: TooltipContainerComponent;
  private leaveTimer?: ReturnType<typeof setTimeout>;

  constructor(private overlay: Overlay, private host: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter')
  @HostListener('focusin')
  onEnter(): void {
    this.clearTimers();
    if (this.cancelLeave()) {
      return;
    }
    if (this.appTooltipDisabled || !this.appTooltip || this.overlayRef) {
      return;
    }
    const delay = DELAYS[this.appTooltipDelay] ?? DELAYS.short;
    if (delay === 0) {
      this.show();
    } else {
      this.showTimer = setTimeout(() => this.show(), delay);
    }
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  onLeave(): void {
    this.clearTimers();
    this.hideTimer = setTimeout(() => this.hide(), HIDE_DELAY);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.hide();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // content or disabled changed while open: close it, the next hover shows the fresh one
    if (this.overlayRef && (changes['appTooltip'] || changes['appTooltipDisabled'])) {
      this.hide(true);
    }
  }

  ngOnDestroy(): void {
    this.hide(true);
  }

  private show(): void {
    if (this.overlayRef || this.appTooltipDisabled || !this.appTooltip) {
      return;
    }

    const space = this.appTooltipDot ? SPACE_WITH_DOT : SPACE_WITHOUT_DOT;
    const strategy = this.overlay
      .position()
      .flexibleConnectedTo(this.host)
      .withPositions(this.positions(space)) // preferred side first, then it flips to fit the screen
      .withPush(true)
      .withFlexibleDimensions(false)
      .withViewportMargin(VIEWPORT_MARGIN);

    this.overlayRef = this.overlay.create({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: this.appTooltipClass.split(' ').filter(Boolean),
    });

    const tip = this.overlayRef.attach(new ComponentPortal(TooltipContainerComponent)).instance;
    tip.content = this.appTooltip;
    tip.side = this.preferredSide();
    tip.size = this.appTooltipSize;
    tip.status = this.appTooltipStatus;
    tip.variant = this.appTooltipVariant;
    tip.dot = this.appTooltipDot;
    tip.id = this.id;
    this.tip = tip;
    this.describedBy = this.id;

    this.subs.add(
      strategy.positionChanges.subscribe((change) => {
        tip.side = this.sideOf(change.connectionPair);
        this.alignDot(tip);
        tip.refresh();
      }),
    );

    this.subs.add(tip.hoverChange.subscribe((hovered) => (hovered ? this.keepOpen() : this.onLeave())));
    tip.refresh();
    tip.enter();
  }

  private hide(immediate = false): void {
    this.clearTimers();
    if (!this.overlayRef) return;
    if (immediate || !this.tip) {
      this.dispose();
      return;
    }
    if (this.leaveTimer) return; // already fading out
    this.tip.setShown(false);
    this.leaveTimer = setTimeout(() => this.dispose(), ANIM_MS);
  }

  private cancelLeave(): boolean {
    if (!this.leaveTimer) return false;
    clearTimeout(this.leaveTimer);
    this.leaveTimer = undefined;
    this.tip?.setShown(true);
    return true;
  }

  private keepOpen(): void {
    this.clearTimers();
    this.cancelLeave();
  }

  private dispose(): void {
    clearTimeout(this.leaveTimer);
    this.leaveTimer = undefined;
    this.subs.unsubscribe();
    this.subs = new Subscription();
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.tip = undefined;
    this.describedBy = null;
  }

  private clearTimers(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
  }

  private preferredSide(): Side {
    const p = this.appTooltipPlacement;
    return p === 'start' ? 'left' : p === 'end' ? 'right' : p || 'top';
  }

  private positions(space: number): ConnectedPosition[] {
    const all = {
      top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -space },
      bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: space },
      left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -space },
      right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: space },
    } as Record<Side, ConnectedPosition>;

    const first = this.preferredSide();
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[first] as Side;
    const rest = (['top', 'bottom', 'left', 'right'] as Side[]).filter((s) => s !== first && s !== opposite);
    return [first, opposite, ...rest].map((s) => all[s]);
  }

  private sideOf(pair: ConnectedPosition): Side {
    if (pair.overlayY === 'bottom') return 'top';
    if (pair.overlayY === 'top') return 'bottom';
    return pair.overlayX === 'end' ? 'left' : 'right';
  }

  private alignDot(tip: TooltipContainerComponent): void {
    if (!this.overlayRef) return;
    const trigger = this.host.nativeElement.getBoundingClientRect();
    const box = this.overlayRef.overlayElement.getBoundingClientRect();
    const vertical = tip.side === 'top' || tip.side === 'bottom';
    const raw = vertical ? trigger.left + trigger.width / 2 - box.left : trigger.top + trigger.height / 2 - box.top;
    const length = vertical ? box.width : box.height;
    tip.dotOffset = Math.min(Math.max(raw, 12), Math.max(length - 12, 12));
  }
}
