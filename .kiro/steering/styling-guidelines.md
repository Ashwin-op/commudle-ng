---
title: CSS and Styling Guidelines
inclusion: always
---

# CSS and Styling Guidelines

## Core Styling Principles

### 1. NO Inline Styles - EVER

- **NEVER** use inline styles in HTML templates
- **ALWAYS** use dedicated SCSS files for styling
- Use `styleUrls` property in component decorator

```typescript
// ✅ Correct
@Component({
  selector: 'commudle-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})

// ❌ WRONG - Never do this
<div style="color: red;">Content</div>
```

### 2. Tailwind Class Naming Convention

#### CRITICAL: Always Use `com-` Prefix

- **ALWAYS** use `com-` prefix for base Tailwind classes
- **ALWAYS** use proper prefix order for pseudo-classes
- **NEVER** mix prefixes incorrectly

```scss
// ✅ CORRECT
.example-class {
  @apply com-flex com-items-center com-gap-4;
  @apply hover:com-bg-primary-100 focus:com-ring-2;
  @apply active:com-scale-95 disabled:com-opacity-50;
}

// ❌ WRONG - Missing com- prefix
.example-class {
  @apply flex items-center gap-4;
  @apply hover:bg-primary-100;
}

// ❌ WRONG - Incorrect prefix order
.example-class {
  @apply com-hover:bg-primary-100; // Wrong!
  @apply com-focus:ring-2; // Wrong!
}
```

#### Pseudo-Class Prefix Rules

- `hover:com-` for hover states
- `focus:com-` for focus states
- `active:com-` for active states
- `disabled:com-` for disabled states
- `group-hover:com-` for group hover states
- `sm:com-`, `md:com-`, `lg:com-` for responsive breakpoints

### 3. Color Usage Rules

#### ONLY Use Preset Colors

- **ONLY** use colors defined in `tailwind.preset.js`
- **NEVER** use arbitrary color values like `com-bg-[#ff0000]`
- Reference the preset file for available colors

```scss
// ✅ CORRECT - Using preset colors
.button {
  @apply com-bg-primary-500 com-text-white;
  @apply hover:com-bg-primary-600;
  @apply com-border-Bright-Gray;
}

// ❌ WRONG - Arbitrary colors
.button {
  @apply com-bg-[#ff0000] com-text-[#ffffff];
  @apply com-border-[#cccccc];
}
```

#### Available Color Families

- Primary colors: `primary-100` through `primary-900` (**NEVER use `primary-50`**)
- Gray colors: `gray-50` through `gray-900`
- Named colors: `Yankees-Blue`, `Bright-Gray`, `Infra-Red`, `Cadet-Grey`
- Semantic colors: `success`, `warning`, `danger`, `info`
- Standard Tailwind colors: gray, red, yellow, green, blue, indigo, purple, pink, orange

#### NEVER Use Nebular Theme Variables

- **NEVER** use Nebular theme variables for colors
- **ALWAYS** use Tailwind color utilities with `com-` prefix
- **MANDATORY**: Check `tailwind.preset.js` for available colors before writing CSS/SCSS

## File Organization

### SCSS File Structure

```
src/styles/
├── _variables.scss       # Global variables
├── _mixins.scss         # Reusable mixins
├── _base.scss           # Base styles, resets
├── _typography.scss     # Font definitions
├── _utilities.scss      # Utility classes
└── main.scss           # Main import file

components/
└── component-name/
    └── component-name.component.scss
```

## CSS Property Order

Follow this order for consistency:

1. **Positioning**: `position`, `top`, `right`, `bottom`, `left`, `z-index`
2. **Box Model**: `display`, `width`, `height`, `margin`, `padding`
3. **Typography**: `font-family`, `font-size`, `line-height`, `color`
4. **Visual**: `background`, `border`, `box-shadow`
5. **Animation**: `transition`, `animation`

