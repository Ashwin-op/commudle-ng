import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  TemplateRef,
} from '@angular/core';
import {
  TOOLTIP_ANIM_MS,
  TOOLTIP_COLORS,
  TOOLTIP_DOT_GAP,
  TOOLTIP_DOT_SIZE,
  TOOLTIP_SIZES,
} from './models/com-tooltip.types';
import type {
  IComTooltipContent,
  IComTooltipPlacement,
  IComTooltipSize,
  IComTooltipStatus,
  IComTooltipVariant,
} from './models/com-tooltip.types';

const SLIDE_PX = 8;
const HIDDEN_TRANSFORMS: Record<IComTooltipPlacement, string> = {
  top: `translate(0, ${SLIDE_PX}px)`,
  bottom: `translate(0, -${SLIDE_PX}px)`,
  left: `translate(${SLIDE_PX}px, 0)`,
  right: `translate(-${SLIDE_PX}px, 0)`,
};

@Component({
  selector: 'com-tooltip-container',
  templateUrl: './com-tooltip.component.html',
  styleUrls: ['./com-tooltip.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComTooltipComponent {
  content: IComTooltipContent | null = null;
  side: IComTooltipPlacement = 'top';
  size: IComTooltipSize = 'md';
  status: IComTooltipStatus = 'primary';
  variant: IComTooltipVariant = 'default';
  dot = true;
  dotOffset = 0;
  id = '';
  isTooltipVisible = false;
  boxStyle: Record<string, string> = {};
  dotStyle: Record<string, string> = {};

  @Output() hoverChange = new EventEmitter<boolean>();

  constructor(private cdr: ChangeDetectorRef, private el: ElementRef<HTMLElement>) {}

  get template(): TemplateRef<unknown> | null {
    return this.content instanceof TemplateRef ? this.content : null;
  }

  enter(): void {
    this.refresh();
    void this.el.nativeElement.offsetWidth;
    this.setTooltipVisible(true);
  }

  setTooltipVisible(isTooltipVisible: boolean): void {
    this.isTooltipVisible = isTooltipVisible;
    this.refresh();
  }

  refresh(): void {
    const color = TOOLTIP_COLORS[this.status] || TOOLTIP_COLORS.primary;
    const base = {
      'max-width': `${TOOLTIP_SIZES[this.size] || TOOLTIP_SIZES.md}px`,
      opacity: this.isTooltipVisible ? '1' : '0',
      transform: this.isTooltipVisible ? 'translate(0, 0)' : HIDDEN_TRANSFORMS[this.side],
      transition: `opacity ${TOOLTIP_ANIM_MS}ms ease, transform ${TOOLTIP_ANIM_MS}ms ease`,
    };

    this.boxStyle =
      this.variant === 'card'
        ? base
        : {
            ...base,
            color: 'text' in color ? color.text : '#fff',
            background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
            'box-shadow': `inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 28px -6px ${color.glow}, 0 3px 8px rgba(0,0,0,0.12)`,
          };

    this.dotStyle = {
      width: `${TOOLTIP_DOT_SIZE}px`,
      height: `${TOOLTIP_DOT_SIZE}px`,
      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0) 45%), linear-gradient(135deg, ${color.from}, ${color.to})`,
      'box-shadow': `0 2px 0 ${color.edge}, 0 3px 4px rgba(0,0,0,0.2)`,
      ...this.dotPosition(),
    };

    this.cdr.detectChanges();
  }

  private dotPosition(): Record<string, string> {
    const offset = `${this.dotOffset}px`;
    const away = `calc(100% + ${TOOLTIP_DOT_GAP}px)`;
    const center = `-${TOOLTIP_DOT_SIZE / 2}px`;
    const vertical = this.side === 'top' || this.side === 'bottom';
    return {
      [this.side]: away,
      [vertical ? 'left' : 'top']: offset,
      [vertical ? 'margin-left' : 'margin-top']: center,
    };
  }
}
