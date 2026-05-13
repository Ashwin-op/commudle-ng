---
title: Angular Development Standards
inclusion: always
---

# Angular Development Standards

## Technology Stack

### Core Framework

- **Angular 17.3.0** - Primary application framework
- **TypeScript 5.2.0** - Type-safe development
- **RxJS 7.8.0** - Reactive programming
- **Nx 18.2.0** - Monorepo management

### UI Framework

- **Nebular** - Primary UI component library with Eva Design System
- **Tailwind CSS 3.0.2** - Utility-first CSS framework
- **FontAwesome 6.4.0** - Icon library

## Component Development

### Component Structure

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'commudle-component-name',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.scss'],
})
export class ComponentNameComponent implements OnInit, OnDestroy {
  // Properties

  constructor() {}

  ngOnInit() {
    // Initialization logic
  }

  ngOnDestroy() {
    // Cleanup logic - ALWAYS unsubscribe from observables
  }
}
```

### Naming Conventions

#### Files

- **Component**: `kebab-case.component.ts`
- **Service**: `kebab-case.service.ts`
- **Model/Interface**: `kebab-case.model.ts`
- **Module**: `kebab-case.module.ts`

#### Classes

- **Component**: `PascalCase` + `Component` suffix
- **Service**: `PascalCase` + `Service` suffix
- **Interface**: `I` + `PascalCase`

#### Selectors

- **Format**: `commudle-[feature-name]`
- **Examples**: `commudle-user-profile`, `commudle-hackathon-form`

### Directory Structure

```
feature-modules/
  └── [feature-name]/
      ├── components/
      │   └── [component-name]/
      │       ├── [component-name].component.ts
      │       ├── [component-name].component.html
      │       ├── [component-name].component.scss
      │       └── [component-name].component.spec.ts
      ├── services/
      │   └── [service-name].service.ts
      ├── models/
      │   └── [model-name].model.ts
      └── [feature-name].module.ts
```

## Angular Best Practices

### Change Detection

- Use `OnPush` change detection strategy when possible
- Avoid unnecessary change detection cycles
- Use `ChangeDetectorRef` when manual detection is needed

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### Observable Management

- **ALWAYS** unsubscribe from observables in `ngOnDestroy`
- Use `takeUntil` pattern or `async` pipe
- Avoid nested subscriptions

```typescript
// Good: Using takeUntil
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => {});
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// Better: Using async pipe in template
data$ = this.service.getData();
```

### Lifecycle Hooks

- Use appropriate lifecycle hooks
- Keep logic minimal in constructor
- Initialize in `ngOnInit`, cleanup in `ngOnDestroy`

### Component Communication

- Use `@Input()` for parent-to-child
- Use `@Output()` with `EventEmitter` for child-to-parent
- Use services for sibling communication
- Keep components loosely coupled

## Code Generation Commands

```bash
# Create new component
npx nx g @nx/angular:component <component-name>

# Create new service
npx nx g @nx/angular:service <service-name>

# Create new interface
npx nx g @nx/angular:interface <interface-name>
```

## Development Workflow

### Development Server

```bash
npx nx run commudle-admin:serve
# Navigate to http://localhost:4200/
```

### Production Build

```bash
# Clear cache
npx nx reset

# Build for production
npx nx run prerender:release
```

### Testing

```bash
# Run tests
nx test

# Run linting
eslint --cache --fix

# Format code
prettier --write
```

## Performance Optimization

### Lazy Loading

- Use route-based lazy loading
- Load modules on demand
- Reduce initial bundle size

### Tree Shaking

- Import only what you need
- Avoid importing entire libraries
- Use ES6 module syntax

### Bundle Optimization

- Keep bundle sizes small
- Use code splitting
- Optimize images and assets

## Security Best Practices

### Input Validation

- Validate all user inputs
- Sanitize data before display
- Use Angular's built-in sanitization

### XSS Prevention

- Use Angular's template binding
- Avoid `innerHTML` when possible
- Use `DomSanitizer` when needed

### Authentication

- Implement proper authentication
- Use JWT tokens securely
- Handle token expiration

## Error Handling

### HTTP Errors

```typescript
this.http
  .get(url)
  .pipe(
    catchError((error) => {
      console.error('Error:', error);
      return throwError(() => error);
    }),
  )
  .subscribe();
```

### Global Error Handler

- Implement custom error handler
- Log errors appropriately
- Show user-friendly messages

## Testing Guidelines

### Unit Tests

- Test component logic
- Mock dependencies
- Test edge cases
- Aim for meaningful coverage

### Component Testing

```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Code Quality Checklist

- [ ] Component follows single responsibility principle
- [ ] Proper lifecycle hooks used
- [ ] OnPush change detection where appropriate
- [ ] Observables properly unsubscribed
- [ ] Type safety maintained
- [ ] No console.log statements in production code
- [ ] Error handling implemented
- [ ] Code is well-documented
- [ ] Tests are written and passing
- [ ] Follows naming conventions

## Common Pitfalls to Avoid

### DON'T ❌

- Don't use `any` type
- Don't forget to unsubscribe from observables
- Don't manipulate DOM directly (use Renderer2)
- Don't use `console.log` in production
- Don't create memory leaks
- Don't ignore TypeScript errors
- Don't use inline styles
- Don't hardcode values

### DO ✅

- Use proper TypeScript types
- Unsubscribe from observables
- Use Angular's built-in directives
- Remove debug statements
- Clean up resources
- Fix all TypeScript errors
- Use SCSS files for styling
- Use configuration/constants

## Integration with External Services

### API Communication

- Use Angular HttpClient
- Implement interceptors for common logic
- Handle errors gracefully
- Use environment variables for endpoints

### Third-Party Libraries

- Check compatibility with Angular version
- Use Angular-specific wrappers when available
- Follow library documentation
- Keep dependencies updated

## Accessibility

### ARIA Labels

- Add proper ARIA labels
- Use semantic HTML
- Ensure keyboard navigation
- Test with screen readers

### Focus Management

- Manage focus appropriately
- Provide visible focus indicators
- Support keyboard shortcuts

## Documentation

### Code Comments

- Explain why, not what
- Document complex logic
- Keep comments up-to-date
- Use JSDoc for public APIs

### Component Documentation

- Document inputs and outputs
- Provide usage examples
- Explain configuration options
- Document breaking changes
