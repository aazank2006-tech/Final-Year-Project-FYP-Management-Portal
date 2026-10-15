# Final Year Project (FYP) Management Portal

A front-end prototype of a university workspace for managing Final Year Projects, from the first idea submission through supervisor assignment, milestone tracking, submissions, and final evaluation.

Built as part of the **ACT-AI x Huawei Pakistan** program.

> **Prototype notice:** all data is dummy seed data and lives in memory for the current session only. Nothing is saved to a server or to the browser between page loads.

---

## Features

- **Role switcher**: act as different roles (e.g. student, supervisor) and see how the portal behaves for each.
- **Dashboard**: an at-a-glance summary of projects, progress, and upcoming deadlines.
- **Projects**: submit an idea, track its status, and view project details.
- **Students and Supervisors**: directories with supervisor capacity tracking.
- **Submissions**: upload against milestones, with automatic *On time* / *Late* labelling.
- **Evaluations**: supervisors record a score and judgment; students cannot.
- **Feedback and revisions**: revision requests require a stated reason.
- **Accessible by design**: skip-to-content link, ARIA labels, and live regions for toasts and view changes.

## Project Lifecycle

```
Idea Submitted -> Supervisor Pending -> In Progress -> Milestones -> Submissions -> Evaluation
```

1. A student submits a project idea.
2. The student requests a supervisor, and the project moves to **Supervisor Pending**.
3. The supervisor accepts or declines. On acceptance the supervisor is assigned and the project becomes **In Progress**.
4. Milestones move through their statuses, and some can only be completed once a submission exists.
5. Supervisors record evaluations and give feedback.

## Business Rules

| Area | Rule |
| --- | --- |
| Idea title | Required, maximum 120 characters, unique per student |
| Idea description | Minimum length enforced |
| Student ID | Must be unique (duplicates are detected) |
| Supervisor capacity | Requests to a supervisor who is at capacity are blocked |
| Milestones | Invalid transitions are rejected (e.g. *Pending* -> *Completed*); submission-gated milestones cannot be completed manually |
| Deadlines | **Due Soon** (today up to 7 days), **Upcoming** (8+ days), **Overdue** (past due) |
| Progress | Calculated from completed milestones; shows *Not started* when a project has none |
| Evaluation | Score must be numeric and within 0 to 100, a target project and a judgment are required, and only supervisors can record one |
| Revision | A reason is required |

## Tech Stack

- HTML5, CSS3, and vanilla JavaScript (no framework, no build step, no dependencies)
- Hash-based client-side routing (`#/dashboard`, `#/projects`, ...)
- A single `FYP` global namespace, with scripts loaded in dependency order from `index.html`

## Getting Started

No installation is needed.

**Option 1: open directly**

```bash
git clone https://github.com/aazank2006-tech/ACT-AI-x-Huawei-Pakistan.git
cd ACT-AI-x-Huawei-Pakistan
# then open index.html in your browser
```

**Option 2: serve locally**

```bash
python -m http.server 8000
# visit http://localhost:8000
```

### Running the tests

Open `tests.html` in your browser. The harness runs unit and integration checks and shows a pass/fail summary at the top of the page, with the totals also exposed as `window.__TESTS__`.

It covers:

- progress calculation and deadline classification at boundary dates
- supervisor capacity and submission timeliness
- validation of ideas, evaluations, and revision reasons
- milestone transitions and submission gating
- a full flow: idea -> supervisor request -> acceptance -> milestone -> submission -> evaluation
- role-based permission checks on evaluations

## Project Structure

```
.
├── index.html        # App shell: header, role switcher, navigation, script loading
├── tests.html        # In-browser test harness
├── css/
│   └── styles.css    # Application styles
└── js/
    ├── constants.js  # Enums: roles, statuses, deadline states
    ├── utils.js      # Helpers (dates, formatting)
    ├── data.js       # Dummy seed data
    ├── store.js      # In-memory data store
    ├── selectors.js  # Derived data: progress, deadlines, capacity, timeliness
    ├── validation.js # Input validation rules
    ├── domain/       # Business logic services
    │   ├── idea.js
    │   ├── supervisorRequest.js
    │   ├── milestone.js
    │   ├── submission.js
    │   ├── evaluation.js
    │   └── feedback.js
    ├── ui.js         # Shared UI helpers (modals, toasts)
    ├── router.js     # Hash router
    ├── views/        # One file per section (dashboard, projects, students,
    │                 #   supervisors, submissions, evaluations) plus shared helpers
    └── app.js        # Bootstrap
```

The code is layered: **foundation** (constants, utils, data, store, selectors, validation), then **domain services** (business rules), then **presentation** (UI, router, views), with `app.js` bootstrapping everything.

## Limitations and Roadmap

- No backend, authentication, or persistent storage
- Role switching is simulated, not real login
- Possible next steps: a REST API with a database, real authentication, file uploads, and notifications

## Author

**Aazan Khan** ([@aazank2006-tech](https://github.com/aazank2006-tech))
