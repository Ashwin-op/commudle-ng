# Forums Feature — Architecture & Flow

Complete reference for how the forums feature works: triggers, API calls, and state flow.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      COMPONENTS                              │
│  (pure renderers — read observables, call store setters)     │
│                                                              │
│  ForumsDashboard  ForumsCategories  ForumsByCategory         │
│  ForumDiscussion  ForumMessages     ForumForm                │
└────────────────────────┬────────────────────────────────────┘
                         │ setters / CRUD
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     ForumsStore                              │
│  Single source of truth. Holds all state as BehaviorSubjects │
│  Owns the reactive query pipeline (debounce → switchMap)      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     ForumService                             │
│  Thin HTTP layer. No logic, no state. Just API calls.        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Api::V2::ForumsApiController                    │
│  All search, filter, pagination happens HERE (server-side)   │
└─────────────────────────────────────────────────────────────┘
```

**Key principle:** components never filter, sort, or paginate. Everything is server-driven.

---

## 2. Routes

| URL                                                     | Component                   | Purpose                      |
| ------------------------------------------------------- | --------------------------- | ---------------------------- |
| `/forums`                                               | `ForumsCategoriesComponent` | Landing — recent forums list |
| `/forums/:category_slug`                                | `ForumsByCategoryComponent` | Forums within one category   |
| `/forums/:category_slug/:topic_slug`                    | `ForumDiscussionComponent`  | Thread list inside a forum   |
| `/forums/:category_slug/:topic_slug/:user_message_slug` | `ForumMessagesComponent`    | Single thread + replies      |

Mounted under both `/communities/:slug/forums` and `/admin/communities/:slug/forums`, plus `/orgs/:slug/forums`.

---

## 3. API Endpoints

| Method   | Endpoint                   | Controller Action | Purpose                                        |
| -------- | -------------------------- | ----------------- | ---------------------------------------------- |
| `GET`    | `api/v2/forums`            | `index`           | Paginated + searchable + filterable forum list |
| `GET`    | `api/v2/forums/show`       | `show`            | Single forum detail                            |
| `GET`    | `api/v2/forums/categories` | `categories`      | Categories scoped to forums                    |
| `POST`   | `api/v2/forums`            | `create`          | Create forum                                   |
| `PUT`    | `api/v2/forums`            | `update`          | Update forum                                   |
| `DELETE` | `api/v2/forums`            | `destroy`         | Delete forum                                   |

### `GET api/v2/forums` — query params

| Param           | Required | Description                                                 |
| --------------- | -------- | ----------------------------------------------------------- |
| `parent_id`     | yes      | Community / org slug                                        |
| `parent_type`   | yes      | `Kommunity` \| `CommunityGroup` \| `Hackathon`              |
| `q`             | no       | Search term — `ILIKE` on forum **name** and **description** |
| `category_slug` | no       | Filter to one category                                      |
| `page`          | no       | Default `1`                                                 |
| `count`         | no       | Default `15`                                                |

**Response shape:**

```json
{
  "values": [
    /* IForum[] */
  ],
  "total": 42,
  "page": 1,
  "count": 15
}
```

---

## 4. Trigger Flow — When Each API Fires

### 4.1 Page load

```
User navigates to /admin/communities/gdg-delhi/forums
         │
         ▼
ForumsDashboardComponent.ngOnInit()
         │
         ├─ getParentFromUrl() → parses { parent_id: 'gdg-delhi', parent_type: 'Kommunity' }
         │
         ▼
forumsStore.setParentContext(parentId, parentType)
         │
         ├──► loadCategories()  ──► GET api/v2/forums/categories
         │                          → populates categories$
         │
         └──► reloadForums()    ──► GET api/v2/forums?page=1&count=15
                                    → populates forums$, totalForums$
```

**Result:** sidebar shows categories, main area shows recent forums.

---

### 4.2 Search (debounced, server-side)

```
User types "ruby" in search box
         │
         ▼
(ngModelChange) → onSearchChange('ruby')
         │
         ▼
