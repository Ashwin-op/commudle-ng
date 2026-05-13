# Implementation Plan

## Note: Using Existing Round Model

This implementation extends the existing `rounds` table (with polymorphic parent_type/parent_id) instead of creating a new hackathon_rounds table. See UPDATED_DESIGN_NOTES.md for details.

- [-] 1. Backend: Database Schema and Migrations
- [x] 1.1 Create migration to extend rounds table for hackathon scoring

  - Add column: marking_criteria (jsonb) with default '[]'
  - Add column: round_submission_type (enum: presentation, project)
  - Add GIN index on marking_criteria for JSONB queries
  - Add index on round_submission_type
  - Ensure backward compatibility with existing rounds
  - _Requirements: 1.1, 1.2, 1.3, 8.1_

- [x] 1.2 Create migration for hackathon_team_round_submissions table

  - Add columns: round_id (references rounds.id), hackathon_team_id, comments, created_by_id
  - Add foreign key to rounds table with cascade delete
  - Add foreign key to hackathon_teams table with cascade delete
  - Add foreign key to users table for created_by_id
  - Add unique constraint on (round_id, hackathon_team_id)
  - Add indexes on round_id, hackathon_team_id, created_by_id
  - _Requirements: 3.1, 3.2, 3.3, 8.2_

- [x] 1.3 Create migration for hackathon_team_round_scores table

  - Add columns: reviewer_id, team_submission_id, score (jsonb), total_score (integer), overall_review (integer), remarks (text), status (integer)
  - Add foreign key to users table for reviewer_id
  - Add foreign key to hackathon_team_round_submissions table
  - Add unique constraint on (reviewer_id, team_submission_id)
  - Add indexes on reviewer_id, team_submission_id, status, overall_review
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.3_

- [ ] 1.4 Run migrations and verify schema

  - Execute migrations in development environment
  - Verify all columns, constraints, and indexes are created
  - Test that existing rounds (non-hackathon) are not affected
  - Test cascade delete behavior
  - _Requirements: 8.4_

- [ ] 2. Backend: Rails Models
- [ ] 2.1 Update Round model for hackathon scoring

  - Add enum for round_submission_type: { ppt: 0, project: 1 }
  - Add conditional validations (only for hackathon rounds where parent_type='Hackathon')
  - Validate marking_criteria presence and structure
  - Validate marking_criteria min/max ranges
  - Add scope: `scope :for_hackathon, ->(hackathon_id) { where(parent_type: 'Hackathon', parent_id: hackathon_id) }`
  - Add helper method: `def hackathon_round?` to check parent_type
  - Add associations: has_many :team_submissions, has_many :hackathon_teams
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [ ]\* 2.2 Write property test for marking criteria validation

  - **Property 5: Marking Criterion Structure Validation**
  - **Validates: Requirements 2.1**

- [ ]\* 2.3 Write property test for score range validation

  - **Property 6: Score Range Constraint Validation**
  - **Validates: Requirements 2.2**

- [ ] 2.4 Create HackathonTeamRoundSubmission model

  - Define associations (belongs_to :round, :hackathon_team, :created_by)
  - Add has_one_attached :file for ActiveStorage
  - Add validations for required fields
  - Add scope for filtering by team and round
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]\* 2.5 Write property test for submission relationship integrity

  - **Property 9: Submission Relationship Integrity**
  - **Validates: Requirements 3.1, 8.2**

- [ ] 2.6 Create HackathonTeamRoundScore model

  - Define associations (belongs_to :reviewer, :team_submission)
  - Add enums for overall_review and status
  - Add validations for score structure and ranges
  - Add before_save callback to calculate total_score
  - Add scope for filtering by status (draft/submitted)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2_

- [ ]\* 2.7 Write property test for total score calculation

  - **Property 14: Total Score Calculation**
  - **Validates: Requirements 4.3, 6.1**

- [ ]\* 2.8 Write property test for score range validation

  - **Property 13: Score Range Validation**
  - **Validates: Requirements 4.2, 6.2**

- [ ]\* 2.9 Write property test for submitted score immutability

  - **Property 20: Submitted Score Immutability**
  - **Validates: Requirements 5.4**

