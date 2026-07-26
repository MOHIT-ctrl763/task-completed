const { v4: uuidv4 } = require('uuid');

let tasks = [];

const resetTasks = () => {
  tasks = [];
};

const getAllTasks = (filters = {}) => {
  let result = [...tasks];

  if (filters.status) {
    result = result.filter(task => task.status === filters.status);
  }

  // FIX BUG 1: Parse string parameters to numbers to prevent string concatenation
  if (filters.page !== undefined || filters.limit !== undefined) {
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.max(1, parseInt(filters.limit, 10) || 10);
    const start = (page - 1) * limit;
    const end = start + limit;
    result = result.slice(start, end);
  }

  return result;
};

const getTaskById = (id) => {
  return tasks.find(task => task.id === id) || null;
};

const createTask = (taskData) => {
  const newTask = {
    id: uuidv4(),
    title: taskData.title || '',
    description: taskData.description || '',
    status: taskData.status || 'todo',
    priority: taskData.priority || 'medium',
    dueDate: taskData.dueDate || null,
    completedAt: taskData.status === 'done' ? new Date().toISOString() : null,
    assignee: taskData.assignee || null,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  return newTask;
};

const updateTask = (id, updates) => {
  const index = tasks.findIndex(task => task.id === id);
  if (index === -1) return null;

  const existingTask = tasks[index];
  
  // FIX BUG 3: Sync completedAt when status changes to 'done' or away from 'done'
  let completedAt = existingTask.completedAt;
  if (updates.status === 'done' && !completedAt) {
    completedAt = new Date().toISOString();
  } else if (updates.status && updates.status !== 'done') {
    completedAt = null;
  }

  const updatedTask = {
    ...existingTask,
    ...updates,
    completedAt,
    id: existingTask.id,
    createdAt: existingTask.createdAt
  };

  tasks[index] = updatedTask;
  return updatedTask;
};

const deleteTask = (id) => {
  const index = tasks.findIndex(task => task.id === id);
  if (index === -1) return false;

  tasks.splice(index, 1);
  return true;
};

const completeTask = (id) => {
  const task = getTaskById(id);
  if (!task) return null;

  task.status = 'done';
  // FIX BUG 4: Preserve existing completedAt timestamp if already completed
  if (!task.completedAt) {
    task.completedAt = new Date().toISOString();
  }

  return task;
};

const assignTask = (id, assignee) => {
  const task = getTaskById(id);
  if (!task) return null;

  task.assignee = assignee;
  return task;
};

const getStats = () => {
  const total = tasks.length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const in_progress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;

  const now = new Date();
  // FIX BUG 2: Exclude completed ('done') tasks from overdue calculation
  const overdue = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    return new Date(t.dueDate) < now;
  }).length;

  return {
    total,
    todo,
    in_progress,
    done,
    overdue
  };
};

module.exports = {
  tasks,
  resetTasks,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  assignTask,
  getStats
};
