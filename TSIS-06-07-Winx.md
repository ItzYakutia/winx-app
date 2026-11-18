# TSIS 6–7 — User Stories, Profit Forecast, Release Plan & Sprint Backlog

**Winx — Team Mode** · **Group:** Alisher, Arman, Emil, Amire, Keskil · **PM / Product Owner:** Alisher · **Date:** 14 October 2026  
**Course:** IT Project Management (PjM 101) · **Planning deadline:** 16 October 2026

## 1. Scope link

This report develops the revised TSIS 5 charter into a delivery plan. TSIS 5 and TSIS 6–7 cover planning; new Team Mode development starts on **19 October**, with an internal MVP target of **13 November 2026**. Academic fields, course-specific discovery, team membership, consent and self-service deletion remain planned work.

| Charter objective | Contribution of this plan |
| --- | --- |
| **O1 — Online Must features by 13 November** | Academic profile, course deck and teams of 3–5; two development sprints and Docker deployment. |
| **O2 — Requirements by 16 October** | Analyse the 10 Google Forms responses; prepare stories and acceptance criteria. |
| **O3 — Usability by 13 November** | Test five students; at least four complete both finding a course teammate and creating a team without help. |
| **O4 — Personal data by 13 November** | Consent, account deletion and verification against the one-page checklist. |
| **O5 — Process through Week 11** | Weekly coordination/reports and a retrospective after each sprint, within the time budget. |

**Semester Must scope:** Feature 3, *Academic profile*; Feature 4, *Course-scoped swipe deck*; Feature 6, *Team formation*; and the consent/deletion slice of Feature 7, *Privacy and safety*. These names and numbers trace to TSIS 1+2; the revised charter narrows the implementation. The pilot uses self-selected courses from a small seeded catalogue and shared team join codes. A Like saves a candidate; classmates agree through their existing communication channel before sharing a code. A Like is neither an invitation nor membership.

The pilot exposes academic information only. Full Social/Team switching, university-email delivery, verified enrolment, match-gated invitations, in-app chat, report/block workflows, native apps and instructor dashboards are outside this delivery plan. Skill-complement ranking and public incomplete-team cards remain later candidates, without a semester commitment. Later changes to the Must scope follow the revised charter's written approval rule.

### Survey evidence and its limits

Source: **“Новая форма (Ответы) (1).xlsx”**, 10 responses dated 23 September 2026. These are questionnaire responses, not interviews. Counts below use all 10 respondents; multiple-choice answers can overlap.

| Observed result | Planning implication |
| --- | --- |
| **8/10** want to know skills; **4/10** want to know the person's role. | Expose skills and preferred role in academic profiles and candidate cards. |
| **7/10** experienced missing skills; **7/10** usually form teams within the final week. | Keep profile completion and course discovery short; test the complete flow. |
| **9/10** find teammates through friends. | External coordination is plausible; the join-code flow still needs usability validation. |
| **7/10** feel some discomfort rejecting acquaintances. | Proposed design: keep Pass decisions private. |
| **8/10** selected incomplete-team cards; **7/10** selected missing-skill recommendations. | Record demand, but defer these additions to protect the Must scope. |
| Interest scores: **4/10 rated 4–5**, **2/10 rated 3**, **4/10 rated 1–2**. | Demand is mixed; use a pessimistic forecast and validate actual use. |

Eight respondents are fourth-year students and six primarily identify as backend developers, so this small sample is not representative. The interest question included mutual-like chat: it does not validate the exact no-chat pilot. “Курс” in the demographic column means study year, not enrolment in a particular subject. No respondent contacts are reproduced here.

## 2. Initial User Stories List

All ten stories are **Must** for this pilot. Their IDs remain unchanged in the product backlog and release plan. O1–O4 refer to the charter objectives above; O5 is supported by shared process tasks.

### Academic profile and course discovery

