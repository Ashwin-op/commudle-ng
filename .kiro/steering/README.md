---
title: Kiro Steering Rules Overview
inclusion: always
---

# Kiro Steering Rules for Commudle Project

This directory contains steering rules that guide Kiro's behavior when working on the Commudle project. These rules are automatically loaded and applied to ensure consistent, high-quality code that follows project standards.

## Active Steering Rules

### 1. **styling-guidelines.md**

CSS and styling standards using Tailwind CSS. Key: no inline styles, `com-` prefix, preset colors only, nested hierarchy, mobile-first.

### 2. **angular-development.md**

Angular development standards and best practices. Key: component structure, naming conventions, observable management, OnPush change detection.

### 3. **reusable-components.md**

Guidelines for creating truly reusable, self-contained Angular components. Key: self-contained functionality, standalone components, configuration over implementation.

### 4. **git-and-code-review.md**

Git commit conventions and code review standards. Key: conventional commits, branch naming, PR descriptions, review checklists.

### 5. **imports.md**

Import guidelines. Key: always use `@commudle/theme` (never `@nebular/theme`), barrel exports from `@commudle/shared-services` and `@commudle/shared-models`, import organization order.

### 6. **seo-meta-tags.md**

SEO meta tags guidelines. Key: all routed components must set SEO tags, title/description format, OG image fallbacks, noIndex for private pages.

### 7. **development-guidelines.md**

Code quality standards and Angular-specific patterns. Key: file organization, naming conventions, TypeScript standards, RxJS patterns, error handling, performance optimization.

### 8. **product-overview.md**

Product context about Commudle platform. Key: community management platform for tech communities, features overview, target users.

### 9. **tech-stack.md**

Technology stack reference. Key: Angular 19.2.9, Nx 21.6.2, Tailwind CSS, Nebular, and all major dependencies with versions.

### 10. **project-structure.md**

Project structure and architecture. Key: Nx monorepo layout, apps/libs organization, import patterns, development commands.

## How Steering Rules Work

- All `.md` files in `.kiro/steering/` with `inclusion: always` are automatically loaded
- Rules guide behavior but don't override explicit user instructions
- Workspace-level rules take precedence over global rules

## Quick Reference

### Creating Components

```typescript
@Component({
  selector: 'commudle-component-name',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.scss']
})
```

### Styling

```scss
.button {
  @apply com-px-4 com-py-2 com-rounded-md;
  @apply hover:com-bg-primary-600 focus:com-ring-2;
}
```

### Git Commits

```bash
git commit -m "feat(data-table): add column resize functionality"
```

### Imports

```typescript
import { NbDialogService } from '@commudle/theme';
import { AuthService } from '@commudle/shared-services';
import { ICurrentUser } from '@commudle/shared-models';
```