- [ ] 3. Backend: Controllers and API Endpoints
- [ ] 3.1 Update or create RoundsController for hackathon rounds

  - Implement index action (GET /api/v3/hackathons/:hackathon_id/rounds)
  - Filter by parent_type='Hackathon' and parent_id=hackathon_id
  - Implement show action (GET /api/v3/rounds/:id)
  - Implement create action (POST /api/v3/hackathons/:hackathon_id/rounds)
  - Set parent_type='Hackathon' and parent_id=hackathon_id on create
  - Implement update action (PUT /api/v3/rounds/:id)
  - Implement destroy action (DELETE /api/v3/rounds/:id)
  - Add authorization checks for organizer role
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]\* 3.2 Write property test for round update preserving related data

  - **Property 4: Round Update Preserves Related Data**
  - **Validates: Requirements 1.5**

- [ ] 3.3 Create TeamSubmissionsController

  - Implement index action for team submissions
  - Implement index action for round submissions
  - Implement create action with file upload
  - Implement update action
  - Implement destroy action
  - Implement download action for file retrieval
  - Add authorization checks (team members can only access own submissions)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]\* 3.4 Write property test for team submission filtering

  - **Property 11: Team Submission Filtering**
  - **Validates: Requirements 3.4**

- [ ] 3.5 Create ReviewerScoresController

  - Implement index action for submission scores
  - Implement index action for reviewer's scores
  - Implement create/update action (upsert pattern)
  - Implement submit action (change status from draft to submitted)
  - Implement aggregated_scores action
  - Add authorization checks (reviewers can only score assigned teams)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

- [ ]\* 3.6 Write property test for reviewer score isolation

  - **Property 24: Reviewer Score Isolation**
  - **Validates: Requirements 7.2**

- [ ]\* 3.7 Write property test for average score calculation

  - **Property 23: Average Score Calculation**
  - **Validates: Requirements 6.5, 11.1**

- [ ] 4. Backend: Serializers
- [ ] 4.1 Create or update RoundSerializer for hackathon rounds

  - Serialize round attributes
  - Include marking_criteria as structured JSON (only for hackathon rounds)
  - Include round_submission_type as string enum
  - Add conditional includes for submissions count
  - Handle both hackathon and non-hackathon rounds
  - _Requirements: 1.4, 2.5_

- [ ] 4.2 Create TeamSubmissionSerializer

  - Serialize submission attributes
  - Include file URL and metadata
  - Include round details with marking criteria
  - Include creator information
  - Conditionally include scores for organizers
  - _Requirements: 3.4, 4.1_

- [ ] 4.3 Create ReviewerScoreSerializer

  - Serialize score attributes
  - Include reviewer information
  - Include team submission details
  - Exclude other reviewers' scores for reviewers
  - Include all scores for organizers
  - _Requirements: 7.2, 7.3_

- [ ] 4.4 Create AggregatedScoreSerializer

  - Serialize team information
  - Calculate and include average scores
  - Include review count and status distribution
  - Include individual scores with reviewer info
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 5. Frontend: TypeScript Models
- [ ] 5.1 Update IRound interface to include hackathon scoring fields

  - Add marking_criteria?: IMarkingCriterion[] (optional for non-hackathon rounds)
  - Add round_submission_type?: ERoundSubmissionType (optional)
  - Create IMarkingCriterion interface
  - Create ERoundSubmissionType enum
  - Export PREDEFINED_CRITERIA constant
  - Maintain backward compatibility with existing Round usage
  - _Requirements: 1.1, 1.2, 1.3, 2.3_

- [ ] 5.2 Create IHackathonTeamRoundSubmission interface

  - Define interface with all submission properties
  - Include relationships to round, team, and creator
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 5.3 Create IHackathonTeamRoundScore interface

  - Define interface with all score properties
  - Create EOverallReview enum
  - Create EScoreStatus enum
  - Export OVERALL_REVIEW_COLORS constant
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2_

