---
title: Development Guidelines
inclusion: always
---

# Development Guidelines

## Code Quality Standards

### File Organization

- **One component/service/pipe per file**: Each file contains a single Angular artifact
- **Descriptive file naming**: Use kebab-case for file names matching the class name
  - Components: `component-name.component.ts`
  - Services: `service-name.service.ts`
  - Pipes: `pipe-name.pipe.ts`
  - Models: `model-name.model.ts`
- **Colocation**: Keep related files together (component, template, styles, spec)

### Code Formatting

- **Indentation**: 2 spaces (no tabs)
- **Line length**: Aim for 120 characters maximum
- **Semicolons**: Required at end of statements
- **Quotes**: Single quotes for strings
- **Trailing commas**: Used in multi-line objects and arrays

### Naming Conventions

#### TypeScript Classes and Interfaces

- **Classes**: PascalCase with descriptive suffixes
  - Components: `FillDataFormPaidComponent`
  - Services: `DataFormEntitiesService`
  - Pipes: `SafeHtmlPipe`
- **Interfaces**: PascalCase with `I` prefix
  - `IPositionStats`, `IScrollerDistance`, `IDataFormEntity`
- **Enums**: PascalCase with `E` prefix
  - `EDbModels`, `EBuildType`

#### Variables and Functions

- **Variables**: camelCase with descriptive names
  - Boolean variables: prefix with `is`, `has`, `should`, `can`
    - `isFormDirty`, `hasRefundPolicy`, `shouldFireScrollEvent`
- **Functions**: camelCase with verb prefixes
  - `getDataFormEntity()`, `fetchPaidTicketingData()`, `updateUserDetails()`
- **Constants**: UPPER_SNAKE_CASE or camelCase for complex objects

#### CSS/SCSS Classes

- **Always use kebab-case**: `.fill-data-form-paid`, `.payment-dialog`
- **Never use BEM notation**: Avoid `__` and `--` separators
- **Component-scoped**: Prefix with component name
- **Nested hierarchy**: Always nest child classes under parent

### TypeScript Standards

#### Type Safety

- **Explicit typing**: Always declare types for function parameters and return values
- **Interface usage**: Define interfaces for all data structures
- **Avoid `any`**: Use specific types or `unknown` when type is truly dynamic
- **Optional properties**: Use `?` for optional interface properties

#### Modern TypeScript Features

- **Arrow functions**: Preferred for callbacks and short functions
- **Destructuring**: Extract properties from objects
- **Spread operator**: For object and array manipulation
- **Template literals**: For string interpolation
- **Optional chaining**: Safe property access
- **Nullish coalescing**: Default values

## Angular-Specific Patterns

### Component Class Organization

```typescript
export class ComponentName implements OnInit, OnDestroy, AfterViewInit {
  // 1. Input/Output decorators
  @Input() existingResponses;
  @Output() formSubmitted = new EventEmitter();

  // 2. ViewChild/ViewChildren decorators
  @ViewChild('paymentDialog', { static: true }) paymentDialog: TemplateRef<any>;

  // 3. Public properties
  dataFormEntity: IDataFormEntity;

  // 4. Private properties
  private destroy$ = new Subject<void>();

  // 5. Constructor with dependency injection
  constructor(private activatedRoute: ActivatedRoute, private dataFormEntitiesService: DataFormEntitiesService) {}

  // 6. Lifecycle hooks
  ngOnInit() {}
  ngAfterViewInit() {}
  ngOnDestroy() {}

  // 7. Public methods
  submitForm() {}

  // 8. Private methods
  private setupCurrentUser() {}
}
```

### RxJS and Observables

#### Subscription Management

- **Subject for cleanup**: Use `Subject` with `takeUntil` for automatic unsubscription

```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.authWatchService.currentUser$
    .pipe(takeUntil(this.destroy$))
    .subscribe((data) => {
      this.currentUser = data;
    });
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Forms

#### Reactive Forms Pattern

```typescript
forms: FormGroup[] = [];

addNewUser() {
  const newForm = this.fb.group({
    additional_users: this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    }),
  });
  this.forms.push(newForm);
}
```

## Error Handling

### User Feedback

- **Toast notifications**: Use `LibToastLogService` for user feedback
- **Dialog modals**: Use `NbDialogService` for important messages
- **Dialog close button**: **ALWAYS** add a close (×) button in `nb-card-header` for every dialog/popup

```html
<nb-card-header class="com-flex com-justify-between com-items-center">
  <span>Dialog Title</span>
  <button ghost nbButton size="small" (click)="ref.close()" shape="round">
    <nb-icon icon="close"></nb-icon>
  </button>
</nb-card-header>
```

## Performance Optimization

### Lazy Loading

- **Dynamic imports**: Use for heavy libraries

```typescript
ngAfterViewInit(): void {
  import('lottie-web').then((l) => {
    l.default.loadAnimation({
      container: this.consentAnimationContainer?.nativeElement,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: 'https://lottie.host/animation.json',
    });
  });
}
```

### Change Detection

- **OnPush strategy**: Consider for performance-critical components
- **Immutable data**: Prefer immutable updates for better change detection

## Best Practices Summary

1. **Type everything**: Use TypeScript's type system fully
2. **Unsubscribe observables**: Always clean up subscriptions
3. **Pure functions**: Prefer stateless, predictable functions
4. **Small components**: Keep components focused and manageable
5. **Service layer**: Business logic belongs in services
6. **Error handling**: Always handle errors gracefully
7. **User feedback**: Provide clear feedback for all actions
8. **Performance**: Lazy load heavy dependencies
9. **SEO**: Set appropriate meta tags for all pages
10. **Code organization**: Follow consistent file and class structure
11. **Import management**: Use barrel exports and path aliases
12. **Naming conventions**: Follow established patterns consistently
