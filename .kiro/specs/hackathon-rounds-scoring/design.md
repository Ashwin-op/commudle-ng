# Design Document

## Overview

The Hackathon Rounds and Scoring System extends the existing hackathon platform to support multi-round evaluations with structured scoring mechanisms. This system enables organizers to configure evaluation rounds with customizable marking criteria, allows teams to submit materials for each round, and facilitates independent scoring by multiple reviewers (judges and mentors).

The design follows a three-tier architecture:

1. **Backend (Rails API)**: Database models, business logic, and RESTful API endpoints
2. **Frontend (Angular)**: TypeScript models, services, and UI components
3. **Data Layer**: PostgreSQL with JSONB support for flexible schema

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Angular Frontend                         │
├─────────────────────────────────────────────────────────────┤
│  Components          │  Services         │  Models           │
│  - Round Config      │  - Rounds         │  - IHackathonRound│
│  - Submission Form   │  - Submissions    │  - ITeamSubmission│
│  - Scoring Interface │  - Scores         │  - IReviewerScore │
│  - Score Dashboard   │                   │                   │
└──────────────────────┴───────────────────┴───────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Rails Backend API                       │
├─────────────────────────────────────────────────────────────┤
│  Controllers         │  Models           │  Serializers      │
│  - RoundsController  │  - HackathonRound │  - RoundSerializer│
│  - SubmissionsCtrl   │  - TeamSubmission │  - SubmissionSer. │
│  - ScoresController  │  - ReviewerScore  │  - ScoreSerializer│
└──────────────────────┴───────────────────┴───────────────────┘
                              │
                              │ ActiveRecord
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
├─────────────────────────────────────────────────────────────┤
│  - hackathon_rounds                                          │
│  - hackathon_team_round_submissions                          │
│  - hackathon_team_round_scores                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**

- Ruby on Rails (existing framework)
- PostgreSQL with JSONB support
- ActiveStorage for file uploads
- ActiveRecord for ORM

**Frontend:**

- Angular 17.3.0
- TypeScript 5.2.0
- RxJS for reactive programming
- Nebular UI components
- Tailwind CSS with `com-` prefix

## Components and Interfaces

### Backend Models

#### 1. HackathonRound Model

```ruby
# app/models/hackathon_round.rb
class HackathonRound < ApplicationRecord
  belongs_to :hackathon
  has_many :team_submissions, class_name: 'HackathonTeamRoundSubmission'
  has_many :reviewer_scores, through: :team_submissions

  enum round_submission_type: { ppt: 0, project: 1 }

  validates :marking_criteria, presence: true
  validates :round_submission_type, presence: true
  validate :marking_criteria_structure

  # marking_criteria format:
  # [
  #   { key: "innovation", min: 0, max: 10 },
  #   { key: "problem_solution_relevance", min: 0, max: 10 },
  #   { key: "technical_feasibility", min: 0, max: 10 },
  #   { key: "scalability", min: 0, max: 10 }
  # ]
end
```

#### 2. HackathonTeamRoundSubmission Model

```ruby
# app/models/hackathon_team_round_submission.rb
class HackathonTeamRoundSubmission < ApplicationRecord
  belongs_to :round, class_name: 'HackathonRound'
  belongs_to :hackathon_team
  belongs_to :created_by, class_name: 'User'
  has_many :reviewer_scores, class_name: 'HackathonTeamRoundScore'

  has_one_attached :file

  validates :round_id, presence: true
  validates :hackathon_team_id, presence: true
  validates :file, presence: true
end
```

#### 3. HackathonTeamRoundScore Model

```ruby
# app/models/hackathon_team_round_score.rb
class HackathonTeamRoundScore < ApplicationRecord
  belongs_to :reviewer, class_name: 'User'
  belongs_to :team_submission, class_name: 'HackathonTeamRoundSubmission'

  enum overall_review: {
    rejected: 0,
    borderline: 1,
    accept: 2,
    strongly_accept: 3
  }

  enum status: { draft: 0, submitted: 1 }

  validates :reviewer_id, presence: true
  validates :team_submission_id, presence: true
  validates :score, presence: true
  validates :total_score, presence: true
  validate :score_structure_matches_criteria
  validate :total_score_calculation

  before_save :calculate_total_score

  # score format:
  # {
  #   "innovation": 8,
  #   "problem_solution_relevance": 7,
  #   "technical_feasibility": 9,
  #   "scalability": 6
  # }
end
```

