import { booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges } from '@angular/core';
import { IComButtonAppearance, IComButtonShape, IComButtonSize, IComButtonStatus } from './models/com-button.types';

@Component({
  selector: 'button[comButton], a[comButton], input[type="button"][comButton], input[type="submit"][comButton]',
  template: '<ng-content></ng-content>',
  styleUrls: ['./com-button.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses',
    '[attr.type]': 'buttonType',
    '[attr.disabled]': 'disabledAttr',
    '[attr.aria-disabled]': 'ariaDisabled',
    '[attr.tabindex]': 'hostTabIndex',
    '(click)': 'onClick($event)',
  },
})
export class ComButtonComponent implements OnChanges {
  @Input() size: IComButtonSize = 'medium';
  @Input() status: IComButtonStatus = 'basic';
  @Input() shape: IComButtonShape = 'rectangle';
  @Input() appearance: IComButtonAppearance = 'filled';

  @Input({ transform: booleanAttribute }) filled = false;
  @Input({ transform: booleanAttribute }) outline = false;
  @Input({ transform: booleanAttribute }) ghost = false;
  @Input({ transform: booleanAttribute }) hero = false;
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input({ transform: booleanAttribute }) disabled = false;

  constructor(private readonly hostElement: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    this.resolveAppearance();
  }

  get buttonType(): string | null {
    if (this.hostElement.nativeElement.tagName !== 'BUTTON') {
      return null;
    }

    return this.hostElement.nativeElement.getAttribute('type') ?? 'button';
  }

  get hostClasses(): string {
    return [
      'com-button',
      `appearance-${this.appearance}`,
      `status-${this.status}`,
      `size-${this.size}`,
      `shape-${this.shape}`,
      this.fullWidth ? 'full-width' : '',
      this.disabled ? 'btn-disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  get disabledAttr(): boolean | null {
    if (!this.isNativeButton()) {
      return null;
    }

    return this.disabled || null;
  }

  get ariaDisabled(): string | null {
    return this.disabled ? 'true' : null;
  }

  get hostTabIndex(): number | null {
    return this.disabled ? -1 : null;
  }

  onClick(event: Event): void {
    if (this.disabled && this.hostElement.nativeElement.tagName === 'A') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  private resolveAppearance(): void {
    if (this.hero) {
      this.appearance = 'hero';
      return;
    }

    if (this.outline) {
      this.appearance = 'outline';
      return;
    }

    if (this.ghost) {
      this.appearance = 'ghost';
      return;
    }

    if (this.filled) {
      this.appearance = 'filled';
    }
  }

  private isNativeButton(): boolean {
    const tag = this.hostElement.nativeElement.tagName;
    return tag === 'BUTTON' || tag === 'INPUT';
  }
}
