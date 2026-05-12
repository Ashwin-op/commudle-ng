# SEO Meta Tags Guidelines

## Every Routed Component Must Have SEO Tags

**MANDATORY: All components that are routed (have a path in routing files) must set SEO meta tags in `ngOnInit`.**

## Implementation Pattern

```typescript
import { SeoService } from '@commudle/shared-services';

constructor(private seoService: SeoService) {}

ngOnInit() {
  this.seoService.setTags(
    'Page Title | Entity Name',
    'Description of the page content',
    'https://image-url-for-og-image.png',
  );
}
```

## Title Format

- Use pipe separator: `Page Name | Parent Entity Name`
- Keep under 60 characters when possible
- Include the entity name (hackathon, community, event) for context
- Examples:
  - `Judges | ${this.hackathon.name}`
  - `Register for ${this.hackathon.name} | ${this.community.name}`
  - `${this.event.name} | ${this.community.name}`

## Description Format

- Keep under 160 characters
- Be descriptive and action-oriented
- Include the entity name for context
- Examples:
  - `Meet the judges for ${this.hackathon.name} hackathon`
  - `Explore tracks and problem statements for ${this.hackathon.name} hackathon`
  - `Browse projects submitted for ${this.hackathon.name} hackathon`

## OG Image

- Always provide a fallback image
- Use entity's banner/header image when available
- Fallback: `https://commudle.com/assets/images/commudle-logo192.png`

```typescript
this.hackathon?.banner_image?.url || 'https://commudle.com/assets/images/commudle-logo192.png'
```

## Private/Auth Pages

- Use `this.seoService.noIndex(true)` for pages that should not be indexed
- Apply to: user dashboards, form pages, admin panels, authenticated-only pages

```typescript
this.seoService.setTags(
  `Dashboard | ${this.hackathon.name}`,
  `Your team dashboard for ${this.hackathon.name} hackathon`,
  this.hackathon?.banner_image?.url || 'https://commudle.com/assets/images/commudle-logo192.png',
);
this.seoService.noIndex(true);
```

## When to Set SEO Tags

- Set inside the `activatedRoute.data` or `activatedRoute.parent.data` subscription after entity data is available
- Always set before any async data fetching calls

```typescript
ngOnInit() {
  this.activatedRoute.parent.data.subscribe((data) => {
    this.hackathon = data.hackathon;
    this.setSeo(); // Set SEO first
    this.fetchData(); // Then fetch additional data
  });
}
```

## Checklist for New Routed Components

1. Import `SeoService` from `@commudle/shared-services`
2. Inject in constructor
3. Call `setTags()` in `ngOnInit` after entity data is available
4. Add `noIndex(true)` if the page is private/authenticated
5. Use entity banner image with Commudle logo fallback
