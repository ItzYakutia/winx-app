# TSIS 5 — Project Charter & Force Field Analysis

**Winx (Team Mode)** · Group: Alisher, Arman, Emil, Amire, Keskil · PM: Alisher · 14 October 2026 · IT Project Management (PjM 101)

**Schedule revision:** 14 October 2026. Project launch remains 1 October; this update separates planning in Weeks 5–7 from Team Mode development starting on 19 October. It supersedes the earlier development dates.

## 1. Launch summary

**Launch date:** 1 Oct 2026 (Week 5). **Attendees:** Alisher (PM), Arman (BA), Emil (Backend), Amire (Frontend), Keskil (QA); sponsor = course instructor.

- **MVP boundary:** academic profile, course swipe deck and team page (create/join, team size 3–5), with consent and account deletion, on top of the existing Winx microservices.
- **Phases and sprints:** TSIS 5 establishes the charter; TSIS 6–7 completes detailed planning by 16 October. Two 2-week development sprints start on 19 October; Alisher is Product Owner and the Scrum Master role rotates weekly.
- **Keskil joins as the 5th member** (QA and personal-data checks); roles of the other four stay as in TSIS 1+2 and TSIS 4.
- **Out of scope for the charter:** native mobile app, in-app chat, instructor dashboard.

## 2. Project Charter

### Purpose

Students struggle to find course teammates who complement their skills, and today they do it through random chat groups. Winx Team Mode will let a student fill in an academic profile (courses, skills), swipe through a deck of peers for one course, and form a team of 3–5. The target user is a university student who needs teammates for a course project. Why now: team projects start this semester, and the ordinary profile API and form reported in TSIS 3 already provide a foundation. The academic fields, course deck and team functions are planned development work.

**Business Case.** The semester project is for learning and user value, not revenue. Students save the time they lose finding teammates; the team practises charter → backlog → delivery on a real system with real users. No commercial launch is planned this semester.

### Objectives

1. **Deliver the Must features** (academic profile, course deck with swipe, team page with size limit 3–5) deployed online with Docker by 13 November (end of Week 11).
2. **Finish requirements:** summarise the 10 collected Google Forms responses into user stories with acceptance criteria by 16 October (end of Week 7), as part of TSIS 6–7.
3. **Usability:** by 13 November, test with 5 students; at least 4 complete “find a teammate for a course” and “create a team” without help.
4. **Personal data:** by 13 November, consent at sign-up and account deletion work and are checked against the team’s one-page checklist.
5. **Process:** submit the remaining TSIS by their course deadlines and record a retrospective at the end of each development sprint through Week 11.

### Overview

**Managerial approach:** hybrid. Plan-driven milestones cover the charter and detailed planning in Weeks 5–7. Team Mode delivery runs in two 2-week Scrum sprints in Weeks 8–11, with a weekly sync and a Plan & Fact report (TSIS 3 format). User stories, estimates, release planning, budget and Sprint 1 tasks are prepared in TSIS 6–7 before development starts.

**Technical approach:** Go (REST API), PostgreSQL (courses, skills, teams, team members), Angular UI (mobile-first swipe deck), Docker for deployment, Figma for wireframes, Postman for API checks, GitHub for code. .

**Out of scope** for this semester:

- Native mobile app (the web UI is used on phones)
- In-app chat or messaging between teammates
- Instructor dashboard and analytics
- University SSO and push notifications
- Skill-complement deck ordering (Feature 8) is a stretch goal, considered only after all Must features and required testing fit the available capacity

### Schedules

Team Mode development starts on 19 October, after the TSIS 6–7 planning milestone. Sprints last 2 weeks. The final course demo date is set by the instructor (to be confirmed); the internal MVP and demo-readiness target remains 13 November. The existing ordinary profile is reused and verified during Sprint 1.

| Milestone | Week / dates | Note |
| --- | --- | --- |
| Charter planning (TSIS 5) | Week 5 (28 Sep – 2 Oct);| Scope, objectives, responsibilities and risks |
| Detailed planning (TSIS 6–7) | Weeks 6–7 (5–16 Oct) | Analyse responses from survey; prepare stories, acceptance criteria, estimates, release plan, budget and Sprint 1 backlog |
| Sprint 1 | Weeks 8–9 (19–30 Oct) | Academic profile, course deck API and mobile swipe integration; test prototype on two phones by 23 Oct |
| Sprint 2 | Weeks 10–11 (2–13 Nov) | Team create/join, consent, account deletion, usability testing and deployment |
| Internal MVP review | End of Week 11 (13 Nov) | Online Must features and results from testing with 5 students; course demo date to be confirmed |

**Sprint 1 goal:** a student can save and reload an academic profile with courses and skills, select a course and browse candidates using the integrated swipe deck. This includes verifying the existing profile flow end to end and testing mobile gestures.

**Sprint 2 goal:** a student can create or join a course team with the 3–5 size rule; consent and account deletion work. The complete flow is tested with 5 students and deployed for the internal MVP review.

### Resources