- [ ] 5.4 Create IAggregatedScore interface

  - Define interface for aggregated score data
  - Include team info, averages, and distributions
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 6. Frontend: Services
- [ ] 6.1 Update or create HackathonRoundsService

  - Implement getRounds method (filter by hackathon_id)
  - Implement getRound method
  - Implement createRound method (set parent_type and parent_id)
  - Implement updateRound method
  - Implement deleteRound method
  - Add error handling for all methods
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 6.2 Create HackathonTeamSubmissionsService

  - Implement getTeamSubmissions method
  - Implement getRoundSubmissions method
  - Implement createSubmission method with file upload
  - Implement updateSubmission method
  - Implement deleteSubmission method
  - Add error handling and file validation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.3 Create HackathonReviewerScoresService

  - Implement getSubmissionScores method
  - Implement getReviewerScores method
  - Implement saveScore method (upsert)
  - Implement submitScore method
  - Implement getAggregatedScores method
  - Add error handling for all methods
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.5, 11.1_

- [ ] 7. Frontend: Round Configuration Components
- [ ] 7.1 Create RoundListComponent

  - Display list of rounds for a hackathon
  - Show round name, submission type, and deadline
  - Add buttons for create, edit, delete actions
  - Implement sorting by order
  - Add loading and error states
  - _Requirements: 1.1, 1.4_

- [ ] 7.2 Create RoundFormComponent

  - Create form for round creation/editing
  - Add fields for name, description, submission type, deadline
  - Implement marking criteria builder (add/remove criteria)
  - Add predefined criteria selection
  - Validate marking criteria structure and ranges
  - Handle form submission and errors
  - Set parent_type='Hackathon' and parent_id on create
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 7.3 Create MarkingCriteriaBuilderComponent

  - Reusable component for building marking criteria
  - Support adding custom criteria
  - Support selecting from predefined criteria
  - Validate min/max ranges
  - Support reordering criteria
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8. Frontend: Team Submission Components
- [ ] 8.1 Create TeamSubmissionListComponent

  - Display team's submissions across all rounds
  - Show round name, file name, submission date
  - Add buttons for view, edit, delete actions
  - Filter by round
  - Add empty state for no submissions
  - _Requirements: 3.4_

- [ ] 8.2 Create SubmissionFormComponent

  - Create form for submission upload
  - Add file upload with drag-and-drop
  - Add comments textarea
  - Validate file type based on round submission type
  - Show file size and type restrictions
  - Handle upload progress and errors
  - _Requirements: 3.1, 3.2, 3.3, 9.1, 9.2, 9.4_

- [ ]\* 8.3 Write property test for file type validation

  - **Property 31: File Type Matching Validation**
  - **Validates: Requirements 9.4**

- [ ] 8.4 Create SubmissionDetailComponent

  - Display submission details (file, comments, date)
  - Show download button for file
  - Show marking criteria for the round
  - Display scores if available (for organizers)
  - _Requirements: 3.4, 4.1_

- [ ] 9. Frontend: Reviewer Scoring Components
- [ ] 9.1 Create ReviewerDashboardComponent

  - Display list of assigned team submissions
  - Show submission status (not scored, draft, submitted)
  - Filter by round and status
  - Add search functionality
  - Show reviewer workload statistics
  - _Requirements: 5.5, 7.5, 10.1, 10.5_

- [ ] 9.2 Create ScoringFormComponent

  - Display team submission details
  - Show marking criteria with input fields for scores
  - Validate scores against min/max ranges
  - Auto-calculate total score
  - Add overall review status selector
  - Add remarks textarea
  - Support save as draft and submit actions
  - Prevent editing of submitted scores
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

- [ ]\* 9.3 Write property test for draft score mutability

  - **Property 19: Draft Score Mutability**
  - **Validates: Requirements 5.3**

- [ ] 9.4 Create ScoreCardComponent

  - Display read-only view of a score
  - Show all criterion scores and total
  - Show overall review status with color coding
  - Show remarks
  - Show reviewer name and submission date
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 10. Frontend: Organizer Dashboard Components
- [ ] 10.1 Create RoundScoresDashboardComponent

  - Display aggregated scores for all teams in a round
  - Show team rankings by average score
  - Display score distribution charts
  - Show review status distribution
  - Add filters for minimum score and review status
  - Support export functionality
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]\* 10.2 Write property test for score filtering

  - **Property 40: Score Filtering**
  - **Validates: Requirements 11.5**

- [ ] 10.3 Create TeamScoreDetailComponent

  - Display all scores for a specific team
  - Show individual reviewer scores
  - Show average scores per criterion
  - Display all reviewer remarks
  - Show score timeline
  - _Requirements: 7.3, 11.2, 11.4_

