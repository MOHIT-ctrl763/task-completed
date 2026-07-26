const taskService = require('../../src/taskService');

describe('taskService Unit Tests', () => {
  beforeEach(() => {
    taskService.resetTasks();
  });

  describe('createTask', () => {
    it('should create a new task with default values', () => {
      const task = taskService.createTask({ title: 'Buy groceries' });
      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Buy groceries');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.createdAt).toBeDefined();
    });

    it('should create a task with custom status, priority, and description', () => {
      const taskData = {
        title: 'Submit report',
        description: 'Quarterly financial report',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-12-31T23:59:59.000Z'
      };
      const task = taskService.createTask(taskData);
      expect(task.title).toBe('Submit report');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe('2026-12-31T23:59:59.000Z');
      expect(task.completedAt).toBeNull();
    });

    it('should set completedAt timestamp if created with status done', () => {
      const task = taskService.createTask({ title: 'Finished task', status: 'done' });
      expect(task.status).toBe('done');
      expect(task.completedAt).toBeDefined();
      expect(typeof task.completedAt).toBe('string');
    });
  });

  describe('getTaskById', () => {
    it('should return the matching task by ID', () => {
      const created = taskService.createTask({ title: 'Find me' });
      const found = taskService.getTaskById(created.id);
      expect(found).toEqual(created);
    });

    it('should return null if task ID does not exist', () => {
      const found = taskService.getTaskById('non-existent-uuid');
      expect(found).toBeNull();
    });
  });

  describe('getAllTasks', () => {
    it('should return an empty array when no tasks exist', () => {
      const tasks = taskService.getAllTasks();
      expect(tasks).toEqual([]);
    });

    it('should return all tasks when no filters are applied', () => {
      taskService.createTask({ title: 'Task 1' });
      taskService.createTask({ title: 'Task 2' });
      const tasks = taskService.getAllTasks();
      expect(tasks).toHaveLength(2);
    });

    it('should filter tasks by status', () => {
      taskService.createTask({ title: 'Task 1', status: 'todo' });
      taskService.createTask({ title: 'Task 2', status: 'in_progress' });
      taskService.createTask({ title: 'Task 3', status: 'done' });

      const todoTasks = taskService.getAllTasks({ status: 'todo' });
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].title).toBe('Task 1');

      const doneTasks = taskService.getAllTasks({ status: 'done' });
      expect(doneTasks).toHaveLength(1);
      expect(doneTasks[0].title).toBe('Task 3');
    });

    it('should correctly handle pagination parameters when passed as numbers or strings', () => {
      for (let i = 1; i <= 5; i++) {
        taskService.createTask({ title: `Task ${i}` });
      }

      // Page 1, limit 2 -> Task 1, Task 2
      const page1 = taskService.getAllTasks({ page: '1', limit: '2' });
      expect(page1).toHaveLength(2);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[1].title).toBe('Task 2');

      // Page 2, limit 2 -> Task 3, Task 4
      const page2 = taskService.getAllTasks({ page: '2', limit: '2' });
      expect(page2).toHaveLength(2);
      expect(page2[0].title).toBe('Task 3');
      expect(page2[1].title).toBe('Task 4');
    });

    it('should return empty array for out of range page index', () => {
      taskService.createTask({ title: 'Single Task' });
      const result = taskService.getAllTasks({ page: 10, limit: 5 });
      expect(result).toEqual([]);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task properties', () => {
      const created = taskService.createTask({ title: 'Original Title', priority: 'low' });
      const updated = taskService.updateTask(created.id, { title: 'Updated Title', priority: 'high' });
      
      expect(updated.title).toBe('Updated Title');
      expect(updated.priority).toBe('high');
      expect(updated.id).toBe(created.id);
      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('should return null when updating a non-existent task', () => {
      const updated = taskService.updateTask('non-existent-id', { title: 'New' });
      expect(updated).toBeNull();
    });

    it('should set completedAt when status is updated to done via updateTask', () => {
      const created = taskService.createTask({ title: 'Update to done', status: 'todo' });
      expect(created.completedAt).toBeNull();

      const updated = taskService.updateTask(created.id, { status: 'done' });
      expect(updated.status).toBe('done');
      expect(updated.completedAt).toBeDefined();
      expect(typeof updated.completedAt).toBe('string');
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task and return true', () => {
      const created = taskService.createTask({ title: 'Delete me' });
      const result = taskService.deleteTask(created.id);
      expect(result).toBe(true);
      expect(taskService.getTaskById(created.id)).toBeNull();
    });

    it('should return false when deleting a non-existent task', () => {
      const result = taskService.deleteTask('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('completeTask', () => {
    it('should set status to done and add completedAt timestamp', () => {
      const created = taskService.createTask({ title: 'Pending task', status: 'todo' });
      const completed = taskService.completeTask(created.id);
      
      expect(completed.status).toBe('done');
      expect(completed.completedAt).toBeDefined();
      expect(typeof completed.completedAt).toBe('string');
    });

    it('should preserve original completedAt timestamp if task is already completed', () => {
      const created = taskService.createTask({ title: 'Already done', status: 'todo' });
      const completedFirst = taskService.completeTask(created.id);
      const originalTimestamp = completedFirst.completedAt;

      const completedSecond = taskService.completeTask(created.id);
      expect(completedSecond.completedAt).toBe(originalTimestamp);
    });

    it('should return null when completing a non-existent task', () => {
      const result = taskService.completeTask('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('assignTask', () => {
    it('should assign a person to a task and return updated task', () => {
      const created = taskService.createTask({ title: 'Unassigned Task' });
      expect(created.assignee).toBeNull();

      const assigned = taskService.assignTask(created.id, 'Alice');
      expect(assigned.assignee).toBe('Alice');
      expect(taskService.getTaskById(created.id).assignee).toBe('Alice');
    });

    it('should update assignee when task is re-assigned', () => {
      const created = taskService.createTask({ title: 'Task', assignee: 'Alice' });
      const reassigned = taskService.assignTask(created.id, 'Bob');
      expect(reassigned.assignee).toBe('Bob');
    });

    it('should return null when assigning a non-existent task', () => {
      const result = taskService.assignTask('non-existent-id', 'Alice');
      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should calculate correct totals for task statuses', () => {
      taskService.createTask({ title: 'T1', status: 'todo' });
      taskService.createTask({ title: 'T2', status: 'todo' });
      taskService.createTask({ title: 'T3', status: 'in_progress' });
      taskService.createTask({ title: 'T4', status: 'done' });

      const stats = taskService.getStats();
      expect(stats.total).toBe(4);
      expect(stats.todo).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
    });

    it('should exclude done tasks from overdue count even if past dueDate', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day from now

      // Overdue task (todo + past dueDate)
      taskService.createTask({ title: 'Overdue Todo', status: 'todo', dueDate: pastDate });
      // Overdue in_progress task
      taskService.createTask({ title: 'Overdue In Progress', status: 'in_progress', dueDate: pastDate });
      // Completed task with past dueDate (should NOT be overdue)
      taskService.createTask({ title: 'Completed Past Due', status: 'done', dueDate: pastDate });
      // Task with future dueDate (should NOT be overdue)
      taskService.createTask({ title: 'Future Task', status: 'todo', dueDate: futureDate });
      // Task with no dueDate (should NOT be overdue)
      taskService.createTask({ title: 'No Due Date', status: 'todo', dueDate: null });

      const stats = taskService.getStats();
      expect(stats.total).toBe(5);
      expect(stats.overdue).toBe(2);
    });
  });
});

