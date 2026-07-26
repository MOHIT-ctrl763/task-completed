# Bug Report — Task Manager API

This document details the bugs identified during unit and integration testing of the Task Manager API (`task-api`).

---

## Bug 1: Pagination Parameter String Concatenation in `getAllTasks`

### Overview
When `page` and `limit` query parameters are passed to `GET /tasks` (e.g. `GET /tasks?page=2&limit=2`), Express parses them as string values (`"2"` and `"2"`).

### Expected Behavior
`GET /tasks?page=2&limit=2` should return at most 2 items representing the second page (slice range `[2, 4]`).

### Actual Behavior
The endpoint returns 3 items (slice range `[2, 5]`).

### Root Cause & Discovery
Discovered via unit test `should correctly handle pagination parameters when passed as numbers or strings`.
In `src/taskService.js`:
```javascript
const page = filters.page || 1;
const limit = filters.limit || 10;
const start = (page - 1) * limit;
const end = start + limit; // '2' + '2' = '22'
```
Because `limit` is string `"2"` and `start` is number `2`, `start + limit` performs string concatenation yielding `"22"`. `tasks.slice(2, "22")` evaluates `"22"` as integer `22`, returning all remaining items in the array instead of strictly limiting to 2 items.

### Recommended Fix
Cast `page` and `limit` parameters to numbers using `parseInt(val, 10)` before performing mathematical calculations:
```javascript
const page = parseInt(filters.page, 10) || 1;
const limit = parseInt(filters.limit, 10) || 10;
const start = (page - 1) * limit;
const end = start + limit;
```

---

## Bug 2: Completed (`done`) Tasks Included in Overdue Count in `getStats`

### Overview
The `GET /tasks/stats` endpoint reports an `overdue` count that incorrectly includes tasks with `status === 'done'`.

### Expected Behavior
A task marked as `done` should **not** be counted as overdue, even if its `dueDate` is in the past, because the task was successfully finished.

### Actual Behavior
The `overdue` counter includes all tasks where `dueDate < now`, regardless of status. For example, 2 overdue active tasks + 1 finished task with past due date yields `overdue: 3` instead of `overdue: 2`.

### Root Cause & Discovery
Discovered via unit test `should exclude done tasks from overdue count even if past dueDate`.
In `src/taskService.js`:
```javascript
const overdue = tasks.filter(t => {
  if (!t.dueDate) return false;
  return new Date(t.dueDate) < now;
}).length;
```

### Recommended Fix
Exclude completed tasks (`t.status === 'done'`) from the overdue filter:
```javascript
const overdue = tasks.filter(t => {
  if (!t.dueDate || t.status === 'done') return false;
  return new Date(t.dueDate) < now;
}).length;
```

---

## Bug 3: `PUT /tasks/:id` Status Update to `done` Fails to Set `completedAt` Timestamp

### Overview
Updating a task's status to `'done'` via `PUT /tasks/:id` leaves `completedAt` set to `null`.

### Expected Behavior
When a task's status changes to `'done'` via any update mechanism (PUT or PATCH), `completedAt` should be set to an ISO 8601 timestamp string representing when it was completed.

### Actual Behavior
`updateTask` spreads the updates directly over the existing object without checking if `status` changed to `'done'`, leaving `completedAt` as `null`.

### Root Cause & Discovery
Discovered via unit test `should set completedAt when status is updated to done via updateTask`.
In `src/taskService.js`:
```javascript
const updatedTask = {
  ...existingTask,
  ...updates,
  id: existingTask.id,
  createdAt: existingTask.createdAt
};
```

### Recommended Fix
Check if `updates.status === 'done'` and set `completedAt` if not already populated:
```javascript
let completedAt = existingTask.completedAt;
if (updates.status === 'done' && !completedAt) {
  completedAt = new Date().toISOString();
} else if (updates.status && updates.status !== 'done') {
  completedAt = null;
}
```

---

## Bug 4: `PATCH /tasks/:id/complete` Overwrites Existing `completedAt` Timestamp

### Overview
Re-invoking `completeTask` on an already completed task overwrites the existing `completedAt` timestamp with a new timestamp.

### Expected Behavior
If a task is already completed (`status === 'done'`), calling complete should preserve the original completion timestamp.

### Actual Behavior
`task.completedAt = new Date().toISOString()` is unconditionally executed on every invocation.

### Recommended Fix
Only set `completedAt` if `task.completedAt` is not already present:
```javascript
if (!task.completedAt) {
  task.completedAt = new Date().toISOString();
}
```
