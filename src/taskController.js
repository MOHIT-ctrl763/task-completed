const taskService = require('./taskService');

const getAllTasks = (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const tasks = taskService.getAllTasks({ status, page, limit });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStats = (req, res) => {
  try {
    const stats = taskService.getStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTask = (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignee } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const newTask = taskService.createTask({
      title: title.trim(),
      description,
      status,
      priority,
      dueDate,
      assignee
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTask = (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = taskService.updateTask(id, req.body);

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = (req, res) => {
  try {
    const { id } = req.params;
    const deleted = taskService.deleteTask(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const completeTask = (req, res) => {
  try {
    const { id } = req.params;
    const task = taskService.completeTask(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignTask = (req, res) => {
  try {
    const { id } = req.params;
    const { assignee } = req.body || {};

    if (!assignee || typeof assignee !== 'string' || assignee.trim() === '') {
      return res.status(400).json({ error: 'Assignee must be a non-empty string' });
    }

    const updatedTask = taskService.assignTask(id, assignee.trim());

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTasks,
  getStats,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  assignTask
};