### Frontend Models

#### 1. IHackathonRound Interface

```typescript
// libs/shared/models/src/lib/hackathon-round.model.ts
export interface IHackathonRound {
  id: number;
  hackathon_id: number;
  name: string;
  description?: string;
  marking_criteria: IMarkingCriterion[];
  round_submission_type: ERoundSubmissionType;
  order?: number;
  deadline?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IMarkingCriterion {
  key: string;
  min: number;
  max: number;
  label?: string;
}

export enum ERoundSubmissionType {
  PPT = 'ppt',
  PROJECT = 'project',
}

export const PREDEFINED_CRITERIA: IMarkingCriterion[] = [
  { key: 'innovation', min: 0, max: 10, label: 'Innovation' },
  { key: 'problem_solution_relevance', min: 0, max: 10, label: 'Problem-Solution Relevance' },
  { key: 'technical_feasibility', min: 0, max: 10, label: 'Technical Feasibility' },
  { key: 'scalability', min: 0, max: 10, label: 'Scalability' },
];
```

#### 2. IHackathonTeamRoundSubmission Interface

```typescript
// libs/shared/models/src/lib/hackathon-team-round-submission.model.ts
export interface IHackathonTeamRoundSubmission {
  id: number;
  round_id: number;
  hackathon_team_id: number;
  file_url: string;
  file_name: string;
  comments?: string;
  created_by_id: number;
  created_by?: IUser;
  created_at: Date;
  updated_at: Date;
  round?: IHackathonRound;
  hackathon_team?: IHackathonTeam;
  reviewer_scores?: IHackathonTeamRoundScore[];
}
```

#### 3. IHackathonTeamRoundScore Interface

```typescript
// libs/shared/models/src/lib/hackathon-team-round-score.model.ts
export interface IHackathonTeamRoundScore {
  id: number;
  reviewer_id: number;
  team_submission_id: number;
  score: { [key: string]: number };
  total_score: number;
  overall_review: EOverallReview;
  remarks?: string;
  status: EScoreStatus;
  created_at: Date;
  updated_at: Date;
  reviewer?: IUser;
  team_submission?: IHackathonTeamRoundSubmission;
}

export enum EOverallReview {
  REJECTED = 'rejected',
  BORDERLINE = 'borderline',
  ACCEPT = 'accept',
  STRONGLY_ACCEPT = 'strongly_accept',
}

export enum EScoreStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

export const OVERALL_REVIEW_COLORS = {
  [EOverallReview.REJECTED]: 'com-bg-red-500',
  [EOverallReview.BORDERLINE]: 'com-bg-orange-400',
  [EOverallReview.ACCEPT]: 'com-bg-green-500',
  [EOverallReview.STRONGLY_ACCEPT]: 'com-bg-primary-500',
};
```

### Frontend Services

#### 1. HackathonRoundsService

```typescript
// libs/shared/services/src/lib/hackathon-rounds.service.ts
@Injectable({
  providedIn: 'root',
})
export class HackathonRoundsService {
  constructor(private http: HttpClient, private baseApiService: BaseApiService) {}

  // Get all rounds for a hackathon
  getRounds(hackathonId: number): Observable<IHackathonRound[]>;

  // Get single round
  getRound(roundId: number): Observable<IHackathonRound>;

  // Create new round
  createRound(hackathonId: number, round: Partial<IHackathonRound>): Observable<IHackathonRound>;

  // Update round
  updateRound(roundId: number, round: Partial<IHackathonRound>): Observable<IHackathonRound>;

  // Delete round
  deleteRound(roundId: number): Observable<boolean>;
}
```

#### 2. HackathonTeamSubmissionsService

