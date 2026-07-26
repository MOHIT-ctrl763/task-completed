const express = require('express');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

app.use(express.json());
app.use('/tasks', taskRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
