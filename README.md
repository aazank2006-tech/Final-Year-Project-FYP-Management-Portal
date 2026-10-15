# Final Year Project (FYP) Management Portal

A self-contained academic workspace for managing the full final-year project lifecycle —
idea submission, supervisor selection, milestone tracking, deliverable submission,
evaluation, and feedback.

Built with **plain HTML, CSS, and JavaScript only** — no frameworks, no libraries, no CDN,
no build tooling, and no backend. It runs offline directly in the browser using seeded
dummy data.

---

## Table of contents

- [Features](#features)
- [Roles](#roles)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Business rules](#business-rules)
- [Testing](#testing)
- [Constraints and scope](#constraints-and-scope)

---

## Features

- **Dashboard** — summary metrics (projects, students, supervisors, pending submissions,
  upcoming deadlines), per-project progress bars, and a classified deadline list. The
  dashboard re-scopes its emphasis to the acting role.
- **Projects** — browse every project with title, domain, team, supervisor, status, and
  progress; filter by status/domain/supervisor; case-insensitive search by title or team;
  open a detail view aggregating team, milestones, submissions, feedback, and evaluations.
- **Students** — directory with name, ID, program, project, and team role; search and
  filters; duplicate student-ID flagging.
- **Supervisors** — directory with department, specialization, supervised-project count,
  and remaining capacity; "At capacity" marking; detail view with supervised projects and
  pending review items.
- **Submissions** — list deliverables with type, project/milestone, submitter, date, and
  status; create submissions; review lifecycle with timeliness indicators.
- **Evaluations & Feedback** — record scored evaluations with qualitative judgment; view
  evaluations and newest-first feedback.

## Roles

The header includes a role switcher (acting user is chosen from dummy data — there is no
authentication):

| Role | Capabilities |
|------|--------------|
| **Student** | Submit project ideas, select a supervisor, manage team/milestones, create submissions, view feedback and results |
| **Supervisor** | Review ideas (accept/decline), provide feedback, review submissions, record evaluations |
| **Coordinator (Admin)** | Portal-wide oversight, monitor all sections and progress |

Capability gating is centralized in `FYP.Selectors.can(role, capability)`; for example,
evaluation-entry controls are never rendered for a Student.

## Getting started

No installation or build step is required.

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox, or Safari).
2. Use the **Viewing as** switcher in the header to change role and acting user.
3. Navigate sections via the top navigation bar.

> Because the app uses classic `<script>` tags under a single `window.FYP` namespace
> (instead of ES modules), it also works when opened directly from the filesystem
> (`file://`). A local static server is optional.

Optional local server:

```bash
python -m http.server 8765
# then visit http://127.0.0.1:8765/index.html
```

## Project structure

```
index.html                 SPA shell (header, nav, view mount, modals, toasts)
tests.html                 In-browser unit + integration test harness
css/
  styles.css               Design tokens, layout, components, responsive rules
js/
  constants.js             Frozen status/type/judgment literals + limits
  utils.js                 Dates, ids, safe text rendering, debounce, clone
  data.js                  Seeded dummy dataset
  store.js                 In-session store with atomic transactions
  selectors.js             Pure derivation layer (progress, capacity, filters)
  validation.js            Form validation (idea, submission, evaluation, ...)
  domain/                  Domain services (idea, supervisorRequest, milestone,
                           submission, evaluation, feedback)
  ui.js                    Reusable UI components (table, card, badge, modal, ...)
  router.js                Hash-based router
  views/                   Section views + shared detail modals (common.js)
  app.js                   Bootstrap: store init, role switcher, routes
```

## Architecture

Layered, strictly one-directional dependency flow:

```
Data (data.js) -> Store (store.js) -> Selectors (selectors.js) -> Views (views/*)
```

- **Data** — a single isolated seed module; no presentation or behavior logic.
- **Store** — deep-copies the seed into a mutable working set, exposes CRUD, and emits one
  change event per committed `transaction` (atomic commit/rollback).
- **Selectors** — pure functions that compute derived values (progress, capacity, deadline
  state, timeliness, aggregates, filtered lists) without mutating records.
- **Views** — render from selectors; all free text is written via `textContent`
  (`FYP.Utils.renderText`) to prevent markup injection.

All status literals come from `FYP.Constants`; nothing duplicates an enum value.

## Data model

Domain objects (fields enforced per the data constraints): **Project**, **Project Idea**,
**Student**, **Supervisor**, **Team**, **Milestone**, **Submission**, **Evaluation**,
**Feedback**, and **Deadline**.

Derived values are computed, never stored: project `progress`, supervisor `assignedCount` /
`atCapacity`, submission `timeliness`, and deadline `state`.

The seed deliberately includes edge cases so every placeholder path is exercised: a project
with no team, one with no supervisor, one with no milestones ("Not started"), a supervisor
who is at capacity and missing a specialization, an unassigned student, a duplicate student
ID, overdue milestones, a late submission, and a submission with no deadline.

## Business rules

- **Progress** = `round(completed milestones / total milestones × 100)%`, or "Not started"
  when a project has no milestones.
- **Deadline classification** — Overdue (`due < today`), Due Soon (within 7 days inclusive),
  Upcoming (more than 7 days ahead); records without a due date show "No deadline set".
- **Milestone transitions** — Pending → In Progress → Completed; Pending → Completed is
  rejected ("Advance the milestone to In Progress first."); completion is gated when a
  required submission is missing.
- **Supervisor capacity** — requests are blocked when a supervisor is at capacity; a project
  keeps at most one assigned supervisor.
- **Submission lifecycle** — Submitted → Under Review → Approved | Needs Revision (a reason
  is mandatory for revision and is attached as feedback).
- **Evaluations** — score must be numeric in 0–100 with a judgment from a fixed set; students
  cannot record evaluations.

## Testing

Open `tests.html` in a browser. It runs a lightweight in-page harness covering:

- Selector logic: progress (including zero/unresolvable milestones), deadline classification
  at the 7-day boundary, supervisor capacity, submission timeliness, duplicate IDs.
- Validation rules for ideas, submissions, and evaluations.
- Milestone transitions and the submission gate.
- An end-to-end flow: idea → supervisor request → accept → submission → evaluation.

The harness prints a pass/fail count and per-check results on the page.

## Constraints and scope

- **Out of scope:** authentication/identity, backend persistence, file storage and transfer
  (submissions are metadata only), notification delivery, and hosting/build tooling.
- All data lives in the browser session and resets on reload.
- No network calls; fully offline-capable.
- Layout usable from 1024px to 1920px without horizontal scrolling of core content.
- Front-end only: HTML5, CSS3, and standard ECMAScript (no frameworks, libraries, or CDNs).

---

Prototype for demonstration purposes — all data is dummy and contains no real personal or
institutional information.