```typescript
// libs/shared/services/src/lib/hackathon-team-submissions.service.ts
@Injectable({
  providedIn: 'root',
})
export class HackathonTeamSubmissionsService {
  constructor(private http: HttpClient, private baseApiService: BaseApiService) {}

  // Get submissions for a team
  getTeamSubmissions(teamId: number): Observable<IHackathonTeamRoundSubmission[]>;

  // Get submissions for a round
  getRoundSubmissions(roundId: number): Observable<IHackathonTeamRoundSubmission[]>;

  // Create submission
  createSubmission(
    roundId: number,
    teamId: number,
    file: File,
    comments?: string,
  ): Observable<IHackathonTeamRoundSubmission>;

  // Update submission
  updateSubmission(submissionId: number, file?: File, comments?: string): Observable<IHackathonTeamRoundSubmission>;

  // Delete submission
  deleteSubmission(submissionId: number): Observable<boolean>;
}
```

#### 3. HackathonReviewerScoresService

```typescript
// libs/shared/services/src/lib/hackathon-reviewer-scores.service.ts
@Injectable({
  providedIn: 'root',
})
export class HackathonReviewerScoresService {
  constructor(private http: HttpClient, private baseApiService: BaseApiService) {}

  // Get scores for a submission
  getSubmissionScores(submissionId: number): Observable<IHackathonTeamRoundScore[]>;

  // Get reviewer's scores
  getReviewerScores(reviewerId: number, roundId?: number): Observable<IHackathonTeamRoundScore[]>;

  // Create or update score
  saveScore(score: Partial<IHackathonTeamRoundScore>): Observable<IHackathonTeamRoundScore>;

  // Submit score (change from draft to submitted)
  submitScore(scoreId: number): Observable<IHackathonTeamRoundScore>;

  // Get aggregated scores for a round
  getAggregatedScores(roundId: number): Observable<IAggregatedScore[]>;
}

export interface IAggregatedScore {
  team_id: number;
  team_name: string;
  average_total_score: number;
  review_count: number;
  overall_review_distribution: { [key in EOverallReview]: number };
  individual_scores: IHackathonTeamRoundScore[];
}
```

## Data Models

### Database Schema

#### hackathon_rounds Table

```sql
CREATE TABLE hackathon_rounds (
  id BIGSERIAL PRIMARY KEY,
  hackathon_id BIGINT NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  marking_criteria JSONB NOT NULL DEFAULT '[]',
  round_submission_type INTEGER NOT NULL DEFAULT 0,
  order INTEGER,
  deadline TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_hackathon FOREIGN KEY (hackathon_id)
    REFERENCES hackathons(id) ON DELETE CASCADE,
  CONSTRAINT check_submission_type CHECK (round_submission_type IN (0, 1))
);

CREATE INDEX idx_hackathon_rounds_hackathon_id ON hackathon_rounds(hackathon_id);
CREATE INDEX idx_hackathon_rounds_order ON hackathon_rounds(hackathon_id, order);
```

#### hackathon_team_round_submissions Table

```sql
CREATE TABLE hackathon_team_round_submissions (
  id BIGSERIAL PRIMARY KEY,
  round_id BIGINT NOT NULL REFERENCES hackathon_rounds(id) ON DELETE CASCADE,
  hackathon_team_id BIGINT NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  comments TEXT,
  created_by_id BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_round FOREIGN KEY (round_id)
    REFERENCES hackathon_rounds(id) ON DELETE CASCADE,
  CONSTRAINT fk_hackathon_team FOREIGN KEY (hackathon_team_id)
    REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by_id)
    REFERENCES users(id),
  CONSTRAINT unique_team_round_submission UNIQUE (round_id, hackathon_team_id)
);

CREATE INDEX idx_team_submissions_round_id ON hackathon_team_round_submissions(round_id);
CREATE INDEX idx_team_submissions_team_id ON hackathon_team_round_submissions(hackathon_team_id);
CREATE INDEX idx_team_submissions_created_by ON hackathon_team_round_submissions(created_by_id);
```

#### hackathon_team_round_scores Table

