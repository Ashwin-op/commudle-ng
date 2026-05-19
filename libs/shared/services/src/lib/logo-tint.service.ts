import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { IAttachedFile } from '@commudle/shared-models';

const LOGO_WRAP_OPACITY = 0.25;
const LOGO_GRADIENT_OPACITY = 0.75;

export interface ILogoTint {
  wrap: string;
  gradient: string;
}

type LogoSource = { logo_image?: IAttachedFile; logo_image_path?: IAttachedFile };
type Rgb = readonly [number, number, number];

function logoUrl(logo: LogoSource): string | undefined {
  return logo.logo_image_path?.i64 || logo.logo_image?.i64;
}

function cacheKey(url: string): string {
  try {
    const { pathname } = new URL(url);
    const blobId = pathname.match(/\/blobs\/(?:redirect\/)?([^/]+)/)?.[1];
    return blobId ? `blob:${blobId}` : pathname;
  } catch {
    return url.replace(/\?.*$/, '');
  }
}

function tintColor(r: number, g: number, b: number, opacity: number, rgba: boolean): string {
  if (r >= 230 && g >= 230 && b >= 230) {
    return rgba ? `rgba(255, 255, 255, ${opacity})` : `rgb(255 255 255 / ${opacity})`;
  }
  return rgba ? `rgba(${r}, ${g}, ${b}, ${opacity})` : `rgb(${r} ${g} ${b} / ${opacity})`;
}

function toLogoTint([r, g, b]: Rgb): ILogoTint {
  return {
    wrap: tintColor(r, g, b, LOGO_WRAP_OPACITY, true),
    gradient: tintColor(r, g, b, LOGO_GRADIENT_OPACITY, false),
  };
}

@Injectable({ providedIn: 'root' })
export class LogoTintService {
  private readonly tints = new Map<string, Rgb>();

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  resolveTints<TId extends string | number>(
    requests: { id: TId; logo: LogoSource }[],
  ): Promise<Record<TId, ILogoTint>> {
    if (!isPlatformBrowser(this.platformId) || !requests.length) {
      return Promise.resolve({} as Record<TId, ILogoTint>);
    }

    const urlsByKey = new Map<string, string>();
    for (const { logo } of requests) {
      const url = logoUrl(logo);
      if (url) {
        urlsByKey.set(cacheKey(url), url);
      }
    }

    return Promise.all([...urlsByKey].map(([key, url]) => this.sample(key, url))).then(() => {
      const result = {} as Record<TId, ILogoTint>;
      for (const { id, logo } of requests) {
        const url = logoUrl(logo);
        const rgb = url ? this.tints.get(cacheKey(url)) : undefined;
        if (rgb) {
          result[id] = toLogoTint(rgb);
        }
      }
      return result;
    });
  }

  private async sample(key: string, url: string): Promise<void> {
    if (this.tints.has(key)) {
      return;
    }

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = () => resolve(el);
        el.onerror = () => reject();
        el.src = url;
      });
      const { getColorSync } = await import('colorthief');
      const { r, g, b } = getColorSync(img, { ignoreWhite: true, quality: 10, colorSpace: 'rgb' })?.rgb() ?? {
        r: 255,
        g: 255,
        b: 255,
      };
      this.tints.set(key, [r, g, b]);
    } catch {
      console.warn('[LogoTint] Could not sample logo color', url);
    }
  }
}
