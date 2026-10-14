# Implementation Plan: Local attendance and marketing workflow

## Overview
Adjust the local CRM screens so attendance evaluates the 40-call KPI, social KPI evaluates at least one customer from social media, and campaign details focus on assignment without duplicated planning tabs.

## Task List

### Phase 1: KPI rules
- [ ] Add pure helpers for the 40-call attendance target and social customer KPI.
- [ ] Add focused tests for below-target warnings and customer qualification.

### Phase 2: Attendance UI/data
- [ ] Load the selected day's call counts for each employee.
- [ ] Remove extension from attendance search and display.
- [ ] Show calls in shift, KPI progress, and warning when below 40.
- [ ] Move the attendance search/filter block above the summary content.

### Phase 3: Campaign and social UI
- [ ] Allow assignment rows to inherit the selected campaign instead of reselecting it.
- [ ] Move assignment controls to the campaign detail area and reduce duplicate campaign tabs.
- [ ] Keep adding posts/comments available after the social target is reached.
- [ ] Change social KPI completion to one or more qualified social customers.

### Checkpoint: Complete
- [ ] Tests pass.
- [ ] Typecheck/build pass locally.
- [ ] Verify local routes and responsive UI.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing attendance data has no call relation | Medium | Count CallLog by salesId and selected date without changing historical rows. |
| Campaign tab removal hides existing tasks | Medium | Keep the campaign detail and task board reachable from each campaign. |
