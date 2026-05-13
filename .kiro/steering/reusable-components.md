---
title: Reusable Component Development Guidelines
inclusion: always
---

# Reusable Component Development Guidelines

When creating reusable components in this Angular project, follow these principles to ensure components are truly reusable, maintainable, and self-contained.

## Core Principles

### 1. Self-Contained Functionality

- **All logic should be internal**: Components should handle their own state, events, and behavior without requiring external implementation
- **No external dependencies for core features**: Features like resize, sort, filter should work out-of-the-box
- **Minimal parent component involvement**: Parent components should only provide data and configuration, not implement component logic

### 2. Standalone Components

- **Use Angular standalone components**: Import `standalone: true` in the component decorator
- **Explicit imports**: Import all required modules directly in the component
- **No module dependencies**: Component should work without being declared in a module

### 3. Configuration Over Implementation

- **Use configuration objects**: Provide a config interface for customization
- **Sensible defaults**: All configuration should have reasonable default values
- **Optional features**: Features should be opt-in via configuration flags

### 4. Template Flexibility

- **Support custom templates**: Use `TemplateRef` for customizable content
- **Content projection**: Use `ng-content` with slots for flexible layouts
- **Default templates**: Always provide default templates as fallback

## Component Structure Template

```typescript
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ComponentConfig {
  feature1?: boolean;
  feature2?: boolean;
  // ... with sensible defaults
}

@Component({
  selector: 'app-reusable-component',
  standalone: true,
  imports: [CommonModule /* other required modules */],
  templateUrl: './component.html',
  styleUrls: ['./component.scss'],
})
export class ReusableComponent implements OnInit, OnDestroy {
  // Inputs - data and configuration
  @Input() data: any[] = [];
  @Input() config: ComponentConfig = {};
  @Input() customTemplate?: TemplateRef<unknown>;

  // Outputs - optional events for external tracking
  @Output() actionPerformed = new EventEmitter<any>();

  // Internal state
  private defaultConfig: ComponentConfig = {
    feature1: true,
    feature2: false,
  };

  ngOnInit() {
    // Merge user config with defaults
    this.config = { ...this.defaultConfig, ...this.config };
    // Initialize component
  }

  // Internal methods - handle all logic
  private handleInternalLogic() {
    // All logic here, not in parent
  }

  ngOnDestroy() {
    // Cleanup
  }
}
```

## Best Practices

### DO ✅

1. **Handle all internal logic**

   ```typescript
   // Good: Component handles resize internally
   startResize(event: MouseEvent) {
     this.updateColumnWidth();
     this.emit({ optional: 'tracking' });
   }
   ```

2. **Provide configuration interfaces**

   ```typescript
   export interface TableConfig {
     resizable?: boolean;
     sortable?: boolean;
     filterable?: boolean;
   }
   ```

3. **Use sensible defaults**

   ```typescript
   defaultConfig = {
     resizable: true,
     sortable: true,
     filterable: false,
   };
   ```

4. **Support custom templates**

   ```typescript
   @Input() headerTemplate?: TemplateRef<unknown>;
   @Input() cellTemplate?: TemplateRef<unknown>;
   ```

5. **Make outputs optional**
   ```typescript
   // Optional: Only for external tracking
   @Output() columnResize = new EventEmitter<{column: string, width: number}>();
   ```

### DON'T ❌

1. **Don't require external implementation**

   ```typescript
   // Bad: Requires parent to implement resize logic
   @Output() resizeStart = new EventEmitter<MouseEvent>();
   @Output() resizeMove = new EventEmitter<MouseEvent>();
   @Output() resizeEnd = new EventEmitter<void>();
   ```

2. **Don't expose internal state unnecessarily**

   ```typescript
   // Bad: Exposing internal state
   @Input() isResizing: boolean;
   @Input() currentColumn: string;
   ```

3. **Don't require parent to manage component state**

   ```typescript
   // Bad: Parent must track expanded rows
   @Input() expandedRows: Set<number>;
   ```

4. **Don't create tight coupling**
   ```typescript
   // Bad: Component depends on parent's methods
   @Input() onResize: (column: string, width: number) => void;
   ```

## Component Location

- **Shared components**: `apps/commudle-admin/src/app/app-shared-components/`
- **Feature-specific**: Keep in feature module if not reusable
- **Library components**: Consider moving to `libs/` if used across multiple apps

## Documentation Requirements

Every reusable component must include:

1. **README.md** with:

   - Component description
   - Features list
   - Usage examples (basic and advanced)
   - API reference (inputs, outputs, interfaces)
   - Configuration options
   - Browser support

2. **Example component** showing:

   - Basic usage
   - Advanced usage with custom templates
   - All configuration options

3. **TypeScript interfaces** for:
   - Configuration objects
   - Data models
   - Event payloads

## Testing Reusability

Before considering a component "reusable", verify:

- [ ] Can be used without any external logic implementation
- [ ] Works with default configuration
- [ ] All features work out-of-the-box
- [ ] Parent component only provides data and config
- [ ] No tight coupling to specific use cases
- [ ] Properly cleans up resources on destroy
- [ ] Documented with examples

## Example: Data Table Component

✅ **Good Implementation**:

```html
<!-- Parent component only provides data and config -->
<app-data-table [columns]="columns" [rows]="rows" [config]="{ resizable: true, sortable: true }"> </app-data-table>
```

❌ **Bad Implementation**:

```html
<!-- Parent must implement resize logic -->
<app-data-table
  [columns]="columns"
  [rows]="rows"
  (resizeStart)="handleResizeStart($event)"
  (resizeMove)="handleResizeMove($event)"
  (resizeEnd)="handleResizeEnd()"
>
</app-data-table>
```

## Migration Strategy

When refactoring existing components to be reusable:

1. **Identify external dependencies**: Find all logic in parent components
2. **Move logic to component**: Internalize all feature logic
3. **Create configuration interface**: Replace inputs with config object
4. **Make outputs optional**: Outputs should only be for tracking
5. **Add default values**: Ensure component works without configuration
6. **Update documentation**: Add README and examples
7. **Test independently**: Verify component works in isolation

## Review Checklist

Before merging a reusable component:

- [ ] Component is standalone
- [ ] All logic is self-contained
- [ ] Configuration has sensible defaults
- [ ] Outputs are optional
- [ ] Custom templates supported
- [ ] Proper cleanup in ngOnDestroy
- [ ] README.md included
- [ ] Example component included
- [ ] TypeScript interfaces exported
- [ ] No tight coupling to specific use cases
- [ ] Works without external implementation

---

**Remember**: A truly reusable component should work perfectly with just data and configuration inputs. If a parent component needs to implement logic for the component to work, it's not truly reusable.
