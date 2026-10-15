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
import { Subscription } from 'rxjs';
import { ComTooltipComponent, TOOLTIP_ANIM_MS, TOOLTIP_DOT_GAP, TOOLTIP_DOT_SIZE } from '@commudle/commudle-theme';
import type {
  IComTooltipContent,
  IComTooltipPlacement,
  IComTooltipSize,
  IComTooltipStatus,
  IComTooltipVariant,
} from '@commudle/commudle-theme';

let nextId = 0;
const TOOLTIP_SIDES: IComTooltipPlacement[] = ['top', 'bottom', 'left', 'right'];
const OPPOSITE_SIDE: Record<IComTooltipPlacement, IComTooltipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

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
  @Input() tooltipClass = '';
  @Input({ transform: booleanAttribute }) tooltipDot = true;
  @Input({ transform: booleanAttribute }) tooltipDisabled = false;

  @HostBinding('attr.aria-describedby') describedBy: string | null = null;

  private readonly id = `com-tooltip-${nextId++}`;
  private overlayRef?: OverlayRef;
  private subs = new Subscription();
  private leaveTimer?: ReturnType<typeof setTimeout>;
  private tip?: ComTooltipComponent;

  constructor(private overlay: Overlay, private host: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter')
  @HostListener('focusin')
  onEnter(): void {
    if (this.cancelLeave() || this.tooltipDisabled || !this.content || this.overlayRef) return;
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
    const space = this.tooltipDot ? TOOLTIP_DOT_SIZE + TOOLTIP_DOT_GAP * 2 : 4;
    const strategy = this.overlay
      .position()
      .flexibleConnectedTo(this.host)
      .withPositions(this.positions(space))
      .withPush(true)
      .withFlexibleDimensions(false);

    this.overlayRef = this.overlay.create({
      positionStrategy: strategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: this.tooltipClass.trim().split(/\s+/).filter(Boolean),
    });

    const tip = this.overlayRef.attach(new ComponentPortal(ComTooltipComponent)).instance;
    tip.content = this.content;
    tip.side = this.tooltipPlacement;
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
    this.subs.add(tip.hoverChange.subscribe((hovered) => (hovered ? this.cancelLeave() : this.onLeave())));
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
    this.leaveTimer = setTimeout(() => this.dispose(), TOOLTIP_ANIM_MS);
  }

  private cancelLeave(): boolean {
    if (!this.leaveTimer) return false;
    clearTimeout(this.leaveTimer);
    this.leaveTimer = undefined;
    this.tip?.setTooltipVisible(true);
    return true;
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

  private positions(space: number): ConnectedPosition[] {
    const positions: Record<IComTooltipPlacement, ConnectedPosition> = {
      top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -space },
      bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: space },
      left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -space },
      right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: space },
    };

    const first = this.tooltipPlacement;
    const opposite = OPPOSITE_SIDE[first];
    return [first, opposite, ...TOOLTIP_SIDES.filter((side) => side !== first && side !== opposite)].map(
      (side) => positions[side],
    );
  }

  private sideOf(pair: ConnectedPosition): IComTooltipPlacement {
    if (pair.overlayY === 'bottom') return 'top';
    if (pair.overlayY === 'top') return 'bottom';
    return pair.overlayX === 'end' ? 'left' : 'right';
  }

  private alignDot(tip: ComTooltipComponent): void {
    if (!this.overlayRef) return;
    const trigger = this.host.nativeElement.getBoundingClientRect();
    const box = this.overlayRef.overlayElement.getBoundingClientRect();
    const vertical = tip.side === 'top' || tip.side === 'bottom';
    const raw = vertical ? trigger.left + trigger.width / 2 - box.left : trigger.top + trigger.height / 2 - box.top;
    const length = vertical ? box.width : box.height;
    tip.dotOffset = Math.min(Math.max(raw, 12), Math.max(length - 12, 12));
  }
}
