---
title: Git Commit Conventions and Code Review Guidelines
inclusion: always
---

# Git Commit Conventions and Code Review Guidelines

## Git Commit Message Format

### Standard Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scopes

Use the component or module name:

- **admin**: Admin panel features
- **hackathon**: Hackathon-related features
- **user**: User management
- **auth**: Authentication
- **ui**: UI components
- **shared**: Shared utilities/models
- **data-table**: Data table component
- **events**: Event management

### Commit Message Rules

1. **Subject line (description)**:

   - Use imperative mood ("add" not "added" or "adds")
   - No capitalization of first letter
   - No period at the end
   - Maximum 50 characters

2. **Body** (optional):

   - Explain what and why, not how
   - Wrap at 72 characters
   - Separate from subject with blank line

3. **Breaking changes**:
   - Add "BREAKING CHANGE:" in the footer
   - Explain what changed and migration path

### Good Examples

```
feat(hackathon): add track sorting functionality

fix(auth): resolve login redirect issue

style(ui): update button spacing consistency

docs: update API documentation for user endpoints

refactor(data-table): extract resize logic to component

perf(events): optimize event list rendering
```

### Bad Examples

```
Fixed bug (too vague)
Added new feature for hackathon (not descriptive)
Update code (meaningless)
WIP (work in progress - don't commit)
asdf (meaningless)
```

## Branch Naming Conventions

### Format

Use **lowercase** and **hyphens** (`-`) to separate words.

### Branch Types