- **Time:** about 7 hours per person per week, about 35 hours per week for 5 people.
- **Development capacity:** up to 70 team-hours per sprint, 140 across 19 October–13 November. These hours include implementation, QA, deployment and coordination. TSIS 6–7 will estimate tasks and reserve contingency within this limit;
- **Budget:** $0. Free or university-provided hosting for Docker containers; tools are GitHub, Figma, Postman and Google Forms.
- **Scope changes:** a new Must feature needs written approval from the PM and the sponsor (email or GitHub issue). Should/Could changes are decided by the PM and the team at sprint planning. Nothing is added to a running sprint without the PM.
- **Monitoring:** Alisher reviews hours and cash costs weekly. If estimates exceed capacity, the PM and sponsor review the scope or target date in writing before the team commits to the sprint.

### Personnel

| Member | Role | Main responsibility |
| --- | --- | --- |
| Alisher | PM / Product Owner | Sprint plans, weekly sync and reports, contact with sponsor; can take backend tasks |
| Arman | Business Analyst | Interviews, user stories, acceptance criteria, acceptance testing |
| Emil | Backend developer | Go services, database, matching, deployment |
| Amire | Frontend developer | Angular UI, swipe deck, wireframes |
| Keskil | QA / data-protection checks (new) | Test plan, usability sessions, API and security checks, personal-data checklist support |

**Sponsor:** course instructor. Responsibilities match the RACI from TSIS 1+2 and the competencies in TSIS 4; Keskil takes over the testing tasks (usability sessions, API and security checks) so Arman and Amire can focus on requirements and UI;

### Risk Management Plans

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | Swipe on mobile: Amire is Beginner, Intermediate is needed | Amire builds a small gesture-enabled test deck and checks it on two phones by 23 October (Week 8), before full deck integration |
| 2 | Only one member is Intermediate in Angular | Arman takes simple frontend tasks and pairs with Amire weekly from 19 October (Week 8); Keskil tests UI changes before merge |
| 3 | Survey responses may not become clear, testable requirements in time | Ten responses are collected. Arman summarises them and agrees acceptance criteria with the team by 16 October (Week 7), before Sprint 1 |
| 4 | Personal data rules missed; Alisher, Arman and Emil are Beginner | Arman and Keskil prepare the one-page checklist by 16 October (Week 7); implementation and verification of consent and account deletion are planned for Sprint 2 |
| 5 | Scope creep and a limited four-week development window | Alisher checks estimates against 140 team-hours in TSIS 6–7; prioritise Must features, keep Feature 8 outside the commitment and use the written change rule if the plan does not fit |

### Evaluation Methods

- **Instructor:** live demo of the Must features on the deployed app, TSIS grades, and sprint retrospective notes.
- **User test criteria (5 students, Keskil runs the sessions):** (1) at least 4 of 5 find a teammate for a course and create a team without help; (2) the swipe deck works on the students’ own phones without layout or gesture errors.
- **Lessons learned:** retrospective after every sprint, summary in the last TSIS.

## 3. Force Field Analysis

**MVP statement:** “Deliver a working Winx Team Mode MVP (academic profile, course swipe deck, team page, consent and account deletion) online and tested with 5 students by 13 November 2026 (Week 11).”

Driving forces total 24 and restraining forces total 22. This suggests a narrow margin; delivery feasibility still depends on the TSIS 6–7 estimates fitting the two-sprint capacity. Must features and testing take priority over Feature 8 and other optional work.

| Driving forces (+) | Str. | Restraining forces (−) | Str. |
| --- | --- | --- | --- |
| Existing Winx microservices and profile code already in place | 5 | Swipe on mobile is a new skill for the frontend developer | 4 |
| Alisher and Emil are Advanced in Go, PostgreSQL and Docker | 5 | Angular depends on one person (Amire) | 4 |
| Clear user need, real students are easy to reach for tests | 4 | Exam deadlines compete with four development weeks | 4 |
| Profile API and form already implemented (TSIS 3) | 4 | Scope creep from extra Team Mode ideas | 4 |
| Fifth member (Keskil) adds testing capacity | 3 | Collected responses still need agreed stories and acceptance criteria | 3 |
| Weekly sync and Plan & Fact reports keep the plan visible | 3 | Personal data rules are new to most of the team | 3 |

### Actions

| # | Action | Targets | Owner | Week |
| --- | --- | --- | --- | --- |
| 1 | Build a gesture-enabled swipe test deck and check it on two phones | Swipe gap | Amire | Week 8, by 23 Oct |
| 2 | Weekly 1-hour pairing on simple Angular tasks | Angular dependency | Arman with Amire | From Week 8, 19 Oct |
| 3 | One-page personal data checklist (consent, delete, what we do not store) | Data rules | Arman and Keskil | Week 7, by 16 Oct |
| 4 | Summarise 10 responses, agree stories and estimates, and fit the Must backlog to capacity | Requirements, scope and workload | Arman and Alisher | Week 7, by 16 Oct |
| 5 | Write the usability test plan and book 5 students | Testing readiness | Keskil | Week 8 |
| 6 | Review exam commitments and reserve time for QA before setting sprint workload | Exam load | Alisher | Weeks 7 and 9, before each sprint |

## 4. AI Disclosure

AI assisted with structure, wording and schedule consistency. The revised development start, team availability and survey progress reflect information supplied by the team. Development tasks and milestone dates are plans; they do not report completed implementation or testing.