| ID | User story | Given | When | Then | Pri | Feature | Obj # |
| --- | --- | --- | --- | --- | --- | --- | --- |
| US-01 | As a student, I want to save my courses so that I can discover relevant classmates. | I am signed in. | I select a catalogue course, save and reload. | The same course remains selected. | Must | F3 — Academic profile | 1, 2 |
| US-02 | As a student, I want to save skills and a preferred role so that classmates understand my contribution. | My academic profile is open. | I save skills and a role, then reload. | The saved values are displayed. | Must | F3 — Academic profile | 1, 2 |
| US-03 | As a student, I want a deck for one selected course so that I can find relevant teammates. | I selected a course with available candidates. | I open its deck. | I see other eligible students from that course and their academic fields. | Must | F4 — Course deck | 1, 3 |
| US-04 | As a student, I want to save or pass candidates so that I can keep a useful shortlist. | A course candidate is displayed. | I Like using a swipe or button. | One choice is saved for that course and the candidate appears in my shortlist. | Must | F4 — Course deck | 1, 3 |
| US-05 | As a student, I want to create a course team and obtain a join code so that classmates can join me. | I selected a course and have no team in it. | I create a named team. | I see a one-member Forming team and join code; I leave that course's candidate pool. | Must | F6 — Team formation | 1, 3 |

### Team membership and personal data

| ID | User story | Given | When | Then | Pri | Feature | Obj # |
| --- | --- | --- | --- | --- | --- | --- | --- |
| US-06 | As a student, I want to join a course team by code so that I can participate in its project. | I selected its course, have no team there, and it has fewer than five members. | I submit a valid code. | I become a member and see the updated team roster. | Must | F6 — Team formation | 1, 3 |
| US-07 | As a team member, I want to see my team's roster so that I know who is working with me. | I belong to a course team. | I open its page. | I see its course, name and current members with academic roles/skills. | Must | F6 — Team formation | 1, 3 |
| US-08 | As a team member, I want a clear size status so that I know whether my team meets the project limit. | A Forming team has two members. | A third eligible student joins. | The status changes to Ready and the displayed size becomes three. | Must | F6 — Team formation | 1, 3 |
| US-09 | As a new pilot user, I want to review and accept the data notice so that I can make an informed sign-up choice. | The consent box is unchecked. | I try to register without accepting. | No account is created and the required consent is explained. | Must | F7 — Privacy; charter consent | 4 |
| US-10 | As a pilot user, I want to delete my account so that my active account data is removed. | I am signed in to a pilot account. | I confirm deletion and it completes. | Sign-in fails, my profile disappears and my team membership is removed. | Must | F7 — Account deletion | 4 |

**Shared boundaries:** one team per student per course; creators are ordinary members. A team starts with one member: **1–2 = Forming, 3–4 = Ready, 5 = Full**. Three is the minimum completed team size, not the minimum needed to create one. Students already in a team are excluded from that course's candidate deck. Academic cards show no Social photos, private contact details or Pass decisions.

## 3. Story details

### US-03 — Browse a course deck · Must · 5 SP

**In scope:** selected-course filtering, academic cards, self-exclusion, loading/empty/error states. **Out of scope:** verified enrolment, ranking by complementary skills, public team advertisements and Social discovery. Sprint 1 establishes course/self filtering; US-05 and US-06 add and verify membership-based exclusion in Sprint 2 when the team model exists.

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| Relevant candidates | I selected course A; eligible classmates exist in A and B. | I load A's deck. | Only other eligible students in A appear, with academic fields only. |
| Empty deck | A has no eligible candidates. | I open A's deck. | An empty-state message appears; candidates from B are not substituted. |
| Invalid selection | Course B is not in my saved course selection. | I request B's deck directly. | The request is rejected; I must update my selection first. |

### US-04 — Save or pass a candidate · Must · 5 SP

**In scope:** swipe gestures and equivalent buttons, course-specific persistence, a simple saved-candidate list and retry feedback. **Out of scope:** mutual-match chat, invitations, ranking and changes to existing Social choices.

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| Equivalent controls | A candidate is visible in course A. | I Like by gesture or button. | Exactly one choice is stored; reloading A's shortlist retains that candidate. |
| Private Pass | Another candidate is visible. | I Pass. | The card advances after saving; the candidate is not shortlisted or notified. |
| Failed request | Saving a choice fails. | I attempt to Like or Pass. | An error and retry remain available; the card is not silently discarded. |
| Course isolation | I saved a choice for a student in A. | I open course B. | A's choice does not change that student's choices or visibility in B. |

Regression fixtures separately check that academic choices do not modify existing Social choice records; Social screens are not part of the pilot user journey.

### US-06 — Join a course team · Must · 5 SP

