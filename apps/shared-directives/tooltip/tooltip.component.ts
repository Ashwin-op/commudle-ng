import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
  TemplateRef,
} from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipDelay = 'instant' | 'short' | 'long';
export type TooltipSize = 'sm' | 'md' | 'lg';
export type TooltipVariant = 'default' | 'card';
export type TooltipContent = string | TemplateRef<unknown>;

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipComponent {
  // Set by AppTooltipDirective
  content: TooltipContent | null = null;
  placement: TooltipPosition = 'top';
  size: TooltipSize = 'md';
  variant: TooltipVariant = 'default';
  dot = true;
  dotOffset = 0; // px from the tooltip's start edge; keeps dot on the trigger after flip/push
  id = '';

  // Lets the tooltip stay open while the pointer is over it (needed for rich content)
  @Output() hoverChange = new EventEmitter<boolean>();

  constructor(private cdr: ChangeDetectorRef) {}

  get template(): TemplateRef<unknown> | null {
    return this.content instanceof TemplateRef ? this.content : null;
  }

  get text(): string {
    return typeof this.content === 'string' ? this.content : '';
  }

  refresh(): void {
    this.cdr.detectChanges();
  }
}
