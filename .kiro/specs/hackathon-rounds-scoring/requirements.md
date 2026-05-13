# Requirements Document

## Introduction

This document outlines the requirements for implementing a multi-round hackathon evaluation system. The system enables hackathon organizers to configure multiple rounds with different submission types (presentations or projects), define marking criteria, collect team submissions, and facilitate scoring by judges and mentors. This feature enhances the hackathon experience by providing structured evaluation workflows and transparent scoring mechanisms.

## Glossary

- **Hackathon System**: The platform that manages hackathon events, teams, and evaluations
- **Round**: A distinct evaluation phase in a hackathon with specific submission requirements and marking criteria
- **Marking Criteria**: A set of evaluation parameters with defined score ranges used to assess team submissions
- **Team Submission**: Files and materials submitted by a hackathon team for a specific round
- **Reviewer**: A judge or mentor authorized to evaluate team submissions and assign scores
- **Score Card**: A structured evaluation form containing scores for each marking criterion
- **Overall Review Status**: A categorical assessment (Rejected, Borderline, Accept, Strongly Accept) of a team's submission

## Requirements

### Requirement 1: Round Configuration

**User Story:** As a hackathon organizer, I want to create and configure multiple evaluation rounds, so that I can structure the hackathon with different stages and submission requirements.

#### Acceptance Criteria

1. WHEN an organizer creates a round, THE Hackathon System SHALL store the round with a unique identifier linked to the hackathon
2. WHEN an organizer defines marking criteria for a round, THE Hackathon System SHALL store the criteria as a structured list with keys, minimum values, and maximum values
3. WHEN an organizer specifies a submission type for a round, THE Hackathon System SHALL accept either presentation or project as valid submission types
4. WHEN an organizer retrieves round information, THE Hackathon System SHALL return all configured marking criteria and submission type for that round
5. WHEN an organizer updates round configuration, THE Hackathon System SHALL preserve existing team submissions and scores for that round

### Requirement 2: Marking Criteria Management

**User Story:** As a hackathon organizer, I want to define standardized marking criteria for each round, so that all reviewers evaluate teams consistently using the same parameters.

#### Acceptance Criteria

1. WHEN an organizer adds a marking criterion, THE Hackathon System SHALL validate that the criterion includes a key, minimum score, and maximum score
2. WHEN an organizer sets score ranges for a criterion, THE Hackathon System SHALL ensure the minimum value is less than or equal to the maximum value
3. WHEN an organizer selects from predefined criteria, THE Hackathon System SHALL provide options including innovation, problem_solution_relevance, technical_feasibility, and scalability
4. WHEN an organizer defines custom criteria, THE Hackathon System SHALL accept and store the custom criterion with specified score ranges
5. WHEN marking criteria are retrieved for scoring, THE Hackathon System SHALL return all criteria in the order they were defined

### Requirement 3: Team Submission Management

**User Story:** As a hackathon team member, I want to submit files and materials for each round, so that reviewers can evaluate our work according to the round requirements.

#### Acceptance Criteria

1. WHEN a team member uploads a submission file, THE Hackathon System SHALL associate the file with the specific round and team
2. WHEN a team member adds submission comments, THE Hackathon System SHALL store the comments alongside the submission file
3. WHEN a team member submits materials, THE Hackathon System SHALL record the submitting user as the creator of the submission
4. WHEN a team member views submission history, THE Hackathon System SHALL display all submissions for their team across all rounds
5. WHEN a team member updates a submission before the deadline, THE Hackathon System SHALL replace the previous submission while maintaining submission history

### Requirement 4: Reviewer Score Submission

**User Story:** As a reviewer (judge or mentor), I want to evaluate team submissions using the defined marking criteria, so that I can provide structured feedback and scores.

#### Acceptance Criteria

1. WHEN a reviewer accesses a team submission, THE Hackathon System SHALL display the submission files, comments, and applicable marking criteria
2. WHEN a reviewer enters scores for each criterion, THE Hackathon System SHALL validate that each score falls within the defined minimum and maximum range for that criterion
3. WHEN a reviewer saves scores, THE Hackathon System SHALL calculate and store the total score as the sum of all criterion scores
4. WHEN a reviewer selects an overall review status, THE Hackathon System SHALL accept only Rejected, Borderline, Accept, or Strongly Accept as valid values
5. WHEN a reviewer adds remarks, THE Hackathon System SHALL store the remarks text with the score submission

### Requirement 5: Score Draft and Submission Workflow

**User Story:** As a reviewer, I want to save my evaluation as a draft before final submission, so that I can review and refine my scores before they become official.

#### Acceptance Criteria

1. WHEN a reviewer saves scores with draft status, THE Hackathon System SHALL store the scores without making them visible to teams or organizers
2. WHEN a reviewer submits scores with submitted status, THE Hackathon System SHALL finalize the scores and make them available for aggregation
3. WHEN a reviewer returns to a draft score, THE Hackathon System SHALL allow modification of all score fields and status
4. WHEN a reviewer attempts to modify a submitted score, THE Hackathon System SHALL prevent changes to maintain evaluation integrity
5. WHEN a reviewer views their scoring queue, THE Hackathon System SHALL distinguish between draft and submitted evaluations

### Requirement 6: Score Calculation and Validation

**User Story:** As the system, I want to automatically calculate total scores and validate score ranges, so that scoring remains consistent and accurate across all evaluations.