**In scope:** valid-code join, one team per course, server-side membership checks and atomic capacity enforcement. **Out of scope:** owner approval, match-gated invitations, team transfers and messaging. Joining uses an existing channel to obtain the code.

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| Successful join | I selected A, have no team in A, and its code identifies a two-member team. | I join with that code. | I appear once in the roster; size becomes three, status Ready, and I leave A's candidate pool. |
| Concurrent capacity | A team has four members and two eligible students try to join. | Both requests arrive together. | At most one succeeds; the roster never exceeds five and the other sees Full. |
| Invalid membership | I already belong to an A team, or have not selected the code's course. | I submit the code. | The join is rejected without changing either team's membership. |

### US-10 — Delete a pilot account · Must · 5 SP

**In scope:** self-service removal of new pilot accounts, active sessions, profile copies, course/skill data, choices, memberships and consent records. Remaining team members are preserved; empty teams are removed and sizes recalculated. Cleanup must cover the actual active stores, including PostgreSQL, MongoDB and Redis where applicable.

**Out of scope:** importing legacy Social accounts, Social photos, chat history and erasing historical backups. The isolated pilot must disable those features/routes and prevent background processing from creating excluded data. This boundary is a delivery assumption to verify before student onboarding, not a claim that deleting one database row is sufficient.

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| Completed deletion | A pilot account has a profile, choices, an active session and a team membership. | Its owner confirms deletion. | Completion is shown only after active data is removed; old sessions and sign-in fail, and candidate results exclude the account. |
| Partial failure | A required store is unavailable. | Cleanup cannot complete. | The account remains blocked/pending; retry is possible and success is not falsely displayed. |
| Shared team | The deleting user is one of three members. | Deletion completes. | The other two members remain and the team becomes Forming. |

**Readiness gate:** Emil and Keskil verify the data inventory, session revocation, retries and prevention of stale-event recreation. Additional stores or legacy history require splitting/re-estimating US-10 before commitment.

## 4. Grooming notes

**Date:** 13 October 2026 · **Time:** 17:00–17:20 · **Duration:** 20 minutes.  
**Participants:** Alisher (PM / PO), Arman (BA), Emil (Backend), Amire (Frontend), Keskil (QA). Alisher facilitated; Arman recorded the scope decisions.

| Question discussed | Agreed answer |
| --- | --- |
| 1. Does course selection verify official university enrolment? | No; students self-select from a seeded pilot catalogue. |
| 2. How can a student create a team when the required size is 3–5? | Creation starts at one; a team becomes Ready at three and Full at five. |
| 3. What happens after a Like if chat is outside the charter? | The student keeps a shortlist; agreement and code sharing happen through an existing channel. |

**Two scope decisions:** (1) keep catalogue selection and academic-only cards, with no enrolment integration or ranking; (2) use code-based joining and Forming/Ready/Full states, without a new messaging or invitation subsystem. These boundaries are reflected in US-01–US-08. Arman maintains the acceptance criteria, while Alisher applies the charter's change rule to any later additions.

## 5. Profit Forecast Calculation

This is an **incremental social-value forecast**, not commercial revenue. The common unit is **equivalent human-hours**: one student-hour saved and one team-hour spent receive equal weight.

**Assumptions:**

1. Benefits cover **14 November 2026–13 November 2027**, after the MVP target.
2. Count the full **140-hour** future development allowance, including contingency, once. Existing implementation and pre-development planning effort are outside this incremental calculation; they are unmeasured, not zero.
3. Active students, annual searches and time saved per search are scenario hypotheses, not measured survey results.
4. Each successful supported search saves the stated time against the student's usual method; repeated searches are counted only at the assumed frequency.
5. Hosting, APIs and tools remain free or university-provided; volunteer labor has a **$0 cash rate**, and no revenue is assumed.
6. Post-release maintenance is an additional scenario cost outside the 140-hour development budget, conditional on continued support.
7. No instructor time savings, recruitment income or other benefits are added, avoiding double counting.

| Line | Base | Pessimistic | Optimistic | Formula / unit |
| --- | ---: | ---: | ---: | --- |
| Active students | 200 | 50 | 300 | Hypothesis |
| Successful supported searches per student per year | 2 | 1 | 3 | Hypothesis |
| Hours saved per search | 0.50 | 0.25 | 0.75 | Hypothesis |
| Build effort, including reserve | 140 | 140 | 140 | Team-hours |
| Post-release maintenance | 12 | 24 | 24 | Team-hours |
| **Total cost** | **152** | **164** | **164** | Build + maintenance |
| **Total benefit** | **200** | **12.5** | **675** | Students × searches × hours saved |
| **Net value** | **48** | **−151.5** | **511** | Benefit − cost, equivalent human-hours |
| Cash cost / revenue | $0 / $0 | $0 / $0 | $0 / $0 | Separate from time value |

