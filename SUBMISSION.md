# Task Manager API — Assignment Submission

## Overview

This repository contains the completed **Task Manager API** take-home assignment, including unit and integration tests, a comprehensive bug report, bug fixes, the new `PATCH /tasks/:id/assign` feature, and submission answers.

---

## Test & Coverage Results

- **Frameworks Used**: Jest & Supertest
- **Total Tests**: 43 passed (23 unit tests + 20 integration tests)
- **Overall Coverage**: **95.27% Statements**, **94.2% Branches**, **100% Functions**, **94.85% Lines**

### Coverage Summary Table

| File | % Stmts | % Branch | % Funcs | % Lines |
|------|---------|----------|---------|---------|
| **All Files** | **95.27%** | **94.20%** | **100%** | **94.85%** |
| `src/app.js` | 100% | 100% | 100% | 100% |
| `src/taskService.js` | 100% | 93.87% | 100% | 100% |
| `src/taskController.js` | 87.5% | 95% | 100% | 87.5% |
| `src/routes/taskRoutes.js` | 100% | 100% | 100% | 100% |

To run the test suite and view coverage locally:
```bash
cd task-api
npm test
npm run coverage
```

---

## Summary of Deliverables

1. **Unit & Integration Tests** (`tests/unit/taskService.test.js` & `tests/integration/tasks.test.js`):
   - Covered all core endpoints: `GET /tasks`, `GET /tasks/stats`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`, `PATCH /tasks/:id/complete`, and `PATCH /tasks/:id/assign`.
   - Comprehensive happy paths and edge cases (pagination parameter coercion, null/invalid values, missing payload fields, 404 resource handling).

2. **Bug Report** (`BUG_REPORT.md`):
   - **Bug 1**: String concatenation in pagination query parameters (`GET /tasks?page=2&limit=2`).
   - **Bug 2**: Overdue task calculation in `getStats()` including completed (`done`) tasks.
   - **Bug 3**: Updating status to `done` via `PUT /tasks/:id` failing to populate `completedAt`.
   - **Bug 4**: `PATCH /tasks/:id/complete` overwriting existing `completedAt` timestamp on re-completion.

3. **Bug Fixes**:
   - Fixed all identified bugs in `src/taskService.js`.
   - Ensured type safety when parsing pagination numbers, excluded `done` tasks from overdue stats, synced `completedAt` timestamps on status updates, and preserved original completion dates.

4. **New Feature — `PATCH /tasks/:id/assign`**:
   - Accepts `{ "assignee": "string" }` payload.
   - Trims whitespace and stores the assignee on the task object.
   - Returns `200 OK` with updated task object.
   - Returns `404 Not Found` if task ID does not exist.
   - Returns `400 Bad Request` if `assignee` is missing, not a string, or an empty/whitespace string.

---

## Submission Questions

### 1. What would you test next if you had more time?

- **Concurrent Request / Race Condition Testing**: If multiple clients update or assign the same task simultaneously, test how memory mutation behaves under concurrent load.
- **Stress & Large Dataset Performance Testing**: Test pagination and filtering performance when the in-memory array holds 50,000+ tasks.
- **Input Sanitization & Security Scanning**: Test against malicious inputs (e.g. Prototype Pollution payloads, XSS injections in `title`/`description`/`assignee`).
- **Date Formatting / Timezone Edge Cases**: Test ISO 8601 validation for `dueDate` (e.g., malformed date strings like `"invalid-date"` or leap year dates).

### 2. Anything that surprised you in the codebase?

- **JavaScript Type Coercion in Query Parameters**: Express query parameters are always parsed as strings. The un-coerced `start + limit` expression resulted in `2 + "2" = "22"`, which silently passed execution without throwing an error but caused incorrect array slicing. This highlighted how subtle type bugs can slip through without explicit testing.
- **Lack of Schema Validation**: The initial controller accepted arbitrary fields without validating date formats or restricting `status` and `priority` to valid enum values (`todo`, `in_progress`, `done`, `low`, `medium`, `high`).

### 3. Any questions you'd ask before shipping this to production?

1. **Persistence Strategy**: "What database (e.g., PostgreSQL, MongoDB, Redis) will replace the current in-memory array for production persistence?"
2. **Authentication & Authorization**: "Should users be authenticated (JWT/OAuth), and should tasks have ownership boundaries (e.g., can any user re-assign or delete another user's task)?"
3. **Audit Logging & History**: "Do we need to maintain an activity log or history when a task changes status or assignee?"
4. **Rate Limiting & CORS**: "What rate limits and CORS policies should be configured for production client domains?"
