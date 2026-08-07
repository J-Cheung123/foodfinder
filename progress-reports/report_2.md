# FoodFinder — Progress Report 2

**Course:** CS 375 — Web Development

**Repository:** https://github.com/VincentYuann/Food-Finder

**Reporting period:** Week of August 2 – August 8, 2026

**Group members:** Jeffrey Cheung, Vincent Yuan, Alvin Cheung

---

## 1. Contract Feature Checklist

- [x] **User accounts, profile, login/password**
- [ ] **Restaurant search (via Google Places or Yelp API) + save to a personal list**
- [x] **Lobby creation and joining** (friends join a lobby for an outing)
- [ ] **Voting system** — friends pick from saved restaurants, majority wins
- [ ] **Real-time lobby chat (WebSocket)**
- [ ] **Account archive** — past visited restaurants + past lobby chats

---

## 2. Work Completed Last Week

**Vincent Yuan** — 19 of the period's 22 commits, on build and deployment tooling.

- Built out the Jenkins CI/CD pipeline to six stages, with Discord alerts and
  build logs attached on failure
- Added ESLint configs to backend and frontend, fixing the ESM import errors
  they surfaced
- Hardened Docker: pinned `node:24-alpine`, corrected port mappings, and fixed
  `.env` handling so startup is a single command
- Removed the friend controller and routes per the group's scope decision

**Alvin Cheung** — implemented restaurant search, the second contract feature.

- Chose Google Places over Yelp Fusion and validated the free tier
- Wrote `googlePlacesService.js` (144 lines) and extended `restaurantRoutes.js`
  (+127) with search, details-with-caching, and save-to-cache endpoints
- Built the search UI — `search.html` and `search.js`, 664 lines — with
  geolocation, an adjustable radius, and result cards

**Jeffrey Cheung** — implemented the lobby system (commit `8f936ec`).

- Built `lobbyController.js` (438 lines) and added `isLobbyMember` and
  `isLobbyCreator` middleware; lobby routes previously had no authorization checks
- Implemented join-by-invite-code; codes were generated but nothing consumed
  them, so joining was impossible
- Built the lobby page (`lobby.html`, `lobby.js`), wired the dashboard's create
  and join forms, and fixed a `password_hash` leak, an unscoped lobby list, and
  stored XSS via lobby names

---

## 3. Planned Work for the Coming Week

**Group priority:** the voting system — the last contract feature with no
implementation. Chat is blocked behind a migration and should follow it.

**Jeffrey Cheung**

- Implement the **majority-wins calculation** — tally votes per restaurant,
  compare against member count, set `chosen_restaurant_id` automatically
  (carried over; the lobby foundation it needs is now in place)
- Add an endpoint exposing live vote tallies and build the voting UI

**Vincent Yuan**

- **Repair the test suite** (carried over) — `userRoutes.test.js` is entirely
  commented out, so the pipeline's Test stage passes vacuously
- Run the migration restoring `messages.user_id` to `Int`, which blocks chat
- **Research WebSockets** and integrate `socket.io` so vote counts update live
  for every member; extend the same layer to chat (carried over)

**Alvin Cheung**

- Wire the personal saved list — `search.js` populates only the shared cache, so
  the dashboard's saved section stays empty
- Link `search.html` from the dashboard; it is reachable only by typing the URL
- Fill in the four CSS files, all still empty (carried over)

---

## 4. Git Contributors

Output of `git log --all | grep 'Author:' | sort | uniq`:

```
Author: Alvin Cheung <ac4633@drexel.edu>
Author: Jeffrey <jc4759@drexel.edu>
Author: Vincent Yuan <vincentyuan1020@gmail.com>
```