forumsStore.setSearchQuery('ruby')
         │
         ├─ currentPage.next(1)        ← reset to page 1
         └─ searchQuery.next('ruby')
                    │
                    ▼
         [ debounceTime(350ms) ]        ← waits for typing to stop
                    │
                    ▼
         [ distinctUntilChanged() ]     ← skips duplicate values
                    │
                    ▼
         [ combineLatest + switchMap ]  ← cancels any in-flight request
                    │
                    ▼
         GET api/v2/forums?q=ruby&page=1&count=15
                    │
                    ▼
         forums$ + totalForums$ updated → template re-renders
```

**Why debounce?** Typing "ruby" fires 4 change events. Debounce collapses them into one request after 350ms of silence.

**Why switchMap?** If a new search starts before the previous response arrives, the old request is cancelled — no race conditions, no stale results.

---

### 4.3 Category filter

```
User clicks a category pill
         │
         ▼
onCategorySelect('web-development')
         │
         ▼
forumsStore.setSelectedCategory('web-development')
         │
         ├─ currentPage.next(1)
         └─ selectedCategory.next('web-development')
                    │
                    ▼
         [ combineLatest fires ]
                    │
                    ▼
         GET api/v2/forums?category_slug=web-development&page=1&count=15
```

**On the category route** (`/forums/:category_slug`), the route param drives this instead:

```
Route param change
         │
         ▼
route.params.subscribe → forumsStore.setSelectedCategory(categorySlug)
         │
         ├──► GET api/v2/forums?category_slug=...
         └──► GET api/v2/community_channels/show_category  (for header info)
```

On `ngOnDestroy`, the filter is cleared (`setSelectedCategory(null)`) so the landing page shows everything again.

---

### 4.4 Pagination

```
User clicks page 2
         │
         ▼
onPageChange(2) → forumsStore.setPage(2)
         │
         ▼
currentPage.next(2)
         │
         ▼
[ combineLatest fires — search + category preserved ]
         │
         ▼
GET api/v2/forums?q=ruby&category_slug=general&page=2&count=15
```

Search and category filters are **preserved** across page changes because all three feed the same `combineLatest`.

---

### 4.5 Create forum

```
User clicks "Create Forum" → ForumFormComponent dialog opens
         │
         ▼
User fills name / category / description → clicks Create
         │
         ▼
forumsStore.createForum(payload)
         │
         ▼
POST api/v2/forums?parent_id=...&parent_type=...
Body: { forum: { name, category_name, description, display_type: 'forum' } }
         │
         ▼ on success (tap operator)
         │
         ├─ forums$.next([newForum, ...existing])     ← prepends to visible list
         ├─ totalForums$.next(total + 1)              ← pagination count updates
         ├─ loadCategories()  ──► GET api/v2/forums/categories
         │                        ← category counts refresh
         └─ toastr: "Forum created successfully"
                    │
                    ▼
         dialogRef.close(true)
```

**Why it reflects immediately:** the store mutates `forums$` directly, and every component reads `forums$` via `| async`. Both the landing page and category page update at the same time.

---

### 4.6 Update forum

```
User clicks Edit icon → dialog opens with forumId set
         │
         ▼
ForumFormComponent.ngOnInit()
         │
         ▼
GET api/v2/forums/show?community_channel_id=123
         │
         ▼ patches form with existing values
         │
User edits → clicks Save
         │
         ▼
forumsStore.updateForum(payload, forumId)
         │
         ▼
PUT api/v2/forums?community_channel_id=123
Body: { forum: { name, category_name, description } }
         │
         ▼ on success
         │
         ├─ forums$ → map replaces matching id
         ├─ loadCategories()  ← category may have changed, counts refresh
         └─ toastr: "Forum updated successfully"
```

**Category reassignment:** if `category_name` changed, the backend finds-or-creates the new `ChannelCategory` and reassigns `@forum.channel_category`.

---

### 4.7 Delete forum

```
User clicks Delete icon
         │
         ▼
confirmDeleteForum(forum) → opens NbDialog confirmation
         │
         ▼
User checks "I understand..." → clicks Delete Forum
         │
         ▼
