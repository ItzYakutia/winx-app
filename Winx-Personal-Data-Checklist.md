# Winx — Personal Data Checklist

**TSIS 5 / TSIS 6–7 supporting artifact · 14 October 2026**  
**Owners:** Arman — requirements; Keskil — verification. **Implementation:** Emil, Alisher and Amire.  
**Status:** checklist prepared; implementation and verification are planned for Sprint 2, **2–13 November**, before student onboarding. Unchecked boxes mean checks have not yet passed.

**Scope:** new accounts in the isolated Team Mode pilot; charter Objective 4, US-09 (consent) and US-10 (account deletion). Sprint 1 uses controlled test accounts and establishes the data inventory.

## Checks and pass conditions

- [ ] **1. Data inventory.** List each active store and its user-linked records: account/email/password hash, sessions, academic profile, courses, skills/role, choices, memberships and consent. Include PostgreSQL, MongoDB and Redis where used. **Emil + Keskil.**
- [ ] **2. Minimum data.** The pilot collects only fields needed for sign-in, academic discovery and teams. Social photos, chat, legacy accounts and unrelated personal fields are excluded; disabled routes and background jobs cannot create them. **Arman + Emil.**
- [ ] **3. Clear notice.** Before registration, explain the collected data, purposes, academic fields visible to classmates and how to delete an account. The notice matches the implemented pilot. **Arman + Amire.**
- [ ] **4. Explicit consent.** The checkbox starts unchecked. Both UI and API reject sign-up without acceptance; accepted registration records the user, notice version and timestamp. **Amire + Emil; Keskil tests both paths.**
- [ ] **5. Access and visibility.** Academic cards expose only intended academic fields. Emails, consent records and Pass decisions stay private. One user cannot edit another's profile or delete their account. **Emil + Keskil.**
- [ ] **6. Credentials and research files.** Passwords are hashed; tokens and raw survey contacts are absent from logs and reports. Record who accesses the survey workbook and when recruitment contacts will be removed; publish aggregate findings only. **Emil + Arman.**
- [ ] **7. Self-service deletion.** An authenticated user can explicitly confirm deletion. Active account/profile copies, selections, choices, consent records and memberships are removed; sign-in and existing sessions stop working. **Emil + Amire; Keskil verifies.**
- [ ] **8. Shared data and failures.** Deletion preserves other members and recalculates team size. Failed cleanup remains blocked/retryable without false success; delayed events cannot recreate the deleted profile. **Emil + Keskil.**
- [ ] **9. Retention boundary.** Document retained technical records and any backup retention. Do not present active-store deletion as immediate backup erasure. **Arman + Emil.**
- [ ] **10. Evidence and release check.** Record build/date, test account, action, expected/actual result and evidence link. Check consent refusal/acceptance, unauthorized access, deletion, old-session rejection and cleanup retry. **Keskil; Alisher reviews release readiness.**


<!-- One-page export target: A4, 11 pt, 15 mm margins. -->
