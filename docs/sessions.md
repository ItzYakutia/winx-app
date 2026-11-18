# Browser sessions

- The header account menu exposes profile and sign-out independently of profile loading.
- Successful registration signs in immediately; existing users can open `/login`.
- Guarded routes remember their destination through sign-in. Return URLs are restricted
  to known internal app routes. Authenticated visitors skip the auth forms.
- `winx_auth` stores one atomic record containing access, refresh, expiry, email and
  session identity. Existing two-key sessions migrate once. An empty record after
  logout prevents an old tab from restoring those credentials.
- Known expiry refreshes before a protected HTTP request. A 401 triggers one shared
  refresh and one retry. Delayed 401s reuse a newer access token.
- Web Locks coordinate rotation between tabs. In-tab sharing still works where
  that browser API is unavailable. Lock callbacks enter Angular's zone.
- Definitively rejected refresh credentials open sign-in with a short explanation.
  Temporary server/network failures retain credentials so retry remains possible.
- Logout clears browser state immediately, synchronises other tabs and revokes
  the server session without blocking navigation. Pending refreshes cannot restore
  a signed-out session, and responses from a previous account are rejected.
- WebSocket chat reconnects when access rotates and closes on sign-out.

Run the deterministic session/storage/recovery regression tests with
`npm run test:session` from `frontend`. The tests execute the application modules
with browser/Angular primitives stubbed; real browser/API flows are verified
separately against temporary local accounts.