#### Acceptance Criteria

1. WHEN a reviewer enters scores for all criteria, THE Hackathon System SHALL compute the total score by summing all individual criterion scores
2. WHEN a reviewer enters a score outside the valid range, THE Hackathon System SHALL reject the input and display an error message indicating the valid range
3. WHEN marking criteria are updated after scores exist, THE Hackathon System SHALL maintain existing scores and flag them for review
4. WHEN multiple reviewers score the same team, THE Hackathon System SHALL store each reviewer's scores independently
5. WHEN calculating aggregate scores, THE Hackathon System SHALL compute the average of all submitted (non-draft) scores for each team

### Requirement 7: Multi-Reviewer Support

**User Story:** As a hackathon organizer, I want multiple reviewers to independently evaluate each team, so that scoring is fair and represents diverse perspectives.

#### Acceptance Criteria

1. WHEN multiple reviewers access the same team submission, THE Hackathon System SHALL allow each reviewer to create independent score submissions
2. WHEN a reviewer views a team submission, THE Hackathon System SHALL not display other reviewers' scores to maintain evaluation independence
3. WHEN an organizer views team scores, THE Hackathon System SHALL display all reviewer scores with reviewer identification
4. WHEN calculating final scores, THE Hackathon System SHALL include only submitted scores and exclude draft scores
5. WHEN a reviewer is assigned to evaluate teams, THE Hackathon System SHALL track which teams each reviewer has evaluated

### Requirement 8: Data Integrity and Relationships

**User Story:** As a system administrator, I want all data relationships properly maintained, so that the system remains consistent and reliable.

#### Acceptance Criteria

1. WHEN a round is created, THE Hackathon System SHALL enforce a valid foreign key relationship to an existing hackathon
2. WHEN a team submission is created, THE Hackathon System SHALL enforce valid foreign key relationships to both a round and a hackathon team
3. WHEN a score is created, THE Hackathon System SHALL enforce valid foreign key relationships to a reviewer user, round, and team submission
4. WHEN a hackathon is deleted, THE Hackathon System SHALL handle cascading deletion or preservation of associated rounds, submissions, and scores according to configured rules
5. WHEN referential integrity is violated, THE Hackathon System SHALL reject the operation and return a descriptive error message

### Requirement 9: Submission Type Handling

**User Story:** As a hackathon organizer, I want to specify different submission types for different rounds, so that I can require presentations in early rounds and projects in final rounds.

#### Acceptance Criteria

1. WHEN a round requires presentation submissions, THE Hackathon System SHALL accept file uploads in presentation formats (PDF, PPT, PPTX)
2. WHEN a round requires project submissions, THE Hackathon System SHALL accept file uploads in various formats including code archives and documentation
3. WHEN a team views submission requirements, THE Hackathon System SHALL clearly display the required submission type for each round
4. WHEN a team uploads a file, THE Hackathon System SHALL validate the file type matches the round's submission type requirements
5. WHEN submission type is changed after submissions exist, THE Hackathon System SHALL maintain existing submissions and notify affected teams

### Requirement 10: Reviewer Assignment and Access Control

**User Story:** As a hackathon organizer, I want to control which reviewers can evaluate which teams, so that I can manage workload distribution and avoid conflicts of interest.

#### Acceptance Criteria

1. WHEN an organizer assigns a reviewer to teams, THE Hackathon System SHALL grant that reviewer access to view and score those specific team submissions
2. WHEN a reviewer attempts to access an unassigned team, THE Hackathon System SHALL deny access and display an appropriate message
3. WHEN an organizer views reviewer assignments, THE Hackathon System SHALL display which reviewers are assigned to which teams
4. WHEN an organizer removes a reviewer assignment, THE Hackathon System SHALL revoke access while preserving any existing scores from that reviewer
5. WHEN calculating reviewer workload, THE Hackathon System SHALL count the number of teams assigned to each reviewer

### Requirement 11: Score Aggregation and Reporting

**User Story:** As a hackathon organizer, I want to view aggregated scores and rankings for all teams, so that I can make informed decisions about round advancement and winners.

#### Acceptance Criteria

1. WHEN an organizer requests team rankings, THE Hackathon System SHALL calculate average scores from all submitted reviews for each team
2. WHEN displaying team scores, THE Hackathon System SHALL show individual criterion scores, total scores, and overall review status distribution
3. WHEN multiple reviewers have different overall review statuses, THE Hackathon System SHALL display the count of each status category
4. WHEN generating score reports, THE Hackathon System SHALL include reviewer remarks in an aggregated format
5. WHEN filtering teams by score, THE Hackathon System SHALL support filtering by minimum score threshold and overall review status

### Requirement 12: Audit Trail and Timestamps

**User Story:** As a hackathon organizer, I want to track when submissions and scores were created and modified, so that I can maintain transparency and resolve disputes.

#### Acceptance Criteria

1. WHEN a team submission is created, THE Hackathon System SHALL record the creation timestamp
2. WHEN a score is submitted, THE Hackathon System SHALL record the submission timestamp
3. WHEN a score transitions from draft to submitted, THE Hackathon System SHALL record the transition timestamp
4. WHEN viewing submission history, THE Hackathon System SHALL display all timestamps in the hackathon's configured timezone
5. WHEN generating audit reports, THE Hackathon System SHALL include all creation and modification timestamps for submissions and scores