forumsStore.deleteForum(forumId)
         │
         ▼
DELETE api/v2/forums?community_channel_id=123
         │
         ▼ on success
         │
         ├─ forums$ → filter removes matching id
         ├─ totalForums$.next(total - 1)
         ├─ loadCategories()
         └─ toastr: "Forum deleted successfully"
                    │
                    ▼
         dialog closes
```

The checkbox must be checked before the Delete button enables — prevents accidental deletion.

---

### 4.8 Thread list inside a forum

```
User clicks a forum row → navigates to /forums/:category/:topic
         │
         ▼
ForumDiscussionResolver runs BEFORE component loads
         │
         ▼
GET api/v2/community_channels/show?community_channel_id=<topic_slug>
         │
         ├─ resolves IForum into route.data
         └─ initialises WebSocket: communityChannelHandlerService.init(discussion_id)
                    │
                    ▼
ForumDiscussionComponent.ngOnInit()
         │
         ▼
forumsStore.loadDiscussions(forum.discussion_id)
         │
         ▼
GET forum messages (page 1, count 10)
         │
         ▼
userMessages$ + hasNextPage$ updated
```

**Load more:** `loadDiscussions(id, loadMore: true)` increments the page and **appends** instead of replacing.

**Realtime:** when a new message arrives over WebSocket, `communityChannelHandlerService` calls `forumsStore.updateDiscussion(msg)`, which prepends it to `userMessages$` if it belongs to the current discussion and isn't already present.

---

## 5. Store State Reference

| Observable              | Type                 | Populated by            |
| ----------------------- | -------------------- | ----------------------- |
| `parentId$`             | `string`             | `setParentContext()`    |
| `parentType$`           | `EDbModels`          | `setParentContext()`    |
| `categories$`           | `IChannelCategory[]` | `loadCategories()`      |
| `isLoadingCategories$`  | `boolean`            | `loadCategories()`      |
| `forums$`               | `IForum[]`           | query pipeline, CRUD    |
| `isLoadingForums$`      | `boolean`            | query pipeline          |
| `totalForums$`          | `number`             | query pipeline, CRUD    |
| `currentPage$`          | `number`             | `setPage()`             |
| `perPage$`              | `number`             | `setPerPage()`          |
| `searchQuery$`          | `string`             | `setSearchQuery()`      |
| `selectedCategory$`     | `string \| null`     | `setSelectedCategory()` |
| `userMessages$`         | `IUserMessage[]`     | `loadDiscussions()`     |
| `hasNextPage$`          | `boolean`            | `loadDiscussions()`     |
| `currentUserMessage$`   | `IUserMessage`       | `loadUserMessage()`     |
| `isLoadingUserMessage$` | `boolean`            | `loadUserMessage()`     |

### Store methods

**Context**

- `setParentContext(id, type)` — sets parent, triggers categories + forums load
- `getParentId()` / `getParentType()` — sync getters

**Query (all trigger a backend call)**

- `setSearchQuery(q)` — debounced search, resets to page 1
- `setSelectedCategory(slug)` — category filter, resets to page 1
- `setPage(n)` — pagination
- `setPerPage(n)` — page size, resets to page 1
- `reloadForums()` — force refetch with current params

**CRUD (return Observables, auto-sync state)**

- `createForum(payload)` → `Observable<IForum>`
- `updateForum(payload, id)` → `Observable<IForum>`
- `deleteForum(id)` → `Observable<boolean>`

**Discussions**

- `loadDiscussions(discussionId, loadMore?, count?)`
- `loadUserMessage(slug)`
- `updateDiscussion(msg)` — realtime prepend
- `updateUserMessage(slug, reply)` — realtime reply append

**Cleanup**

- `clearDiscussions()` / `clearUserMessage()` / `clearAllData()`

---

## 6. Admin Permission Check

`isAdmin` gates the Create / Edit / Delete buttons.

```
Component.ngOnInit()
         │
         ▼
Long-lived subscription (NOT nested, NOT auto-unsubscribed early):
         │
