import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
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

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipSize = 'sm' | 'md' | 'lg';
export type TooltipVariant = 'default' | 'card';
export type TooltipContent = string | TemplateRef<unknown>;

const SIZES = { sm: 160, md: 240, lg: 360 };
const ANIM_MS = 300;
const SLIDE_PX = 8;
const DOT_SIZE = 6;
const DOT_GAP = 3;

const COLORS: Record<string, { from: string; to: string; edge: string; glow: string; text?: string }> = {
  primary: { from: '#5270ff', to: '#3495ff', edge: '#5270ff', glow: 'rgba(60, 120, 252, 0.40)' },
  basic: { from: '#5b6478', to: '#3b4254', edge: '#262b38', glow: 'rgba(59, 66, 84, 0.40)' },
  info: { from: '#4cc9ff', to: '#0095ff', edge: '#0072c6', glow: 'rgba(0, 149, 255, 0.40)' },
  success: { from: '#3ddc84', to: '#00b86b', edge: '#008a4e', glow: 'rgba(0, 184, 107, 0.40)' },
  warning: { from: '#ffc65c', to: '#ff9f00', edge: '#c77800', glow: 'rgba(255, 159, 0, 0.40)' },
  danger: { from: '#ff6b81', to: '#e5304f', edge: '#b01e38', glow: 'rgba(229, 48, 79, 0.40)' },
  white: { from: '#ffffff', to: '#eef2f7', edge: '#d5dbe5', glow: 'rgba(15, 23, 42, 0.15)', text: '#1f2937' },
};

@Component({
  selector: 'com-tooltip-container',
  standalone: true,
  imports: [NgTemplateOutlet, CommudleCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'com-block' },
  template: `
    <div
      role="tooltip"
      [id]="id"
      class="com-relative com-w-max com-text-xs com-break-words"
      [style]="boxStyle"
      (mouseenter)="hoverChange.emit(true)"
      (mouseleave)="hoverChange.emit(false)"
    >
      <div class="com-relative">
        @if (variant === 'card') {
        <com-card><ng-container *ngTemplateOutlet="contentTpl"></ng-container></com-card>
        } @else {
        <ng-container *ngTemplateOutlet="contentTpl"></ng-container>
        }

        <ng-template #contentTpl>
          @if (template) {
          <ng-container *ngTemplateOutlet="template"></ng-container>
          } @else {
          <span [style]="variant === 'card' ? { display: 'block', padding: '4px' } : null">{{ content }}</span>
          }
        </ng-template>
      </div>

      @if (dot) {
      <span class="com-absolute com-pointer-events-none" [style]="dotStyle"></span>
      }
    </div>
  `,
})
class TooltipContainerComponent {
  content: TooltipContent | null = null;
  side: TooltipPlacement = 'top';
  size: TooltipSize = 'md';
  status = 'primary';
  variant: TooltipVariant = 'default';
  dot = true;
  dotOffset = 0;
  id = '';
  boxStyle: Record<string, string> = {};
  dotStyle: Record<string, string> = {};
  tooltipVisible = false;

