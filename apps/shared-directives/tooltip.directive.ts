import {
  booleanAttribute,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComTooltipComponent,
  TOOLTIP_ANIM_MS,
  type IComTooltipContent,
  type IComTooltipPlacement,
  type IComTooltipSize,
  type IComTooltipStatus,
  type IComTooltipVariant,
} from '@commudle/commudle-theme';

const SPACE_WITH_DOT = 12;
const SPACE_WITHOUT_DOT = 4;
const DOT_EDGE = 12;
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
const positionsFor = (space: number): Record<IComTooltipPlacement, ConnectedPosition> => ({
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -space },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: space },
  left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -space },
  right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: space },
});

let nextId = 0;

@Directive({
  selector: '[comTooltip]',
  standalone: false,
})
export class TooltipDirective implements OnChanges, OnDestroy {
  @Input('comTooltip') content: IComTooltipContent | null | undefined;
  @Input() tooltipPlacement: IComTooltipPlacement = 'top';
  @Input() tooltipStatus: IComTooltipStatus = 'primary';
  @Input() tooltipVariant: IComTooltipVariant = 'default';
  @Input() tooltipSize: IComTooltipSize = 'md';
  @Input({ transform: booleanAttribute }) tooltipDot = true;
  @Input({ transform: booleanAttribute }) tooltipDisabled = false;

  @HostBinding('attr.aria-describedby') describedBy: string | null = null;

  private readonly id = `com-tooltip-${nextId++}`;
  private overlayRef?: OverlayRef;
  private tip?: ComTooltipComponent;
  private leaveTimer?: ReturnType<typeof setTimeout>;

  constructor(private overlay: Overlay, private host: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter')
  @HostListener('focusin')
  onEnter(): void {
    if (!this.overlayRef) {
      if (!this.tooltipDisabled && this.content) this.show();
    } else if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = undefined;
      this.tip?.setTooltipVisible(true);
    }
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  @HostListener('document:keydown.escape')
  onLeave(): void {
    if (!this.overlayRef || this.leaveTimer) return;
    this.tip?.setTooltipVisible(false);
    this.leaveTimer = setTimeout(() => this.hideTooltip(), TOOLTIP_ANIM_MS);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] || changes['tooltipDisabled']) this.hideTooltip();
  }

  ngOnDestroy(): void {
    this.hideTooltip();
  }

  private show(): void {
    const placement = this.tooltipPlacement;
    const positions = positionsFor(this.tooltipDot ? SPACE_WITH_DOT : SPACE_WITHOUT_DOT);
    const sides = new Set<IComTooltipPlacement>([placement, OPPOSITE[placement], 'top', 'bottom', 'left', 'right']);

    const strategy = this.overlay
      .position()
      .flexibleConnectedTo(this.host)
      .withPositions([...sides].map((side) => positions[side]))
      .withPush(true)
      .withFlexibleDimensions(false);

    this.overlayRef = this.overlay.create({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const tip = this.overlayRef.attach(new ComponentPortal(ComTooltipComponent)).instance;
    tip.content = this.content ?? null;
    tip.side = placement;
    tip.size = this.tooltipSize;
    tip.status = this.tooltipStatus;
    tip.variant = this.tooltipVariant;
    tip.dot = this.tooltipDot;
    tip.id = this.id;
    this.tip = tip;
    this.describedBy = this.id;

    strategy.positionChanges.subscribe(({ connectionPair: { overlayX, overlayY } }) => {
      tip.side = overlayY !== 'center' ? OPPOSITE[overlayY] : overlayX === 'end' ? 'left' : 'right';
      this.alignDot(tip);
      tip.refresh();
    });
    tip.hoverChange.subscribe((hovered) => (hovered ? this.onEnter() : this.onLeave()));
    tip.enter();
  }

  private hideTooltip(): void {
    clearTimeout(this.leaveTimer);
    this.leaveTimer = undefined;
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.tip = undefined;
    this.describedBy = null;
  }

  private alignDot(tip: ComTooltipComponent): void {
    if (!this.overlayRef) return;
    const trigger = this.host.nativeElement.getBoundingClientRect();
    const box = this.overlayRef.overlayElement.getBoundingClientRect();
    const vertical = tip.side === 'top' || tip.side === 'bottom';
    const center = vertical ? trigger.left + trigger.width / 2 - box.left : trigger.top + trigger.height / 2 - box.top;
    const max = (vertical ? box.width : box.height) - DOT_EDGE;
    tip.dotOffset = Math.max(DOT_EDGE, Math.min(center, max));
  }
}
