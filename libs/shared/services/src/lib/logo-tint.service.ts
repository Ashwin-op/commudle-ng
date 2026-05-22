import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { IAttachedFile } from '@commudle/shared-models';

const LOGO_WRAP_OPACITY = 0.25;
const LOGO_GRADIENT_OPACITY = 0.75;
const LOGO_BORDER_OPACITY = 0.3;
const NEAR_WHITE_THRESHOLD = 230;

/** Seashell (#FFF6EB) — default wrap + gradient (matches theme + SCSS fallbacks). */
const DEFAULT_TINT_RGB: Rgb = [255, 246, 235];
/** Bright-Gray (#E4E9F2) — logo wrap when sampled color is near-white. */
const NEAR_WHITE_WRAP_RGB: Rgb = [228, 233, 242];
/** Bright-Gray — default card border (#E4E9F2). */
const DEFAULT_BORDER_RGB: Rgb = [228, 233, 242];

const DEFAULT_LOGO_TINT: Readonly<ILogoTint> = {
  wrap: `rgba(${DEFAULT_TINT_RGB[0]}, ${DEFAULT_TINT_RGB[1]}, ${DEFAULT_TINT_RGB[2]}, ${LOGO_WRAP_OPACITY})`,
  gradient: `rgb(${DEFAULT_TINT_RGB[0]} ${DEFAULT_TINT_RGB[1]} ${DEFAULT_TINT_RGB[2]} / 0.16)`,
  border: `rgba(${DEFAULT_BORDER_RGB[0]}, ${DEFAULT_BORDER_RGB[1]}, ${DEFAULT_BORDER_RGB[2]}, ${LOGO_BORDER_OPACITY})`,
};

export interface ILogoTint {
  wrap: string;
  gradient: string;
  border: string;
}

type LogoSource = { logo_image?: IAttachedFile; logo_image_path?: IAttachedFile };
type Rgb = readonly [number, number, number];

function logoUrl(logo: LogoSource): string | undefined {
  for (const file of [logo.logo_image, logo.logo_image_path]) {
    if (!file) {
      continue;
    }
    const url = file.i64 || file.url;
    if (url) {
      return url;
    }
  }
  return undefined;
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

function isNearWhite(r: number, g: number, b: number): boolean {
  return r >= NEAR_WHITE_THRESHOLD && g >= NEAR_WHITE_THRESHOLD && b >= NEAR_WHITE_THRESHOLD;
}

function tintColor(r: number, g: number, b: number, opacity: number, rgba: boolean): string {
  return rgba ? `rgba(${r}, ${g}, ${b}, ${opacity})` : `rgb(${r} ${g} ${b} / ${opacity})`;
}

function toLogoTint([r, g, b]: Rgb): ILogoTint {
  if (isNearWhite(r, g, b)) {
    return {
      wrap: tintColor(NEAR_WHITE_WRAP_RGB[0], NEAR_WHITE_WRAP_RGB[1], NEAR_WHITE_WRAP_RGB[2], 1, true),
      gradient: DEFAULT_LOGO_TINT.gradient,
      border: DEFAULT_LOGO_TINT.border,
    };
  }
  return {
    wrap: tintColor(r, g, b, LOGO_WRAP_OPACITY, true),
    gradient: tintColor(r, g, b, LOGO_GRADIENT_OPACITY, false),
    border: tintColor(r, g, b, LOGO_BORDER_OPACITY, true),
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
      const { getColorSync, getPaletteSync } = await import('colorthief');
      const options = { ignoreWhite: true, quality: 10, colorSpace: 'rgb' as const };

      let rgb: Rgb | undefined;
      const palette = getPaletteSync(img, { ...options, colorCount: 8 });
      if (palette?.length) {
        for (const entry of palette) {
          const { r, g, b } = entry.rgb();
          if (!isNearWhite(r, g, b)) {
            rgb = [r, g, b];
            break;
          }
        }
      }

      if (!rgb) {
        const dominant = getColorSync(img, options)?.rgb();
        if (dominant && !isNearWhite(dominant.r, dominant.g, dominant.b)) {
          rgb = [dominant.r, dominant.g, dominant.b];
        }
      }

      this.tints.set(key, rgb ?? [255, 255, 255]);
    } catch {
      console.warn('[LogoTint] Could not sample logo color', url);
      this.tints.set(key, [255, 255, 255]);
    }
  }
}