```scss
.example-class {
  // Positioning
  position: relative;
  top: 0;
  left: 0;
  z-index: 10;

  // Box model
  display: flex;
  width: 100%;
  margin: 1rem;
  padding: 0.5rem;

  // Typography
  font-size: 1rem;
  color: $color-text-primary;

  // Visual
  background-color: white;
  border: 1px solid $color-border;

  // Animation
  transition: all 0.3s ease;
}
```

## Responsive Design

### Mobile-First Approach

Always start with mobile styles, then add larger breakpoints:

```scss
.component {
  // Mobile styles (default)
  @apply com-p-4 com-text-sm;

  // Tablet and up
  @apply sm:com-p-6 sm:com-text-base;

  // Desktop and up
  @apply lg:com-p-8 lg:com-text-lg;
}
```

### Breakpoints

- `sm:` - 576px and up (mobile landscape)
- `md:` - 768px and up (tablet)
- `lg:` - 992px and up (desktop)
- `xl:` - 1200px and up (large desktop)
- `2xl:` - 1400px and up (extra large)

## Component Styling Patterns

### Angular Component Styles

```scss
:host {
  display: block; // or appropriate display value

  &.is-loading {
    @apply com-opacity-50;
  }

  &.is-disabled {
    @apply com-pointer-events-none com-opacity-50;
  }
}

.component-wrapper {
  @apply com-p-4 com-bg-white com-rounded-lg;
}
```

### BEM-like Naming

```scss
.user-card {
  @apply com-p-4 com-bg-white com-rounded-lg;

  &-header {
    @apply com-mb-4 com-pb-4 com-border-b com-border-Bright-Gray;

    &-highlighted {
      @apply com-bg-primary-50;
    }
  }

  &-body {
    @apply com-p-4;
  }

  &:hover {
    @apply com-shadow-lg;
  }
}
```

### State Classes

```scss
.interactive-element {
  // Base styles
  @apply com-transition-all com-duration-200;

  // Hover state
  @apply hover:com-scale-105 hover:com-shadow-lg;

  // Focus state
  @apply focus:com-outline-none focus:com-ring-2 focus:com-ring-primary-500;

  // Active state
  @apply active:com-scale-95;

  // Disabled state
  @apply disabled:com-opacity-50 disabled:com-cursor-not-allowed;
}
```

## Common Component Patterns

### Button Component

```scss
.custom-button {
  @apply com-px-4 com-py-2 com-rounded-md com-font-medium;
  @apply com-transition-all com-duration-200;
  @apply hover:com-shadow-md focus:com-outline-none focus:com-ring-2;

  &.primary {
    @apply com-bg-primary-500 com-text-white;
    @apply hover:com-bg-primary-600 focus:com-ring-primary-500;
  }

  &.secondary {
    @apply com-bg-gray-200 com-text-Yankees-Blue;
    @apply hover:com-bg-gray-300 focus:com-ring-gray-500;
  }
}
```

### Card Component

```scss
.card {
  @apply com-bg-white com-rounded-lg com-shadow-sm com-border com-border-Bright-Gray;
  @apply hover:com-shadow-md com-transition-shadow com-duration-200;

  &-header {
    @apply com-p-6 com-border-b com-border-Bright-Gray;
  }

  &-body {
    @apply com-p-6;
  }

  &-footer {
    @apply com-p-6 com-border-t com-border-Bright-Gray com-bg-gray-50;
  }
}
```

### Form Input

```scss
.form-input {
  @apply com-w-full com-px-4 com-py-2 com-border com-border-Bright-Gray com-rounded-md;
  @apply focus:com-outline-none focus:com-ring-2 focus:com-ring-primary-500 focus:com-border-primary-500;
  @apply disabled:com-bg-gray-100 disabled:com-cursor-not-allowed;

  &.error {
    @apply com-border-Infra-Red focus:com-ring-Infra-Red;
  }
}
```

## Nesting Rules

### MANDATORY: Always Use Nested Hierarchy

- **ALWAYS** nest related child classes under their parent classes
- **NEVER** write standalone classes that belong to a parent component
- **NEVER** use Tailwind classes directly in HTML templates
- Use `@apply` directive in SCSS files only

