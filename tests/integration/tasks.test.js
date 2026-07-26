const request = require('supertest');
const app = require('../../src/app');
const taskService = require('../../src/taskService');

describe('Task API Integration Tests', () => {
  beforeEach(() => {
    taskService.resetTasks();
  });

  describe('GET /tasks', () => {
    it('should return an empty list when no tasks exist', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return all tasks', async () => {
      taskService.createTask({ title: 'Task A' });
      taskService.createTask({ title: 'Task B' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Task A');
    });

    it('should filter tasks by status parameter', async () => {
      taskService.createTask({ title: 'Todo task', status: 'todo' });
      taskService.createTask({ title: 'Done task', status: 'done' });

      const res = await request(app).get('/tasks?status=done');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Done task');
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task successfully with valid payload', async () => {
      const payload = {
        title: 'New Integration Task',
        description: 'Test description',
        priority: 'high',
        dueDate: '2026-12-01T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/tasks')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(payload.title);
      expect(res.body.description).toBe(payload.description);
      expect(res.body.status).toBe('todo');
      expect(res.body.priority).toBe('high');
      expect(res.body.dueDate).toBe(payload.dueDate);
      expect(res.body.completedAt).toBeNull();
    });

    it('should return 400 Bad Request when title is missing', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ description: 'No title provided' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 Bad Request when title is an empty string', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title is required');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update an existing task', async () => {
      const created = taskService.createTask({ title: 'Initial Title' });

      const res = await request(app)
        .put(`/tasks/${created.id}`)
        .send({ title: 'Updated Title', status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('in_progress');
    });

    it('should return 404 Not Found when updating a non-existent task', async () => {
      const res = await request(app)
        .put('/tasks/invalid-id')
        .send({ title: 'Does not exist' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete an existing task and return 204 No Content', async () => {
      const created = taskService.createTask({ title: 'Task to delete' });

      const res = await request(app).delete(`/tasks/${created.id}`);
      expect(res.status).toBe(204);

      const checkRes = await request(app).get('/tasks');
      expect(checkRes.body).toHaveLength(0);
    });

    it('should return 404 Not Found when deleting a non-existent task', async () => {
      const res = await request(app).delete('/tasks/invalid-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should mark task as completed and return 200', async () => {
      const created = taskService.createTask({ title: 'Task to complete' });

      const res = await request(app).patch(`/tasks/${created.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).toBeDefined();
    });

    it('should return 404 Not Found when completing non-existent task', async () => {
      const res = await request(app).patch('/tasks/invalid-id/complete');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('should successfully assign a task to an assignee', async () => {
      const created = taskService.createTask({ title: 'Unassigned Task' });

      const res = await request(app)
        .patch(`/tasks/${created.id}/assign`)
        .send({ assignee: 'Jane Doe' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.id);
      expect(res.body.assignee).toBe('Jane Doe');
    });

    it('should trim leading/trailing whitespace from assignee name', async () => {
      const created = taskService.createTask({ title: 'Task to assign' });

      const res = await request(app)
        .patch(`/tasks/${created.id}/assign`)
        .send({ assignee: '   John Smith   ' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('John Smith');
    });

    it('should return 404 Not Found when assigning a non-existent task', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'Alice' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('should return 400 Bad Request when assignee is missing', async () => {
      const created = taskService.createTask({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${created.id}/assign`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Assignee must be a non-empty string');
    });

    it('should return 400 Bad Request when assignee is an empty string or whitespace only', async () => {
      const created = taskService.createTask({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${created.id}/assign`)
        .send({ assignee: '    ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Assignee must be a non-empty string');
    });

    it('should return 400 Bad Request when assignee is not a string', async () => {
      const created = taskService.createTask({ title: 'Task' });

      const res = await request(app)
        .patch(`/tasks/${created.id}/assign`)
        .send({ assignee: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Assignee must be a non-empty string');
    });
  });

  describe('GET /tasks/stats', () => {
    it('should return 200 with correct task stats overview', async () => {
      taskService.createTask({ title: 'T1', status: 'todo' });
      taskService.createTask({ title: 'T2', status: 'done' });

      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        total: 2,
        todo: 1,
        in_progress: 0,
        done: 1,
        overdue: 0
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/invalid-route-path');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Route not found');
    });
  });
});
