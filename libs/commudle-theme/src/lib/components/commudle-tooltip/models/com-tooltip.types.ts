import type { TemplateRef } from '@angular/core';

export type IComTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type IComTooltipSize = 'sm' | 'md' | 'lg';
export type IComTooltipVariant = 'default' | 'card';
export type IComTooltipContent = string | TemplateRef<unknown>;

export const TOOLTIP_SIZES: Record<IComTooltipSize, number> = { sm: 160, md: 240, lg: 360 };
export const TOOLTIP_ANIM_MS = 300;
export const TOOLTIP_DOT_SIZE = 6;
export const TOOLTIP_DOT_GAP = 3;

export const TOOLTIP_COLORS = {
  primary: { from: '#5270ff', to: '#3495ff', edge: '#5270ff', glow: 'rgba(60, 120, 252, 0.40)' },
  basic: { from: '#5b6478', to: '#3b4254', edge: '#262b38', glow: 'rgba(59, 66, 84, 0.40)' },
  info: { from: '#4cc9ff', to: '#0095ff', edge: '#0072c6', glow: 'rgba(0, 149, 255, 0.40)' },
  success: { from: '#3ddc84', to: '#00b86b', edge: '#008a4e', glow: 'rgba(0, 184, 107, 0.40)' },
  warning: { from: '#ffc65c', to: '#ff9f00', edge: '#c77800', glow: 'rgba(255, 159, 0, 0.40)' },
  danger: { from: '#ff6b81', to: '#e5304f', edge: '#b01e38', glow: 'rgba(229, 48, 79, 0.40)' },
  white: { from: '#ffffff', to: '#eef2f7', edge: '#d5dbe5', glow: 'rgba(15, 23, 42, 0.15)', text: '#1f2937' },
} as const;

export type IComTooltipStatus = keyof typeof TOOLTIP_COLORS;
