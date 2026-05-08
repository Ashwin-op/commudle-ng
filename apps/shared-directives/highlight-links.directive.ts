import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appHighlightLinks]',
  standalone: false,
})
export class HighlightLinksDirective {
  private readonly id;
  private readonly linkTokenRegex = /\b((?:https?:\/\/|ftp:\/\/|file:\/\/|www\.)[^\s<]+)/gi;

  constructor(private elementRef: ElementRef) {
    this.id = setTimeout(() => this.getText());
  }

  getText(): void {
    this.elementRef.nativeElement.innerHTML = this.highlightText(this.elementRef.nativeElement.innerHTML);
    clearTimeout(this.id);
  }

  highlightText(text: string): string {
    const safeContent = (text ?? '').replace(this.linkTokenRegex, (rawUrl) => {
      const href = this.toSafeExternalUrl(rawUrl);
      if (!href) {
        return rawUrl;
      }
      return `<a href='${href}' target='_blank' rel='noopener noreferrer'>${rawUrl}</a>`;
    });
    return safeContent.replace(/\n/g, '<br/>');
  }

  private toSafeExternalUrl(value: string): string | null {
    try {
      const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value) ? value : `https://${value}`;
      const parsed = new URL(normalized);
      if (!['http:', 'https:', 'ftp:', 'file:'].includes(parsed.protocol)) {
        return null;
      }
      return parsed.href;
    } catch {
      return null;
    }
  }
}
