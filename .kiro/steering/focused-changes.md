---
inclusion: always
---

# Focused Changes Rule

## ONLY change what is explicitly asked

When a user asks to add, create, or fix something specific — **only touch that specific thing**.

### DO NOT ❌

- Refactor or optimize surrounding code that wasn't mentioned
- Clean up unrelated methods in the same file
- Rewrite existing working logic while adding new logic
- Add extra improvements "while you're in there"
- Change code style, formatting, or structure of untouched sections

### DO ✅

- Add only the new method, route, field, or component asked for
- Make the minimal change required to wire the new thing in
- Leave all existing code exactly as it was

### Examples

**User says:** "create a new API to toggle allow_problem_statement_change"

- ✅ Add the new route, controller action, API_ROUTES constant, service method
- ❌ Do NOT refactor existing controller actions, optimize permissions, or rewrite other methods

**User says:** "add a description field to hackathon_sponsors"

- ✅ Add the migration, update the serializer attribute list, permit the param
- ❌ Do NOT rewrite the create/update actions, reorganize the controller, or clean up other serializers

**User says:** "fix the order of sponsors"

- ✅ Fix only the grouping/ordering logic
- ❌ Do NOT refactor the entire controller action or touch unrelated methods

## The Rule in One Line

> **Touch only what was asked. Leave everything else exactly as it is.**
