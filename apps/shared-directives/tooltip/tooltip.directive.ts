import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import {
  TooltipComponent,
  TooltipContent,
  TooltipDelay,
  TooltipPosition,
  TooltipSize,
  TooltipVariant,
} from './tooltip.component';

const DELAY_MS: Record<TooltipDelay, number> = { instant: 0, short: 300, long: 700 };
const HIDE_DELAY_MS = 100;
const VIEWPORT_MARGIN = 8;
const DOT_GAP_PX = 14; // 6px dot + 4px space on each side

// Preferred side first, then the order to flip to if it doesn't fit in the viewport
const FLIP_ORDER: Record<TooltipPosition, TooltipPosition[]> = {
  top: ['top', 'bottom', 'left', 'right'],
  bottom: ['bottom', 'top', 'left', 'right'],
  left: ['left', 'right', 'top', 'bottom'],
  right: ['right', 'left', 'top', 'bottom'],
};

let nextId = 0;

@Directive({
  selector: '[appTooltip]',
  standalone: false,
})
export class TooltipDirective implements OnChanges, OnDestroy {
  /** Text or an <ng-template> (e.g. one containing com-card). */
  @Input() appTooltip: TooltipContent | null | undefined;
  @Input() tooltipPosition: TooltipPosition = 'top';
  @Input() tooltipDot = true;
  @Input() tooltipDelay: TooltipDelay = 'short'; // instant = 0ms, short = 300ms, long = 700ms
  @Input() tooltipSize: TooltipSize = 'md'; // sm = 160px, md = 240px, lg = 360px max width
  @Input() tooltipVariant: TooltipVariant = 'default'; // card = content is wrapped in com-card
  @Input() tooltipDisabled = false;
  @Input() tooltipClass = ''; // optional extra class(es) on the overlay pane

  @HostBinding('attr.aria-describedby') describedBy: string | null = null;

  private readonly tooltipId = `app-tooltip-${nextId++}`;
  private overlayRef?: OverlayRef;
  private subs = new Subscription();
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;

  constructor(private overlay: Overlay, private host: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter')
  @HostListener('focusin')
  onEnter(): void {
    this.scheduleShow();
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  onLeave(): void {
    this.scheduleHide();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.hide();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.overlayRef && (changes['tooltipDisabled'] || (changes['appTooltip'] && !this.appTooltip))) {
      this.hide();
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private scheduleShow(): void {
    this.clearTimers();
    if (this.tooltipDisabled || !this.appTooltip || this.overlayRef) {
      return;
    }
    const delay = DELAY_MS[this.tooltipDelay] ?? DELAY_MS.short;
    if (delay === 0) {
      this.show();
    } else {
      this.showTimer = setTimeout(() => this.show(), delay);
    }
  }

  private scheduleHide(): void {
    this.clearTimers();
    this.hideTimer = setTimeout(() => this.hide(), HIDE_DELAY_MS);
  }

  private clearTimers(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
  }

  private show(): void {
    if (this.overlayRef || this.tooltipDisabled || !this.appTooltip) {
      return;
    }

    const strategy = this.overlay
      .position()
      .flexibleConnectedTo(this.host)
      .withPositions(this.buildPositions(this.tooltipDot ? DOT_GAP_PX : 4))
      .withPush(true) // keeps it inside the screen horizontally/vertically if no side fits fully
      .withFlexibleDimensions(false)
      .withViewportMargin(VIEWPORT_MARGIN);

    this.overlayRef = this.overlay.create({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(), // re-flips while page scrolls
      panelClass: this.tooltipClass ? this.tooltipClass.split(' ').filter(Boolean) : [],
    });

    const tip = this.overlayRef.attach(new ComponentPortal(TooltipComponent)).instance;
    tip.content = this.appTooltip;
    tip.placement = this.tooltipPosition;
    tip.size = this.tooltipSize;
    tip.dot = this.tooltipDot;
    tip.variant = this.tooltipVariant;
    tip.id = this.tooltipId;
    this.describedBy = this.tooltipId;

    this.subs.add(
      strategy.positionChanges.subscribe((change) => {
        tip.placement = this.placementOf(change.connectionPair);
        this.syncDot(tip);
        tip.refresh();
      }),
    );
    this.subs.add(tip.hoverChange.subscribe((hovered) => (hovered ? this.clearTimers() : this.scheduleHide())));
    tip.refresh();
  }

  private hide(): void {
    this.clearTimers();
    this.subs.unsubscribe();
    this.subs = new Subscription();
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.describedBy = null;
  }

  private buildPositions(gap: number): ConnectedPosition[] {
    const all = {
      top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -gap },
      bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: gap },
      left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -gap },
      right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: gap },
    } as Record<TooltipPosition, ConnectedPosition>;
    return FLIP_ORDER[this.tooltipPosition].map((side) => all[side]);
  }

  private placementOf(pair: ConnectedPosition): TooltipPosition {
    if (pair.overlayY === 'bottom') return 'top';
    if (pair.overlayY === 'top') return 'bottom';
    return pair.overlayX === 'end' ? 'left' : 'right';
  }

  // After push/flip the tooltip may not be centred on the trigger, so aim the arrow at the trigger's centre
  private syncDot(tip: TooltipComponent): void {
    if (!this.overlayRef) return;
    const trigger = this.host.nativeElement.getBoundingClientRect();
    const pane = this.overlayRef.overlayElement.getBoundingClientRect();
    const vertical = tip.placement === 'top' || tip.placement === 'bottom';
    const raw = vertical ? trigger.left + trigger.width / 2 - pane.left : trigger.top + trigger.height / 2 - pane.top;
    const max = vertical ? pane.width : pane.height;
    tip.dotOffset = Math.min(Math.max(raw, 12), Math.max(max - 12, 12));
  }
}