| Type         | Purpose                               | Example                      |
| ------------ | ------------------------------------- | ---------------------------- |
| **feat/**    | For new feature development           | `feat/awesome-login`         |
| **fix/**     | For fixing bugs or regressions        | `fix/login-error`            |
| **hotfix/**  | For urgent production fixes           | `hotfix/logout-issue`        |
| **upgrade/** | For upgrading frameworks/dependencies | `upgrade/angular-19`         |
| **docs/**    | For documentation updates             | `docs/setup-instructions`    |
| **chore/**   | For maintenance/cleanup tasks         | `chore/update-eslint-config` |
| **exp/**     | For experimental branches             | `exp/chatbot-prototype`      |
| **spike/**   | For research/proof-of-concept         | `spike/ai-summary-feature`   |

### Best Practices

- Keep branch names **under 20 characters**
- Always use **clear and descriptive** words
- Avoid vague names like `fix/stuff`
- Link to issue numbers if applicable: `feat/upgrade-angular-#452`

## Pull Request Requirements

### PR Title Format

```
<type>(<scope>): <description>
```

### PR Description Template

```markdown
## Summary

- Brief description of changes
- Why this change is needed

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Test Plan

- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] Edge cases considered
- [ ] Tested on different screen sizes (if UI change)

## Screenshots (if applicable)

Add screenshots for UI changes

## Breaking Changes

- List any breaking changes
- Migration steps if applicable

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review performed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] All tests passing
```

## Code Review Checklist

### Functionality

- [ ] Code works as intended
- [ ] Handles error cases properly
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] No hardcoded values or magic numbers

### Code Quality

- [ ] Code is readable and well-structured
- [ ] Functions are single-purpose and reasonably sized
- [ ] Variable names are descriptive
- [ ] Comments explain why, not what
- [ ] No code duplication
- [ ] Follows DRY principle

### Angular Specific

- [ ] Components follow single responsibility principle
- [ ] Proper lifecycle hooks used
- [ ] OnPush change detection where appropriate
- [ ] Proper unsubscription from observables
- [ ] Type safety maintained (no `any` types)
- [ ] Standalone components used for reusable components
- [ ] Proper component naming (commudle- prefix)

### Styling

- [ ] No inline styles used
- [ ] All Tailwind classes use `com-` prefix
- [ ] Pseudo-classes use correct prefix order
- [ ] Only preset colors used
- [ ] Responsive design implemented
- [ ] Accessibility considerations included

### Testing

- [ ] Unit tests cover new functionality
- [ ] Tests are meaningful and not just for coverage
- [ ] Edge cases are tested
- [ ] Mocks are appropriate

### Documentation

- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Complex logic documented
- [ ] Breaking changes documented

## Review Process

### For Reviewers

1. **Be Constructive**: Provide specific, actionable feedback
2. **Ask Questions**: If unclear, ask for clarification
3. **Suggest Alternatives**: Offer better solutions when possible
4. **Approve When Ready**: Don't hold up good code with nitpicks
5. **Focus on Impact**: Prioritize important issues over style preferences

### Review Types

- **LGTM**: Code looks good, approve and merge
- **Needs Changes**: Issues that must be addressed before merge
- **Suggestions**: Optional improvements, can merge without addressing

### Response Time

- **Critical/Hotfix**: Within 2 hours
- **Regular Features**: Within 1 business day
- **Non-urgent**: Within 2 business days

## Common Issues to Watch For

### Performance

- [ ] Unnecessary API calls
- [ ] Memory leaks (unsubscribed observables)
- [ ] Inefficient loops or operations
- [ ] Large bundle size increases
- [ ] Unnecessary re-renders

### Security

- [ ] Input validation
- [ ] XSS vulnerabilities
- [ ] Sensitive data exposure
- [ ] Proper authentication/authorization
- [ ] SQL injection prevention

### Maintainability

- [ ] Hard-coded values
- [ ] Complex nested logic
- [ ] Missing error handling
- [ ] Tight coupling between components
- [ ] Lack of documentation

### Reusability

- [ ] Component is truly reusable
- [ ] No external logic required
- [ ] Configuration over implementation
- [ ] Proper documentation included

## Approval Rules

1. **Required Approvals**: At least 1 approval from team member
2. **Code Owner Review**: Required for core modules
3. **Senior Review**: Required for architectural changes
4. **All Checks Pass**: CI/CD pipeline must be green

## Best Practices for PR Authors

1. **Keep PRs Small**: Easier to review and less likely to have issues
2. **Single Purpose**: One feature/fix per PR
3. **Clear Description**: Explain what and why
4. **Respond Promptly**: Address feedback quickly
5. **Test Thoroughly**: Don't rely solely on reviewers to catch bugs
6. **Self-Review First**: Review your own code before requesting review
7. **Update Documentation**: Keep docs in sync with code changes

## Merge Guidelines

1. **Squash and Merge**: For feature branches
2. **Clean History**: Ensure commit messages are meaningful
3. **Delete Branch**: Remove feature branch after merge
4. **Update Issues**: Link to relevant issues/tickets
5. **Verify CI/CD**: Ensure all checks pass before merging

## Git Workflow

### Before Committing

```bash
# Stage changes
git add <files>

# Commit with proper message
git commit -m "feat(scope): description"

# Note: Husky will run pre-commit hooks
# - Linting
# - Formatting
# - Commit message validation
```

### Before Creating PR

1. **Self Review**: Review your own code first
2. **Run Tests**: `nx test`
3. **Check Linting**: `eslint --cache --fix`
4. **Format Code**: `prettier --write`
5. **Update Documentation**: Add/update relevant docs

### Creating PR

1. Push branch to remote
2. Create PR with proper title and description
3. Link related issues
4. Request reviewers
5. Wait for CI/CD checks

## Additional Guidelines

### Commit Frequency

- Commit often with logical changes
- Each commit should be a working state
- Don't commit broken code
- Use meaningful commit messages

### Code Comments

- Explain why, not what
- Document complex logic
- Keep comments up-to-date
- Remove commented-out code

### Issue References

- Reference issues in commits: `fixes #123`
- Link PRs to issues
- Update issue status when PR is merged

## Quick Reference

### Good Commit Messages

```bash
feat(data-table): add column resize functionality
fix(auth): resolve token expiration handling
docs(readme): update setup instructions
style(ui): apply com- prefix to tailwind classes
refactor(events): extract common logic to service
perf(list): implement virtual scrolling
test(user): add unit tests for user service
```

### Bad Commit Messages

```bash
update
fix bug
WIP
changes
asdf
minor changes
```

## Remember

1. **Write clear, descriptive commit messages**
2. **Keep PRs small and focused**
3. **Test your changes thoroughly**
4. **Follow the code review checklist**
5. **Be responsive to feedback**
6. **Keep documentation updated**
7. **Use proper branch naming**
8. **Link commits to issues**
