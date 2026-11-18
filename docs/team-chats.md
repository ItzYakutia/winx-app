# Team conversations

A Team Mode like now creates one shared conversation for that pair and course.
It does not require a reciprocal like. The choice and chat commit in one PostgreSQL
transaction; retries and simultaneous reciprocal likes do not create duplicates.
Previously saved likes are migrated into conversations.

Team Mode has four destinations: search, chats, team and profile. The chat list
shows peer names, last messages and dates, filtered by course. Incoming likes are
visible to the recipient. The old `/team/shortlist` route redirects to chats.

Conversations reuse the existing messages table and WebSocket transport.
Academic chat metadata/history/decisions use the authenticated profile academic
API. Participants can read their history; outsiders receive 404. Social chat lists
exclude academic rooms. The frontend normalizes the server's nested message
envelope, waits for a server acknowledgment and merges history by message ID.

The chat header offers:

- Add to team: enroll the peer in the acting user's existing team, or create a
  named team containing both participants if the acting user has no team.
- Decline: hide the conversation from both active lists and block future messages;
  both participants retain access to the existing history.

Adding requires current course enrollment, no conflicting peer membership and
fewer than five members. Row locks serialize adds and existing join-by-code
operations. Joining twice is idempotent. Rejection cannot remove existing team
membership. Closing and sending also lock the same chat row so closure is enforced
on the server, including for raw WebSocket clients.

The new SQL migration belongs to the combined, timestamp-ordered migration set
(`scripts/start-local.ps1` assembles that set). It changes the shared chats table
after the original chat and course/team migrations.

Integration tests use `WINX_TEST_DSN` and explicitly require a database named
`winx_conv_qa_*`. Run with `go test -tags integration` in the conversation
repository package and the chat message repository package. Unit tests cover a
stale WebSocket disconnect after access-token rotation.