- [ ] 10.4 Create ReviewerAssignmentComponent

  - Display reviewer-team assignment matrix
  - Support bulk assignment of reviewers to teams
  - Show reviewer workload
  - Support removing assignments
  - Warn about existing scores when removing assignments
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]\* 10.5 Write property test for assignment removal preserving scores

  - **Property 35: Assignment Removal Preserves Scores**
  - **Validates: Requirements 10.4**

- [ ] 11. Styling and UI Polish
- [ ] 11.1 Apply Tailwind styles to all components

  - Use com- prefix for all Tailwind classes
  - Implement responsive design (mobile-first)
  - Add hover and focus states
  - Use preset colors from tailwind.preset.js
  - Ensure accessibility (ARIA labels, keyboard navigation)
  - _Styling Guidelines_

- [ ] 11.2 Create status badge components

  - Create badge for submission types (ppt/project)
  - Create badge for score status (draft/submitted)
  - Create badge for overall review (rejected/borderline/accept/strongly accept)
  - Use appropriate colors from OVERALL_REVIEW_COLORS
  - _Requirements: 1.3, 4.4, 5.1, 5.2_

- [ ] 11.3 Add loading and error states

  - Implement skeleton loaders for all list components
  - Add error messages with retry buttons
  - Add empty states with helpful messages
  - Add success notifications for actions
  - _Error Handling_

- [ ] 12. Authorization and Access Control
- [ ] 12.1 Implement backend authorization

  - Add organizer-only checks for round management
  - Add reviewer assignment checks for scoring
  - Add team member checks for submissions
  - Implement proper error responses (403 Forbidden)
  - _Requirements: 10.1, 10.2_

- [ ]\* 12.2 Write property test for reviewer access control

  - **Property 32: Reviewer Assignment Access Control**
  - **Validates: Requirements 10.1**

- [ ]\* 12.3 Write property test for unassigned access denial

  - **Property 33: Unassigned Access Denial**
  - **Validates: Requirements 10.2**

- [ ] 12.4 Implement frontend route guards

  - Create guards for organizer routes
  - Create guards for reviewer routes
  - Create guards for team member routes
  - Redirect unauthorized users appropriately
  - _Requirements: 10.1, 10.2_

- [ ] 13. File Upload and Storage
- [ ] 13.1 Configure ActiveStorage for file uploads

  - Set up cloud storage (S3/GCS) configuration
  - Configure file size limits (50MB)
  - Set up CORS for direct uploads
  - _Requirements: 3.1_

- [ ] 13.2 Implement file type validation

  - Validate presentation files (.pdf, .ppt, .pptx) for ppt rounds
  - Validate project files (.zip, .tar.gz, .pdf, .md) for project rounds
  - Return appropriate error messages for invalid types
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 13.3 Implement secure file downloads

  - Generate pre-signed URLs for file access
  - Implement authorization checks before download
  - Add download tracking for audit
  - _Requirements: 3.4_

- [ ] 14. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. API Documentation
- [ ] 15.1 Document all API endpoints

  - Document request/response formats
  - Add example requests and responses
  - Document error codes and messages
  - Add authentication requirements
  - _API Endpoints_

- [ ] 15.2 Create Postman collection

  - Add all endpoints to collection
  - Add example requests with test data
  - Add environment variables
  - _Testing_

- [ ] 16. Integration and E2E Testing
- [ ]\* 16.1 Write integration tests for round workflow

  - Test complete flow: create round → configure criteria → submit → score
  - Test multi-reviewer scenarios
  - Test aggregation calculations
  - _Requirements: All_

- [ ]\* 16.2 Write integration tests for access control

  - Test organizer permissions
  - Test reviewer permissions
  - Test team member permissions
  - _Requirements: 10.1, 10.2_

- [ ] 17. Performance Optimization
- [ ] 17.1 Add database indexes

  - Verify all foreign key indexes exist
  - Add composite indexes for common queries
  - Add indexes on status fields
  - Verify GIN index on marking_criteria
  - _Performance Optimization_

- [ ] 17.2 Implement query optimization

  - Add eager loading to prevent N+1 queries
  - Implement pagination for large result sets
  - Add caching for aggregated scores
  - _Performance Optimization_

- [ ] 18. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
