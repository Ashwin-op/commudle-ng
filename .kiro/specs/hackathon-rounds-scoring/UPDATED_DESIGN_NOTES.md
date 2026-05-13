# Updated Design Notes - Using Existing Round Model

## Key Changes

The original design proposed creating a new `hackathon_rounds` table. However, after reviewing the existing codebase, we discovered that a `rounds` table already exists with the following structure:

```typescript
export interface IRound {
  id: number;
  name: string;
  slug: string;
  date: string;
  description: string;
  parent_type: string; // Polymorphic - can be 'Hackathon'
  parent_id: number; // References hackathon.id when parent_type = 'Hackathon'
  user_id: number;
  order: number;
  channel_id: number;
}
```

Additionally, the `hackathon_teams` table already has a `round_id` foreign key column.

## Updated Approach

Instead of creating a new table, we will:

1. **Extend the existing `rounds` table** by adding new columns:

   - `marking_criteria` (jsonb) - stores the evaluation criteria
   - `round_submission_type` (integer) - enum for ppt (0) or project (1)

2. **Use the polymorphic relationship** that already exists:

   - `parent_type` = 'Hackathon'
   - `parent_id` = hackathon.id

3. **Create the two new tables** as originally planned:
   - `hackathon_team_round_submissions`
   - `hackathon_team_round_scores`

## Benefits of This Approach

1. **Consistency**: Uses the existing Round model that's already integrated into the system
2. **Less Duplication**: Avoids creating a separate table for hackathon rounds
3. **Existing Relationships**: The `hackathon_teams.round_id` foreign key already exists
4. **Backward Compatible**: Existing rounds for other parent types (if any) remain unaffected

## Updated Database Schema

### Extend `rounds` Table (Migration)

```sql
ALTER TABLE rounds ADD COLUMN marking_criteria JSONB DEFAULT '[]';
ALTER TABLE rounds ADD COLUMN round_submission_type INTEGER;

CREATE INDEX idx_rounds_marking_criteria ON rounds USING GIN (marking_criteria);
CREATE INDEX idx_rounds_submission_type ON rounds(round_submission_type);
```

### New Tables (Unchanged)

The `hackathon_team_round_submissions` and `hackathon_team_round_scores` tables remain as originally designed, but they reference `rounds.id` instead of `hackathon_rounds.id`.

## Updated Model Relationships

```ruby
# app/models/round.rb
class Round < ApplicationRecord
  belongs_to :parent, polymorphic: true
  belongs_to :user
  has_many :hackathon_teams
  has_many :team_submissions, class_name: 'HackathonTeamRoundSubmission'
  has_many :reviewer_scores, through: :team_submissions

  enum round_submission_type: { ppt: 0, project: 1 }

  # Only validate these for hackathon rounds
  validates :marking_criteria, presence: true, if: :hackathon_round?
  validates :round_submission_type, presence: true, if: :hackathon_round?

  scope :for_hackathon, ->(hackathon_id) { where(parent_type: 'Hackathon', parent_id: hackathon_id) }

  def hackathon_round?
    parent_type == 'Hackathon'
  end
end

# app/models/hackathon.rb
class Hackathon < ApplicationRecord
  has_many :rounds, as: :parent
  has_many :hackathon_teams
end
```

## Updated Frontend Model

```typescript
// Extend the existing IRound interface
export interface IRound {
  id: number;
  name: string;
  slug: string;
  date: string;
  description: string;
  parent_type: string;
  parent_id: number;
  user_id: number;
  order: number;
  channel_id: number;

  // New fields for hackathon rounds
  marking_criteria?: IMarkingCriterion[];
  round_submission_type?: ERoundSubmissionType;
}
```

## Implementation Changes

### Task 1.1 - Updated

Instead of creating a new `hackathon_rounds` table, we will:

- Create a migration to add `marking_criteria` and `round_submission_type` columns to the existing `rounds` table
- Add indexes for the new columns
- Ensure backward compatibility with existing rounds

### Controllers - Updated

- Use `RoundsController` instead of creating a new controller
- Add hackathon-specific logic as needed
- Filter rounds by `parent_type: 'Hackathon'` and `parent_id: hackathon_id`

### Services - Updated

- Update `HackathonRoundsService` to work with the existing Round model
- Use the polymorphic relationship in API calls

## Migration Strategy

1. Add new columns to `rounds` table
2. Create `hackathon_team_round_submissions` table
3. Create `hackathon_team_round_scores` table
4. Update Round model with new validations and scopes
5. Test with existing rounds to ensure no breaking changes

## Rollback Plan

If needed, we can:

1. Remove the new columns from `rounds` table
2. Drop the two new tables
3. Revert model changes

The existing rounds functionality will remain intact.