communitiesService.userManagedCommunities$
  .pipe(takeUntil(destroy$))
  .subscribe(communities => {
     if (parentType === KOMMUNITY && parentId) {
       isAdmin = communities.some(c => c.slug === parentId);
     }
  });
```

**Why long-lived?** `userManagedCommunities$` is a `BehaviorSubject` starting as `[]`. It's populated later by `SidebarMenuComponent` calling `getRoleCommunities()`. A subscription created inside another subscribe callback only reads the value at that instant — which is still `[]`. Keeping it at the top level of `ngOnInit` means it receives the real data when it lands.

Same pattern for `communityGroupsService.userManagedCommunityGroups$` when parent is an org.

> **Note:** `CommunitiesService` is `providedIn: 'root'`. It must **not** be listed in the forums module `providers`, or a second instance is created with its own empty `BehaviorSubject` that never receives the sidebar's data.

---

## 7. Backend Permission Matrix

| Action                        | Who can                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `index`, `show`, `categories` | Anyone (public)                                                |
| `create`                      | Community organizer, org community_administrator, or sys admin |
| `update`, `destroy`           | Forum's `COMMUNITY_CHANNEL_ADMIN`, or sys admin                |

Enforced in `check_permissions` via `Api::V2::Concerns::UserActionPermission`.

---

## 8. Serializers

| Constant                            | Serializer                       | Used by                     |
| ----------------------------------- | -------------------------------- | --------------------------- |
| `V2_FORUMS_INDEX`                   | `ForumsIndexSerializer`          | `index`, `create`, `update` |
| `V2_FORUMS_SHOW`                    | `ForumsShowSerializer`           | `show`                      |
| `V2_PUBLIC_INDEX` (ChannelCategory) | `ChannelCategoryIndexSerializer` | `categories`                |

`ForumsIndexSerializer` exposes: `id`, `name`, `description`, `slug`, `created_at`, `group_name`, `discussion_id`, `channel_category { slug, name }`, `total_discussions`, `total_replies`.

`create` and `update` deliberately return `V2_FORUMS_INDEX` — the same shape as the list — so a newly created or edited row renders identically without a refetch.

---

## 9. Common Pitfalls

| Problem                                                         | Cause                                        | Fix                                          |
| --------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------- | ------ |
| `channel_category` is `null` → route becomes `/forums/null/...` | Association not eager loaded                 | `includes(:channel_category)` in the query   |
| `isAdmin` always `false`                                        | Subscription nested inside another subscribe | Move to top level of `ngOnInit`              |
| List doesn't update after create                                | Component held its own local array           | Read `forums$` from store via `              | async` |
| Search fires a request per keystroke                            | No debounce                                  | `debounceTime(350)` in the store pipeline    |
| Stale search results overwrite newer ones                       | Using `mergeMap`                             | Use `switchMap` — cancels in-flight requests |
| Category counts stale after create                              | Only the forum list was updated              | Call `loadCategories()` in the CRUD `tap`    |

---

## 10. File Map

**Frontend**

```
apps/commudle-admin/src/app/feature-modules/forums/
├── forums.module.ts
├── forums.routing.ts
├── resolvers/forum-discussion.resolver.ts
└── components/
    ├── forums-dashboard/          → shell + category sidebar
    ├── forums-categories/         → landing (recent forums)
    ├── forums-by-category/        → forums in one category
    ├── forum-discussion/          → thread list
    ├── forum-messages/            → single thread + replies
    ├── forum-form/                → create/edit dialog
    └── new-discussion-form/       → new thread dialog

libs/shared/services/src/lib/
├── forum.service.ts               → HTTP only
└── forums.store.ts                → all state + query pipeline
```

**Backend**

```
gdgapp/
├── app/controllers/api/v2/forums_api_controller.rb
├── app/serializers/v2/community_channel_serializers/
│   ├── forums_index_serializer.rb
│   └── forums_show_serializer.rb
├── app/models/community_channel.rb        → display_type: :forum
├── app/models/channel_category.rb
└── config/routes/api_v2.rb                → forums_api routes
```