```sql
CREATE TABLE hackathon_team_round_scores (
  id BIGSERIAL PRIMARY KEY,
  reviewer_id BIGINT NOT NULL REFERENCES users(id),
  team_submission_id BIGINT NOT NULL REFERENCES hackathon_team_round_submissions(id) ON DELETE CASCADE,
  score JSONB NOT NULL DEFAULT '{}',
  total_score INTEGER NOT NULL DEFAULT 0,
  overall_review INTEGER NOT NULL DEFAULT 0,
  remarks TEXT,
  status INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_reviewer FOREIGN KEY (reviewer_id)
    REFERENCES users(id),
  CONSTRAINT fk_team_submission FOREIGN KEY (team_submission_id)
    REFERENCES hackathon_team_round_submissions(id) ON DELETE CASCADE,
  CONSTRAINT check_overall_review CHECK (overall_review IN (0, 1, 2, 3)),
  CONSTRAINT check_status CHECK (status IN (0, 1)),
  CONSTRAINT unique_reviewer_submission UNIQUE (reviewer_id, team_submission_id)
);

CREATE INDEX idx_scores_reviewer_id ON hackathon_team_round_scores(reviewer_id);
CREATE INDEX idx_scores_submission_id ON hackathon_team_round_scores(team_submission_id);
CREATE INDEX idx_scores_status ON hackathon_team_round_scores(status);
CREATE INDEX idx_scores_overall_review ON hackathon_team_round_scores(overall_review);
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Round Creation with Valid Relationships

_For any_ hackathon and round data, when a round is created, it should be stored with a unique identifier and valid foreign key to the hackathon.

**Validates: Requirements 1.1, 8.1**

### Property 2: Marking Criteria Round-Trip Preservation

_For any_ round with marking criteria, retrieving the round should return all marking criteria with keys, minimum values, and maximum values intact.

**Validates: Requirements 1.2, 1.4**

### Property 3: Submission Type Enum Validation

_For any_ round creation or update, the system should accept only 'ppt' or 'project' as valid submission types and reject all other values.

**Validates: Requirements 1.3**

### Property 4: Round Update Preserves Related Data

_For any_ round with existing submissions and scores, updating the round configuration should not delete or modify the associated submissions and scores.

**Validates: Requirements 1.5**

### Property 5: Marking Criterion Structure Validation

_For any_ marking criterion, the system should reject criteria that are missing key, min, or max fields.

**Validates: Requirements 2.1**

### Property 6: Score Range Constraint Validation

_For any_ marking criterion, the system should reject criteria where the minimum value is greater than the maximum value.

**Validates: Requirements 2.2**

### Property 7: Custom Criteria Storage

_For any_ custom marking criterion with valid structure, the system should store and retrieve it identically to predefined criteria.

**Validates: Requirements 2.4**

### Property 8: Criteria Order Preservation

_For any_ list of marking criteria, retrieving the criteria should return them in the same order they were defined.

**Validates: Requirements 2.5**

### Property 9: Submission Relationship Integrity

_For any_ team submission, the stored submission should have valid foreign keys to the specified round and team.

**Validates: Requirements 3.1, 8.2**

### Property 10: Submission Data Persistence

_For any_ submission with comments and creator, retrieving the submission should return the comments and created_by_id unchanged.

**Validates: Requirements 3.2, 3.3**

### Property 11: Team Submission Filtering

_For any_ team, querying submissions for that team should return only submissions belonging to that team across all rounds.

**Validates: Requirements 3.4**

### Property 12: Submission Data Completeness

_For any_ team submission, the API response should include the file, comments, and all applicable marking criteria from the round.

**Validates: Requirements 4.1**

### Property 13: Score Range Validation

_For any_ score submission, each criterion score should be rejected if it falls outside the defined min-max range for that criterion.

**Validates: Requirements 4.2, 6.2**

### Property 14: Total Score Calculation

_For any_ set of criterion scores, the total score should equal the sum of all individual criterion scores.

**Validates: Requirements 4.3, 6.1**

### Property 15: Overall Review Enum Validation

_For any_ score submission, the system should accept only 'rejected', 'borderline', 'accept', or 'strongly_accept' as valid overall review values.

**Validates: Requirements 4.4**

### Property 16: Remarks Persistence

_For any_ score with remarks, retrieving the score should return the remarks text unchanged.

**Validates: Requirements 4.5**

### Property 17: Draft Score Visibility

_For any_ draft score, it should not appear in queries for submitted scores or aggregation calculations.

**Validates: Requirements 5.1, 6.5, 7.4**

### Property 18: Submitted Score Availability

_For any_ submitted score, it should appear in aggregation queries and be included in average calculations.

**Validates: Requirements 5.2**

### Property 19: Draft Score Mutability

_For any_ draft score, all fields should be modifiable and the modifications should be persisted.

**Validates: Requirements 5.3**

### Property 20: Submitted Score Immutability

_For any_ submitted score, attempts to modify any field should be rejected by the system.

**Validates: Requirements 5.4**

### Property 21: Score Status Distinction

_For any_ reviewer's scores, querying should correctly categorize and return scores as either draft or submitted based on their status.

**Validates: Requirements 5.5**

### Property 22: Independent Reviewer Scores

_For any_ team submission, multiple reviewers should be able to create independent score records without interfering with each other.

**Validates: Requirements 6.4, 7.1**

### Property 23: Average Score Calculation

_For any_ team with multiple submitted scores, the average total score should equal the sum of all submitted total scores divided by the count of submitted scores, excluding drafts.

**Validates: Requirements 6.5, 11.1**

### Property 24: Reviewer Score Isolation

_For any_ reviewer viewing a submission, the response should not include scores from other reviewers.

**Validates: Requirements 7.2**

### Property 25: Organizer Score Visibility

_For any_ organizer viewing team scores, the response should include all reviewer scores with reviewer identification.

**Validates: Requirements 7.3**

### Property 26: Evaluation Tracking

_For any_ reviewer, the system should maintain a record of which team submissions they have scored.

**Validates: Requirements 7.5**

### Property 27: Foreign Key Constraint Enforcement

_For any_ entity creation (round, submission, score), the system should reject operations with invalid foreign key references.

**Validates: Requirements 8.1, 8.2, 8.3, 8.5**

### Property 28: Cascade Deletion Behavior

_For any_ hackathon with associated rounds, submissions, and scores, deleting the hackathon should cascade delete all related entities.

**Validates: Requirements 8.4**

### Property 29: Presentation File Type Validation

_For any_ round with submission type 'ppt', the system should accept files with extensions .pdf, .ppt, or .pptx.

**Validates: Requirements 9.1**

### Property 30: Project File Type Validation

_For any_ round with submission type 'project', the system should accept files with various extensions including .zip, .tar.gz, .pdf, and .md.

**Validates: Requirements 9.2**

### Property 31: File Type Matching Validation

_For any_ file upload to a round, the system should reject files whose type doesn't match the round's submission type requirements.

**Validates: Requirements 9.4**

### Property 32: Reviewer Assignment Access Control

_For any_ reviewer assigned to specific teams, they should be able to access and score only those team submissions.

**Validates: Requirements 10.1**

### Property 33: Unassigned Access Denial

_For any_ reviewer attempting to access a team submission they are not assigned to, the system should deny access.

**Validates: Requirements 10.2**

### Property 34: Assignment Query Accuracy

_For any_ set of reviewer-team assignments, querying assignments should return the complete and accurate mapping.

**Validates: Requirements 10.3**

### Property 35: Assignment Removal Preserves Scores

_For any_ reviewer assignment removal, existing scores from that reviewer should remain in the database.

**Validates: Requirements 10.4**

### Property 36: Reviewer Workload Calculation

_For any_ reviewer, the workload count should equal the number of teams assigned to that reviewer.

**Validates: Requirements 10.5**

### Property 37: Score Report Completeness

_For any_ team score display, the response should include individual criterion scores, total scores, and overall review status distribution.

**Validates: Requirements 11.2**

### Property 38: Review Status Distribution Counting

_For any_ team with multiple scores having different overall review statuses, the count for each status category should match the actual number of scores with that status.

**Validates: Requirements 11.3**

### Property 39: Remarks Aggregation

_For any_ score report generation, all reviewer remarks should be included in the output.

**Validates: Requirements 11.4**

### Property 40: Score Filtering

_For any_ score filtering query with minimum threshold and status, only teams meeting both criteria should be returned.

**Validates: Requirements 11.5**

### Property 41: Submission Timestamp Recording

_For any_ team submission creation, the created_at timestamp should be set to the current time.

**Validates: Requirements 12.1**

### Property 42: Score Submission Timestamp Recording

_For any_ score submission, the updated_at timestamp should be set when the status changes to submitted.

**Validates: Requirements 12.2, 12.3**

### Property 43: Audit Report Timestamp Completeness

_For any_ audit report, all submissions and scores should include their creation and modification timestamps.

**Validates: Requirements 12.5**

## Error Handling

### Validation Errors

**Score Range Violations:**

- Return HTTP 422 with specific error message indicating which criterion and the valid range
- Format: `{ error: "Score for 'innovation' must be between 0 and 10" }`

**Invalid Enum Values:**

- Return HTTP 422 with list of valid values
- Format: `{ error: "Invalid submission type. Must be 'ppt' or 'project'" }`

**Missing Required Fields:**

- Return HTTP 422 with list of missing fields
- Format: `{ error: "Missing required fields: key, min, max" }`

### Authorization Errors

**Unauthorized Access:**

- Return HTTP 403 when reviewer attempts to access unassigned team
- Format: `{ error: "You are not authorized to access this team's submission" }`

**Immutable Score Modification:**

- Return HTTP 403 when attempting to modify submitted score
- Format: `{ error: "Cannot modify submitted scores" }`

### Referential Integrity Errors

**Invalid Foreign Keys:**

- Return HTTP 422 with descriptive message
- Format: `{ error: "Hackathon with id 999 does not exist" }`

**Constraint Violations:**

- Return HTTP 422 with constraint name and explanation
- Format: `{ error: "Team has already submitted for this round" }`

### File Upload Errors

**Invalid File Type:**

- Return HTTP 422 with accepted file types
- Format: `{ error: "Invalid file type. Accepted types for presentation rounds: PDF, PPT, PPTX" }`

**File Size Exceeded:**

- Return HTTP 413 with size limit
- Format: `{ error: "File size exceeds maximum limit of 50MB" }`

### Error Handling Strategy

1. **Validation Layer**: Validate all inputs before database operations
2. **Transaction Rollback**: Use database transactions for multi-step operations
3. **Graceful Degradation**: Return partial data with warnings when appropriate
4. **Logging**: Log all errors with context for debugging
5. **User-Friendly Messages**: Translate technical errors to user-friendly messages in the frontend

## Testing Strategy

### Unit Testing

**Backend (Rails):**

- Model validations (marking criteria structure, score ranges, enum values)
- Calculation methods (total score computation)
- Scope methods (filtering by status, reviewer, team)
- Association integrity
- Callback behavior (calculate_total_score before_save)

**Frontend (Angular):**

- Service methods (HTTP requests, response mapping)
- Component logic (form validation, score calculation)
- Utility functions (file type validation, date formatting)
- Pipe transformations (status colors, enum labels)

### Property-Based Testing

**Framework**: Use `rspec-quickcheck` for Ruby backend testing

**Configuration**: Each property test should run a minimum of 100 iterations

**Test Tagging**: Each property-based test must include a comment with the format:
`# Feature: hackathon-rounds-scoring, Property X: [property description]`

