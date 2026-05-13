---
title: Import Guidelines
inclusion: always
---

# Import Guidelines

## Nebular Imports

- **ALWAYS import Nebular components from `@commudle/theme`**
- **NEVER import directly from `@nebular/theme`**

### Examples

```typescript
// ✅ Correct - Import from @commudle/theme
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { NbToastrService, NbIconModule } from '@commudle/theme';

// ❌ Wrong - Do not import from @nebular/theme
import { NbDialogRef } from '@nebular/theme';
```

## Shared Library Imports

- **ALWAYS use barrel exports from `@commudle/shared-services`**
- **NEVER import directly from `libs/shared/services/src/lib/...`**
- **ALWAYS use barrel exports from `@commudle/shared-models`**
- **NEVER import directly from `libs/shared/models/src/lib/...`**

### Examples

```typescript
// ✅ Correct - Import from barrel exports
import { HackathonTeamRoundSubmissionService, AuthService } from '@commudle/shared-services';
import { ICommunityBuild, EBuildType } from '@commudle/shared-models';

// ❌ Wrong - Do not import from direct paths
import { HackathonTeamRoundSubmissionService } from 'libs/shared/services/src/lib/hackathon-team-round-submission.service';
import { ICommunityBuild } from 'libs/shared/models/src/lib/community-build.model';
```

## Import Organization Order

```typescript
// 1. Angular core imports
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// 2. Third-party libraries (including @commudle/theme)
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { faCircleCheck, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil, finalize } from 'rxjs';

// 3. Application imports (models, services, components)
import { ICommunityBuild, EBuildType } from '@commudle/shared-models';
import { AuthService, ToastrService } from '@commudle/shared-services';
```
