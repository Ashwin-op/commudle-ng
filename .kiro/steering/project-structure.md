---
title: Project Structure
inclusion: always
---

# Project Structure

## Overview

Commudle is built as an Nx monorepo workspace with a modular architecture following Angular best practices with clear separation of concerns.

## Root Directory Structure

```
commudle-ng/
├── apps/                    # Applications and shared modules
├── libs/                    # Reusable libraries
├── tools/                   # Build tools and scripts
├── deploy/                  # Deployment configurations
├── prod-server/            # Production server artifacts
└── Configuration files     # Root-level configs
```

## Apps Directory

### Main Application

- **commudle-admin/**: Primary Angular application (SSR + PWA enabled)

### Supporting Applications

- **commudle-admin-e2e/**: End-to-end tests (Cypress)
- **lib-error-handler/**: Error handling library
- **prerender/**: SSR prerendering service

### Shared Modules (`apps/shared-*`)

- **shared-components/**: Reusable UI components (alerts, badges, banners, cards, forms, chat, etc.)
- **shared-directives/**: Directives (breakpoints, click-outside, lazy-load-images, longpress, etc.)
- **shared-models/**: TypeScript interfaces and types (enums, stats, core entities)
- **shared-pipes/**: Data transformation pipes (safe-html, truncate-text, group-by, etc.)
- **shared-services/**: Core business logic services (auth, API routes, SEO, notifications, websockets)
- **shared-modules/**: Feature modules (hms-video, infinite-scroll, mention, mini-user-profile)
- **shared-helper-modules/**: Helper utilities
- **shared-interceptors/**: HTTP interceptors
- **shared-resolvers/**: Route resolvers

## Libs Directory

- **auth/**: Authentication library
- **editor/**: Rich text editor (TinyMCE + Tiptap)
- **in-viewport/**: Viewport detection
- **infinite-scroll/**: Infinite scroll
- **ngx-datatable/**: Data table library
- **shared/**: Common utilities (channels, components, environments, models, services, validators)

## Architectural Patterns

### Module Organization

- **Feature Modules**: Organized by business domain
- **Shared Modules**: Reusable across features
- **Lazy Loading**: Route-based code splitting

### Component Architecture

- **Smart/Container Components**: Handle business logic and state
- **Presentational Components**: Pure UI components
- **Standalone Components**: Modern Angular standalone pattern

### Service Layer

- **API Services**: HTTP communication with backend
- **State Services**: Application state management via RxJS Subject/BehaviorSubject
- **Utility Services**: Helper functions

### Styling Architecture

- **Tailwind CSS** with `com-` prefix for utilities
- **SCSS** for component-scoped styles
- **Nebular Theme** via `@commudle/theme`
- **Nested hierarchy** for parent-child class nesting

## Key Configuration Files

- **nx.json**: Nx workspace configuration
- **package.json**: Dependencies and scripts
- **tsconfig.base.json**: Base TypeScript configuration (path aliases)
- **tailwind.preset.js**: Tailwind CSS preset
- **jest.config.ts**: Jest testing configuration
- **eslint.config.mjs**: ESLint configuration

## Import Patterns

- **@commudle/shared-services**: Service barrel exports
- **@commudle/shared-models**: Model barrel exports
- **@commudle/theme**: Nebular components (custom fork, never use @nebular/theme)

## Development Commands

```bash
# Development server
npx nx run commudle-admin:serve  # http://localhost:4200/

# Production build
npx nx reset && npx nx run prerender:release

# Testing
nx test

# Linting
eslint --cache --fix

# Code generation
npx nx g @nx/angular:component <name>
npx nx g @nx/angular:service <name>
```

## Deployment

- **Target**: AWS Elastic Beanstalk
- **Artifact**: prod-server.zip (browser/ + server/ + tinymce/)
- **Runtime**: Node.js with Express for SSR