**Key Properties to Test:**

1. **Score Calculation Properties:**

   - Total score always equals sum of criterion scores
   - Average calculation excludes draft scores
   - Score ranges are always enforced

2. **Data Integrity Properties:**

   - Round-trip preservation of marking criteria
   - Foreign key constraints are enforced
   - Cascade deletions work correctly

3. **Access Control Properties:**

   - Reviewers can only access assigned teams
   - Draft scores are not visible in aggregations
   - Submitted scores are immutable

4. **Validation Properties:**
   - Invalid enum values are rejected
   - Score ranges are validated against criteria
   - File types match submission requirements

### Integration Testing

- End-to-end workflows (create round → submit → score → aggregate)
- Multi-reviewer scenarios
- File upload and retrieval
- Permission checks across different user roles
- Database transaction rollback on errors

### Test Data Generators

**For Property-Based Tests:**

```ruby
# Generate random marking criteria
def generate_marking_criteria(count = 4)
  count.times.map do
    {
      key: Faker::Lorem.word,
      min: rand(0..5),
      max: rand(6..10)
    }
  end
end

# Generate random scores within criteria ranges
def generate_valid_scores(criteria)
  criteria.each_with_object({}) do |criterion, scores|
    scores[criterion[:key]] = rand(criterion[:min]..criterion[:max])
  end
end

# Generate random invalid scores (outside ranges)
def generate_invalid_scores(criteria)
  criteria.each_with_object({}) do |criterion, scores|
    scores[criterion[:key]] = [
      criterion[:min] - rand(1..10),
      criterion[:max] + rand(1..10)
    ].sample
  end
end
```