```scss
// ✅ CORRECT - Parent container with nested children
.parent-container {
  @apply com-flex com-flex-col;

  .child-element {
    @apply com-p-4 com-border;

    .nested-child {
      @apply com-text-sm com-text-gray-600;
    }
  }

  .another-child {
    @apply com-mt-4;
  }
}
```

### Maximum 3 Levels Deep

```scss
.component {
  @apply com-p-4;

  &-element {
    @apply com-mb-2;

    &-sub-element {
      @apply com-text-sm;

      // ❌ Don't go deeper than this
    }
  }
}
```

### Class Naming

- **ALWAYS use kebab-case** for class names: `.header-content`, `.form-group`
- **NEVER use BEM double underscores (`__`)**: Use `.community-controls-container` not `.community-controls__container`
- **NEVER use BEM double hyphens (`--`)**: Use `.button-primary-active` not `.button--primary`

## Performance Guidelines

### Animation Performance

```scss
// ✅ GOOD - Use transform and opacity
.element {
  @apply com-transition-transform com-transition-opacity com-duration-300;
}

// ❌ AVOID - These trigger layout recalculation
.element {
  transition: width 0.3s ease, height 0.3s ease;
}
```

### Selector Performance

- Avoid universal selectors (`*`)
- Minimize descendant selectors
- Use class selectors over element selectors
- Avoid deep nesting

## Accessibility

### Focus States

```scss
.button {
  @apply focus:com-outline-none focus:com-ring-2 focus:com-ring-primary-500 focus:com-ring-offset-2;

  // Remove focus ring for mouse users
  &:focus:not(:focus-visible) {
    @apply com-ring-0;
  }
}
```

### High Contrast Support

```scss
@media (prefers-contrast: high) {
  .component {
    @apply com-border-2;
  }
}
```

### Reduced Motion Support

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Quick Reference

### Common Patterns

```scss
// Flexbox
@apply com-flex com-items-center com-justify-between com-gap-4;

// Grid
@apply com-grid com-grid-cols-12 com-gap-4;

// Spacing
@apply com-p-4 com-m-2 com-space-y-4;

// Typography
@apply com-text-base com-font-normal com-text-Yankees-Blue;

// Borders
@apply com-border com-border-Bright-Gray com-rounded-md;

// Shadows
@apply com-shadow-sm hover:com-shadow-md;

// Transitions
@apply com-transition-all com-duration-200 com-ease-in-out;
```

## Code Review Checklist

- [ ] No inline styles used
- [ ] All Tailwind classes use `com-` prefix
- [ ] Pseudo-classes use correct prefix order (e.g., `hover:com-`)
- [ ] Only preset colors used (no arbitrary values)
- [ ] Responsive design implemented (mobile-first)
- [ ] Proper nesting (max 3 levels)
- [ ] Accessibility considerations included
- [ ] Performance optimizations applied
- [ ] Consistent with existing styles

## Common Mistakes to Avoid

### DON'T ❌

```scss
// ❌ Inline styles
<div style="color: red;">

// ❌ Missing com- prefix
@apply flex items-center;

// ❌ Wrong prefix order
@apply com-hover:bg-primary-500;

// ❌ Arbitrary colors
@apply com-bg-[#ff0000];

// ❌ Too much nesting
.a { .b { .c { .d { } } } }

// ❌ Hardcoded values
margin: 16px;
```

### DO ✅

```scss
// ✅ SCSS file
.component {
  @apply com-text-Infra-Red;
}

// ✅ Correct prefix
@apply com-flex com-items-center;

// ✅ Correct pseudo-class
@apply hover:com-bg-primary-500;

// ✅ Preset colors
@apply com-bg-primary-500;

// ✅ Shallow nesting
.a {
  &-b {
  }
}

// ✅ Tailwind spacing
@apply com-m-4;
```

## Remember

1. **NEVER use inline styles**
2. **ALWAYS use `com-` prefix for Tailwind classes**
3. **ONLY use preset colors from tailwind.preset.js**
4. **Follow mobile-first responsive design**
5. **Keep nesting shallow (max 3 levels)**
6. **Consider accessibility in all styles**
7. **Optimize for performance**
