# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- Add to memory before any code read all root level md files

## Commands

```bash
# Development server (http://localhost:4200/)
npx nx run commudle-admin:serve

# Production SSR build
npx nx run commudle-admin:release

# Run tests for a specific project
npx nx test <project-name>

# Lint a specific project
npx nx lint <project-name>

# Clear Nx cache
npx nx reset

# Generate Angular artifacts
npx nx g @nx/angular:component <component-name>
npx nx g @nx/angular:service <service-name>
npx nx g @nx/angular:interface <interface-name>
```

## Architecture

This is an **Nx monorepo** for Commudle — a community management platform for tech communities. Built with Angular 19, SSR via Angular Universal, PWA, and a custom Nebular fork (`@commudle/theme`).

### Key directories

- `apps/commudle-admin/` — main Angular app; feature modules live under `src/app/feature-modules/`
- `apps/shared-*/` — shared code partitioned by type: `shared-components`, `shared-services`, `shared-models`, `shared-pipes`, `shared-directives`, `shared-modules`
- `libs/` — publishable libraries: `auth`, `editor`, `in-viewport`, `infinite-scroll`, `ngx-datatable`, `shared/`
- `apps/commudle-admin-e2e/` — Cypress E2E tests

### Import conventions

Path aliases are configured in `tsconfig.base.json`. Always use barrel imports:

- `@commudle/shared-services` for services
- `@commudle/shared-models` for models
- `@commudle/theme` for UI components — **never** `@nebular/theme`

Import order: Angular core → third-party → app services → app models → app components.

## Angular Patterns

### Component structure

```typescript
@Component({
  selector: 'commudle-feature-name',
  templateUrl: './feature-name.component.html',
  styleUrls: ['./feature-name.component.scss'],
  standalone: false, // explicit for module-based components
})
export class FeatureNameComponent implements OnInit, OnDestroy {
  @Input() someInput: string;
  @Output() someEvent = new EventEmitter();

  private destroy$ = new Subject<void>();

  constructor(private someService: SomeService) {}

  ngOnInit() {
    this.someService
      .getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.data = data;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Naming conventions

- Interfaces: `I` prefix — `ICurrentUser`, `ICommunity`
- Enums: `E` prefix — `EDbModels`
- Boolean variables: `is`, `has`, `should`, `can` prefixes
- Component selectors: `commudle-` prefix

### Dialogs

Every dialog/popup **must** include a close button in `nb-card-header`:

```html
<nb-card-header class="com-flex com-justify-between com-items-center">
  <span>Title</span>
  <button ghost nbButton size="small" (click)="ref.close()" shape="round">
    <nb-icon icon="close"></nb-icon>
  </button>
</nb-card-header>
```

### User feedback

Use `LibToastLogService` for toast notifications: `successDialog()`, `warningDialog()`, `dangerDialog()`.

## Styling

Tailwind is configured with a `com-` prefix — **all** utility classes must use it:

```scss
// ✅ Correct
@apply com-flex com-items-center com-gap-4;
@apply hover:com-bg-primary-500;

// ❌ Wrong — missing prefix
@apply flex items-center;

// ❌ Wrong — prefix order inverted
@apply com-hover:bg-primary-500;
```

Only use colors defined in `tailwind.preset.js` — no arbitrary values like `com-bg-[#ff0000]`. Available families: `primary-100`–`primary-900`, `gray-50`–`gray-900`, named colors (`Yankees-Blue`, `Bright-Gray`, `Infra-Red`, `Cadet-Grey`).

Never use inline styles in HTML templates — always use component `.scss` files. Max nesting depth: 3 levels.

## Commit Conventions

Format: `type(scope): description` — imperative mood, lowercase, no trailing period, max 50 chars.

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `hotfix`

Common scopes: `admin`, `hackathon`, `user`, `auth`, `ui`, `shared`

Husky + commitlint enforce this on every commit. To enable hooks after cloning: `chmod ug+x .husky/*`

## Branch Naming

Prefix with type: `feat/`, `fix/`, `hotfix/`, `upgrade/`, `docs/`, `chore/`, `exp/`, `spike/`  
Use lowercase kebab-case, keep under 20 characters. PRs target the `development` branch.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