### Testing Checklist

- [ ] All model validations have unit tests
- [ ] All service methods have unit tests
- [ ] All correctness properties have property-based tests
- [ ] Integration tests cover main workflows
- [ ] Error handling is tested for all edge cases
- [ ] File upload scenarios are tested
- [ ] Access control is tested for all roles
- [ ] Performance tests for aggregation queries
- [ ] Database constraints are tested
- [ ] Frontend components have unit tests

## API Endpoints

### Rounds Management

```
GET    /api/v3/hackathons/:hackathon_id/rounds
POST   /api/v3/hackathons/:hackathon_id/rounds
GET    /api/v3/rounds/:id
PUT    /api/v3/rounds/:id
DELETE /api/v3/rounds/:id
```

### Team Submissions

```
GET    /api/v3/hackathon_teams/:team_id/submissions
GET    /api/v3/rounds/:round_id/submissions
POST   /api/v3/rounds/:round_id/submissions
PUT    /api/v3/submissions/:id
DELETE /api/v3/submissions/:id
GET    /api/v3/submissions/:id/download
```

### Reviewer Scores

```
GET    /api/v3/submissions/:submission_id/scores
GET    /api/v3/reviewers/:reviewer_id/scores
POST   /api/v3/submissions/:submission_id/scores
PUT    /api/v3/scores/:id
POST   /api/v3/scores/:id/submit
GET    /api/v3/rounds/:round_id/aggregated_scores
```