  @Output() hoverChange = new EventEmitter<boolean>();

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef<HTMLElement>) {}

  get template(): TemplateRef<unknown> | null {
    return this.content instanceof TemplateRef ? this.content : null;
  }

  enter(): void {
    void this.el.nativeElement.offsetWidth;
    this.setTooltipVisible(true);
  }

  setTooltipVisible(tooltipVisible: boolean): void {
    this.tooltipVisible = tooltipVisible;
    this.refresh();
  }

  refresh(): void {
    const c = COLORS[this.status] || COLORS.primary;

    const base = {
      'max-width': `${SIZES[this.size] || SIZES.md}px`,
      opacity: this.tooltipVisible ? '1' : '0',
      transform: this.tooltipVisible ? 'translate(0, 0)' : this.hiddenTransform(),
      transition: `opacity ${ANIM_MS}ms ease, transform ${ANIM_MS}ms ease`,
    };

    this.boxStyle =
      this.variant === 'card'
        ? { ...base, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.14))' }
        : {
            ...base,
            color: c.text || '#fff',
            padding: this.template ? '0' : '4px',
            'border-radius': '8px',
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

  private hiddenTransform(): string {
    const d = SLIDE_PX;
    return {
      top: `translate(0, ${d}px)`,
      bottom: `translate(0, -${d}px)`,
      left: `translate(${d}px, 0)`,
      right: `translate(-${d}px, 0)`,
    }[this.side];
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

let nextId = 0;

@Directive({
  selector: '[comTooltip]',
  standalone: false,
})
export class TooltipDirective implements OnChanges, OnDestroy {
  @Input('comTooltip') content: TooltipContent | null | undefined;
  @Input() tooltipPlacement: TooltipPlacement = 'top';
  @Input() tooltipStatus = 'primary'; // primary | basic | info | success | warning | danger
  @Input() tooltipVariant: TooltipVariant = 'default';
  @Input() tooltipSize: TooltipSize = 'md';
  @Input() tooltipClass = '';
  @Input({ transform: booleanAttribute }) tooltipDot = true;
  @Input({ transform: booleanAttribute }) tooltipDisabled = false;

  @HostBinding('attr.aria-describedby') describedBy: string | null = null;

  private readonly id = `com-tooltip-${nextId++}`;
  private overlayRef?: OverlayRef;
  private subs = new Subscription();
  private leaveTimer?: ReturnType<typeof setTimeout>;
  private tip?: TooltipContainerComponent;

  constructor(private overlay: Overlay, private host: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter')
  @HostListener('focusin')
  onEnter(): void {
    if (this.cancelLeave()) {
      return;
    }
    if (this.tooltipDisabled || !this.content || this.overlayRef) {
      return;
    }
    this.show();
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  onLeave(): void {
    this.hide();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.hide();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.overlayRef && (changes['content'] || changes['tooltipDisabled'])) {
      this.hide(true);
    }
  }

  ngOnDestroy(): void {
    this.hide(true);
  }

  private show(): void {
    if (this.overlayRef || this.tooltipDisabled || !this.content) {
      return;
    }

    const space = this.tooltipDot ? DOT_SIZE + DOT_GAP * 2 : 4;
    const strategy = this.overlay
      .position()
      .flexibleConnectedTo(this.host)
      .withPositions(this.positions(space))
      .withPush(true)
      .withFlexibleDimensions(false);

    this.overlayRef = this.overlay.create({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: this.tooltipClass.split(' ').filter(Boolean),
    });

    const tip = this.overlayRef.attach(new ComponentPortal(TooltipContainerComponent)).instance;
    tip.content = this.content;
    tip.side = this.preferredSide();
    tip.size = this.tooltipSize;
    tip.status = this.tooltipStatus;
    tip.variant = this.tooltipVariant;
    tip.dot = this.tooltipDot;
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
    if (!this.overlayRef) return;
    if (immediate || !this.tip) {
      this.dispose();
      return;
    }
    if (this.leaveTimer) return;
    this.tip.setTooltipVisible(false);
    this.leaveTimer = setTimeout(() => this.dispose(), ANIM_MS);
  }

  private cancelLeave(): boolean {
    if (!this.leaveTimer) return false;
    clearTimeout(this.leaveTimer);
    this.leaveTimer = undefined;
    this.tip?.setTooltipVisible(true);
    return true;
  }

  private keepOpen(): void {
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

  private preferredSide(): TooltipPlacement {
    return this.tooltipPlacement;
  }

  private positions(space: number): ConnectedPosition[] {
    const all = {
      top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -space },
      bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: space },
      left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -space },
      right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: space },
    } as Record<TooltipPlacement, ConnectedPosition>;

    const first = this.preferredSide();
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[first];
    const rest = (['top', 'bottom', 'left', 'right'] as TooltipPlacement[]).filter(
      (s) => s !== first && s !== opposite,
    );
    return [first, opposite, ...rest].map((s) => all[s]);
  }

  private sideOf(pair: ConnectedPosition): TooltipPlacement {
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
