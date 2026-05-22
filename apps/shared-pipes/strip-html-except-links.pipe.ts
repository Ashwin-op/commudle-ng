import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Pipe, PipeTransform, PLATFORM_ID } from '@angular/core';

@Pipe({
  name: 'stripHtmlExceptLinks',
  standalone: false,
})
export class StripHtmlExceptLinksPipe implements PipeTransform {
  constructor(@Inject(PLATFORM_ID) private platformId: object, @Inject(DOCUMENT) private document: Document) {}

  transform(value: string): string {
    if (!value) return '';

    let decoded = value;
    if (isPlatformBrowser(this.platformId)) {
      // Decode HTML entities via DOM (browser only)
      const el = this.document.createElement('span');
      el.innerHTML = value;
      decoded = el.innerHTML;
    }

    // Remove all HTML tags except <a> tags
    return decoded.replace(/<(?!\/?a\b)[^>]*>/gi, '');
  }
}
