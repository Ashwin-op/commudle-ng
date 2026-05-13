---
title: Technology Stack
inclusion: always
---

# Technology Stack

## Core Technologies

- **Angular**: 19.2.9 (SSR + PWA)
- **TypeScript**: ~5.8.0
- **Nx**: 21.6.2 (monorepo management)
- **RxJS**: ~7.8.0
- **Node.js**: 18+

## UI Framework & Styling

- **Tailwind CSS**: ^3.0.2 (custom prefix: `com-`, preset: `tailwind.preset.js`)
  - Plugins: aspect-ratio, typography, tailwindcss-animated, scrollbar-hide
- **Nebular (Custom Fork)**: @commudle/theme 15.0.0
- **SCSS**: Component-scoped styles
- **PostCSS**: ^8.4.5

## Icons

- **FontAwesome**: @fortawesome/angular-fontawesome ^1.0.0
- **Eva Icons**: @commudle/eva-icons 15.0.0

## Rich Text Editors

- **TinyMCE**: @tinymce/tinymce-angular ^7.0.0
- **Tiptap**: @tiptap/core ^2.11.7

## Real-time Communication

- **ActionCable**: ^5.2.8-1 (WebSocket)
- **@anycable/web**: ^0.7.3

## Content & Media

- **ngx-markdown**: ^19.1.1
- **prismjs**: ^1.29.0 (syntax highlighting)
- **100ms Live Video**: @100mslive/hms-video-store 0.11.0
- **@angular/youtube-player**: 19.2.9
- **lean-qr**: ^2.3.4
- **@zxing/ngx-scanner**: 19.0.0 (barcode scanning)

## UI Components & Utilities

- **@ngneat/helipopper**: ^8.0.3 (tooltips)
- **@ctrl/ngx-emoji-mart**: ^9.2.0 (emoji picker)
- **lottie-web**: ^5.12.2 (animations)
- **canvas-confetti**: ^1.9.2

## Maps & Location

- **@angular/google-maps**: 19.2.9

## Payment Processing

- **@stripe/stripe-js**: ^8.0.0
- **ngx-stripe**: ^19.7.0

## CMS Integration

- **@sanity/client**: ^6.14.0

## Utilities

- **moment**: ^2.30.1 / **moment-timezone**: ^0.5.45
- **lodash**: ^4.17.21
- **uuid**: ^9.0.1
- **chart.js**: ^2.9.4

## Server-Side

- **express**: 4.21.2
- **@angular/ssr**: 19.2.9
- **compression**: ^1.7.4

## Monitoring

- **@sentry/angular**: ^9.40.0

## Testing

- **Jest**: ^29.4.1 / **jest-preset-angular**: 14.6.1
- **Cypress**: 14.5.4

## Code Quality

- **ESLint**: ^9.0.0 with Angular and TypeScript plugins
- **Prettier**: ^2.6.2
- **Husky**: ^9.0.11 (git hooks)
- **@commitlint/cli**: ^19.8.1

## Build & Optimization

- **@angular-builders/custom-webpack**: ~19.0.0
- **compression-webpack-plugin**: ^11.0.0
- **ng-packagr**: 19.2.2

## Environment Requirements

- Node.js 18+, npm 9+
- Production: AWS Elastic Beanstalk
- Backend API: commudle.com (RESTful + WebSocket)