The base case breaks even at **152 active students** under its usage assumptions; the pessimistic case is negative. Mixed survey interest makes adoption uncertain, so this forecast supports testing a small pilot rather than assuming campus-wide use. The five-student test checks usability; it does not establish annual adoption or actual time savings.

## 6. Prioritized Product Backlog

Alisher owns the backlog order; the team owns the estimates. All ten initial stories are retained. Points express relative complexity and uncertainty, **not hours**; there is no measured Team Mode velocity yet.

| Rank | ID | Story | Pri | SP | Dependencies |
| ---: | --- | --- | --- | ---: | --- |
| 1 | US-01 | Save courses | Must | 3 | Existing profile/auth; seeded catalogue |
| 2 | US-02 | Save skills and role | Must | 3 | Shared academic profile model from US-01 |
| 3 | US-03 | Browse course candidates | Must | 5 | US-01, US-02; course-specific candidate rules |
| 4 | US-04 | Save/pass and shortlist | Must | 5 | US-03; course-specific choice persistence |
| 5 | US-09 | Consent at pilot sign-up | Must | 3 | Existing registration; agreed data notice/checklist |
| 6 | US-05 | Create team and join code | Must | 3 | US-01, US-03; team model, uniqueness and deck exclusion |
| 7 | US-06 | Join a course team | Must | 5 | US-05, US-03; atomic limit and deck exclusion |
| 8 | US-07 | View team roster | Must | 3 | US-05, US-06; academic profile fields |
| 9 | US-08 | Display team size status | Must | 3 | US-05–US-07; shared size/state rules |
| 10 | US-10 | Delete pilot account | Must | 5 | Final active-data inventory across US-01–US-09 |
| | | **Total** | | **38** | **Planning baseline** |

Consent and deletion are mandatory gates before onboarding real students, despite implementation dependencies placing deletion last. Review its data inventory during Sprint 1; use controlled test accounts until the gates pass. Survey requests for ranking and public team cards are not hidden inside these estimates.

## 7. Planning poker log

**Date:** 13 October 2026 · **Time:** 17:20–17:50 · **Duration:** 30 minutes.  
**Participants:** Alisher, Arman, Emil, Amire, Keskil. Alisher facilitated; each participant estimated independently before revealing the vote.

The team used Fibonacci **1, 2, 3, 5, 8, 13**, discussed the scope behind different estimates and re-voted instead of averaging. An estimate of 8 triggers splitting if it remains after clarification; 13 means the story needs further grooming or a spike.

Votes below are listed in the order **Alisher / Arman / Emil / Amire / Keskil**.

| Story | First votes, SP | Reason for disagreement and resolution | Re-vote, SP |
| --- | --- | --- | --- |
| US-03 | **3 / 3 / 5 / 5 / 5** | Alisher and Arman initially treated the story as adding a course filter to existing recommendations. Emil, Amire and Keskil included the academic response model, UI states, course isolation and acceptance checks. The team included this complete slice, excluded ranking and enrolment verification, and assigned membership-based exclusion to US-05/06 in Sprint 2. | **5 / 5 / 5 / 5 / 5 → 5 SP** |
| US-10 | **5 / 3 / 8 / 5 / 8** | Arman focused on deleting the account record; Emil and Keskil included sessions, profile copies, memberships and partial failures across services. The team limited the story to new isolated pilot accounts, disabled legacy Social features and retained complete active-data cleanup with retries. The estimate assumes that boundary; additional stores or legacy data trigger re-estimation before Sprint 2. | **5 / 5 / 5 / 5 / 5 → 5 SP** |

The resulting backlog totals **38 SP: 16 in Sprint 1 and 22 in Sprint 2**. Estimates remain revisable when implementation reveals new work; the separate member-level hour budget determines whether a sprint commitment fits capacity.

## 8. Release plan

The revised TSIS 5 calendar is the baseline: planning through **16 October**, Sprint 1 **19–30 October**, Sprint 2 **2–13 November**. Earlier TSIS documents remain historical records. The internal MVP and demo-readiness target is **13 November**.

