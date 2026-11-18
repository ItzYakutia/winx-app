# Winx interface

The palette and Montserrat typography follow the user's ReRead reference
(`D:\Coding\reread`). Layout and navigation are specific to Winx.

- Paper `#faf7f0`, white surfaces, cream `#efe6d3`.
- Ink `#16140f`, muted text `#766f64`, lines `#e7e2d8`.
- One accent `#ea2514`, green only for success.
- Montserrat is hosted locally under `frontend/src/assets/fonts` with its OFL license.
- Sentence case, 24–28 px page titles, 13–14 px controls and body text.
- Thin borders, quiet surfaces, clear keyboard focus. Shared SVG line icons.
- No decorative eyebrows, repeated instructions, gradients or coloured shadows.

## Navigation and disclosure

Social has three main destinations: people, communication and profile.
Team has four: search, chats, team and profile. On phones navigation sits at the bottom.
The native mode selector remembers each mode's last route.

Team discovery shows one card at a time with a name, role and up to four skills.
Full skills open in a native dialog. Swiping right opens a shared course chat;
swiping left passes. Mouse dragging,
touch gestures, arrow keys and buttons share the same actions. Small drags snap
back, vertical scrolling remains available and failed saves retain the card.
Social discovery uses the same gesture handling with photograph-led cards.

Team chats show people and last messages in a course-specific list. The conversation
header offers add-to-team and decline actions. Users can discuss the project first;
team creation happens there if needed. A declined room retains its history and
stops accepting messages. See [team chats](team-chats.md) for the backend contract.

Profiles show a short list of editable sections. Each section opens on its own;
cancel restores the previous values, save persists that section. Creating and
joining teams also open only after choosing the relevant action. The team screen
prioritises its roster; invitation codes are available on demand.

Communication contains chats and matches as local tabs, with notifications one
tap away. Notification bodies expand on request.

## Implementation

Global tokens, controls and overview layouts: `frontend/src/styles.css`.
Authentication: `shared/auth.css`. Academic screens: `pages/team/team.css`.
`shared/sheet` uses the native dialog focus trap and Escape handling, with a
scrollable body and visible footer. It becomes a bottom sheet on phones.