### Reviewer Assignments

```
GET    /api/v3/rounds/:round_id/assignments
POST   /api/v3/rounds/:round_id/assignments
DELETE /api/v3/assignments/:id
GET    /api/v3/reviewers/:reviewer_id/assigned_teams
```

## Security Considerations

### Authentication & Authorization

- All endpoints require authentication via JWT tokens
- Role-based access control (RBAC):
  - **Organizers**: Full access to all round, submission, and score data
  - **Reviewers**: Read access to assigned team submissions, write access to own scores
  - **Team Members**: Read access to own submissions, write access to create/update submissions

### Data Protection

- File uploads validated for type and size
- JSONB fields sanitized to prevent injection attacks
- SQL injection prevention via parameterized queries
- XSS prevention via Angular's built-in sanitization

### Audit Trail

- All create/update operations logged with user_id and timestamp
- Score submissions are immutable once submitted
- Deletion operations are soft deletes where appropriate

## Performance Optimization

### Database Indexing

- Composite indexes on (hackathon_id, order) for rounds
- Indexes on foreign keys for fast joins
- Index on (reviewer_id, team_submission_id) for unique constraint and fast lookups
- Index on status field for filtering draft vs submitted scores

### Query Optimization

- Use eager loading to prevent N+1 queries
- Implement pagination for large result sets
- Cache aggregated scores for frequently accessed rounds
- Use database views for complex aggregation queries

### File Storage

- Use ActiveStorage with cloud storage (S3/GCS)
- Implement CDN for file downloads
- Generate pre-signed URLs for secure file access
- Compress large files before storage

## Deployment Considerations

### Database Migrations

1. Create hackathon_rounds table
2. Create hackathon_team_round_submissions table
3. Create hackathon_team_round_scores table
4. Add indexes
5. Add foreign key constraints
6. Create database views for aggregations

### Rollback Strategy

- All migrations should be reversible
- Maintain backward compatibility during deployment
- Use feature flags for gradual rollout
- Monitor error rates and performance metrics

### Data Migration

- If extending existing rounds table, migrate data carefully
- Validate data integrity after migration
- Provide default values for new required fields
- Test rollback procedures

## Future Enhancements

1. **Real-time Notifications**: Notify teams when scores are submitted
2. **Score Analytics**: Provide insights on scoring patterns and reviewer agreement
3. **Bulk Operations**: Allow organizers to perform bulk reviewer assignments
4. **Score Calibration**: Tools to help reviewers calibrate their scoring
5. **Export Functionality**: Export scores and reports in various formats (CSV, PDF)
6. **Version History**: Track changes to submissions and scores over time
7. **Reviewer Feedback**: Allow reviewers to provide structured feedback beyond remarks
8. **Automated Reminders**: Send reminders to reviewers about pending evaluations