| Release / checkpoint | Target sprint(s) | Story IDs | Sum SP | Demo / outcome |
| --- | --- | --- | ---: | --- |
| Internal increment | Sprint 1, Weeks 8–9 | US-01, US-02, US-03, US-04 | **16** | With test accounts: save academic data, select a course, browse and save/pass candidates on a phone. |
| MVP completion increment | Sprint 2, Weeks 10–11 | US-05, US-06, US-07, US-08, US-09, US-10 | **22** | Consent, create/join a team, see its roster/status and delete an account; deploy and run the five-student test. |
| **R1 — complete MVP** | **Sprints 1–2; 13 November** | **US-01–US-10** | **38** | **All Must acceptance criteria pass on the deployed pilot.** |

R1 is the cumulative total, not an extra 38 points. The 22-point second increment does not assume a higher velocity: hours are estimated separately, and Sprint 2 must be rechecked after Sprint 1.

**Release checks:** academic profile save/reload; course isolation; two-phone gesture checks; team uniqueness and maximum five; consent and complete/retryable deletion; online Docker smoke checks; five student sessions with at least four completing both charter tasks unaided. Record actual results after execution. A failed Must or usability gate means the target has not been achieved.

## 9. Budget calculation

**Top-down cap:** **$0 cash and 140 team-hours**, from **5 people × 7 hours/week × 4 development weeks**; no more than **14 hours per person per sprint**.

### Bottom-up labor estimate

| Member / role | Sprint 1 tasks and planned hours | Sprint 2 tasks and estimated hours | Reserve, both sprints | Maximum |
| --- | --- | --- | ---: | ---: |
| Alisher — PM / backend support | API/review/acceptance work 9; coordination/reporting 2; ceremonies 1 = **12 h** | Team API/storage 7; consent endpoint 2; coordination 2; ceremonies 1 = **12 h** | 4 h | 28 h |
| Arman — BA / simple UI support | Criteria, fixtures and UI/pairing 11; ceremonies 1 = **12 h** | Criteria/checklist 3; UI/pairing 4; student tests 2; guidance/acceptance notes 2; ceremonies 1 = **12 h** | 4 h | 28 h |
| Emil — Backend / deployment | Academic profile, deck and choices 11; ceremonies 1 = **12 h** | Deletion 6; join-concurrency review 1; deployment 3; integration fixes 1; ceremonies 1 = **12 h** | 4 h | 28 h |
| Amire — Frontend | Forms, deck, gestures and phone checks 11; ceremonies 1 = **12 h** | Team screens 4; consent/deletion UI 3; integration/mobile fixes 3; usability/demo support 1; ceremonies 1 = **12 h** | 4 h | 28 h |
| Keskil — QA | Acceptance/phone checks 8; usability preparation/recruitment 3; ceremonies 1 = **12 h** | Five-student sessions/results 4; API/data checks 4; deployment/mobile regression 3; ceremonies 1 = **12 h** | 4 h | 28 h |
| **Total** | **60 h** | **60 h** | **20 h** | **140 h** |

### Cash, contingency and feasibility

| Item | Amount |
| --- | --- |
| Planned volunteer labor | 120 h × $0/h = **$0 cash** |
| Labor contingency | **20 h** × $0/h = $0; **2 h/person/sprint** |
| Hosting / APIs | **$0**, subject to a suitable free or university environment |
| GitHub, Figma, Postman, Google Forms | **$0**, using available free access |
| Cash contingency | **$0**; a paid service requires a budget decision |
| **Total development budget** | **140 h and $0 cash** |

The charter sets the top-down limit; the bottom-up estimate assigns work to roles and tasks within it. The **20-hour reserve is 16.7% of the 120 planned hours**, not extra capacity beyond 140. These hours include coordination, QA, deployment and both participants' time in pairing; there is no fixed SP-to-hour conversion. This implements the assignment's Meredith top-down/bottom-up distinction, with estimates refined as scope becomes clearer. The forecast counts the same 140 hours once, then adds separate hypothetical post-release maintenance.

**Feasibility remains conditional.** Sprint 2's six-hour deletion allowance and three-hour deployment allowance are particularly uncertain. Existing Docker files do not prove a working deployment: the production Caddy configuration and hosting environment must be confirmed. Before Sprint 2 commitment, Alisher and Emil check the active-data inventory, background events, session handling and deployment effort; an isolated pilot still needs deletion across its active stores.

Each person has only two reserve hours per sprint; unused QA time cannot automatically become backend capacity. If revised estimates exceed individual capacity, use suitable support and explicit re-estimation, or have the PM and sponsor review scope/date under the charter's change rule. Do not silently drop Must acceptance criteria to make the totals fit.

## 10. Sprint 1 Sprint Backlog

**Dates:** 19–30 October 2026 · **Sprint Goal:** A student can save and reload an academic profile, select a course, and browse, save or pass eligible candidates using the mobile web interface.

| Order | Selected PBI | SP |
| ---: | --- | ---: |
| 1 | US-01 — Save courses | 3 |
| 2 | US-02 — Save skills and role | 3 |
| 3 | US-03 — Browse course candidates | 5 |
| 4 | US-04 — Save/pass and shortlist | 5 |
| | **Total** | **16** |

Selection order reflects dependencies; the gesture prototype starts early with fixture cards so the two-phone check can happen by **23 October**. Sprint 1 uses controlled test accounts. The supporting [Personal Data Checklist](Winx-Personal-Data-Checklist.md), owned by Arman and Keskil, was prepared on **14 October**, ahead of the **16 October** planning deadline. It defines checks; passing results will be recorded during implementation. Final inventory verification is included in the profile/deck review work.

### Tasks by PBI

Hours below are **person-hours**; each named contributor's time is counted separately.

| PBI | Task | Owner and hours | Total h |
| --- | --- | --- | ---: |
| US-01 | Define course-selection criteria and a small course fixture. | Arman 1 | 1 |
| US-01 | Extend profile API/storage for courses; review data inventory and implementation. | Emil 2; Alisher 1 | 3 |
| US-01 | Connect selector and saved state; includes Week 8 pairing. | Amire 2; Arman 1 | 3 |
| US-01 | Verify ordinary-profile regression and academic save/reload end to end. | Keskil 2; Alisher 1 | 3 |
| US-02 | Define skill/role inputs and acceptance cases. | Arman 1 | 1 |
| US-02 | Extend profile API/storage for skills and role; review changes. | Emil 2; Alisher 2 | 4 |
| US-02 | Connect skill/role fields and validation to the form. | Amire 2; Arman 1 | 3 |
| US-02 | Check persistence, empty optional values and invalid inputs. | Keskil 2 | 2 |
| US-03 | Prepare same-course/different-course fixtures and expected results. | Arman 2 | 2 |
| US-03 | Implement filtered academic candidates, eligibility and data boundaries. | Emil 4; Alisher 2 | 6 |
| US-03 | Connect deck loading/empty/error states; includes Week 9 pairing. | Amire 2; Arman 2 | 4 |
| US-03 | Verify filtering, self-exclusion and empty results. | Keskil 2 | 2 |
| US-04 | Define Like/Pass transitions, privacy and shortlist criteria. | Arman 1 | 1 |
| US-04 | Persist course-specific choices/shortlist; check duplicates, isolation and errors. | Emil 3; Alisher 3 | 6 |
| US-04 | Build gesture prototype; integrate controls, shortlist and retry feedback. | Amire 4; Arman 2 | 6 |
| US-04 | Check prototype on two phones by 23 October; check integrated flow afterward. | Keskil 2; Amire 1 | 3 |
| | **Story work** | | **50** |

### Shared work and capacity check

| Work | Owner and hours | Total h |
| --- | --- | ---: |
| Two 15-minute weekly syncs and one 30-minute sprint review/retrospective | Each member 1 | 5 |
| Board, coordination, weekly reports and review preparation | Alisher 2 | 2 |
| Prepare usability scenarios and arrange five participants in Week 8 | Keskil 3 | 3 |
| **Shared work** | | **10** |
| **Planned work** | **12 h per person** | **60** |
| **Contingency within capacity** | **2 h per person** | **10** |
| **Sprint ceiling** | **14 h per person** | **70** |

The Week 8 US-01 and Week 9 US-03 UI tasks each include one hour of Arman–Amire pairing: **four person-hours altogether**, already counted. Sprint 2 follows the same weekly pairing pattern within its UI allocations. Profile, deck and swipe estimates assume reuse of existing code; the early mobile prototype and integration checks determine whether that assumption holds.

**Sprint completion evidence:** linked implementation changes, recorded GWT outcomes, ordinary-profile end-to-end results, and the two-phone check with device/browser and observed issues. All are future deliverables. Carry unfinished stories forward explicitly and re-plan remaining capacity; preparation of this report does not mark them Done.

## 11. AI Disclosure

AI assisted with the English structure and wording. The team takes responsibility for this planning baseline. AI did not conduct interviews, student usability tests or team voting.


<!-- Export: A4, 11 pt, 15 mm margins, normal text wrapping in tables. The submission is one English PDF, 8–12 pages; final pagination depends on the exporter. -->
