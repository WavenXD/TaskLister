const express = require('express');
const app = express();
const mysql = require('mysql2/promise');
const axios = require('axios');
const cors = require('cors');
const port = 3000;
const path = require('path');

app.use(express.json());
app.use(cors());
// Environment variables
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password123',
  database: process.env.MYSQL_DB || 'tlapp',
  port: process.env.MYSQL_PORT || 3306
};
const userServiceURI = process.env.USERVICE_URI || 'http://uservice-service:4000';

// Create MySQL connection pool with retry logic
let db;

const connectWithRetry = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      db = await mysql.createPool(mysqlConfig);
      console.log('MySQL connected');
      return db; // Return the connection pool if successful
    } catch (error) {
      console.error(`MySQL connection attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
      } else {
        console.error('Failed to connect to MySQL after several retries.');
        process.exit(1); // Exit if retries are exhausted
      }
    }
  }
};

// Connect to MySQL with retries
(async () => {
  await connectWithRetry();
})();


// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './views/index.html'));  // Serve index.html
});

app.get('/tasks', async (req, res) => {
  try {
    const [tasks] = await db.query('SELECT * FROM tasks');
    res.json(tasks);
  } catch (e) {
    console.error('Error fetching tasks:', e);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Route to add a task
app.post('/tasks', async (req, res) => {
  try {
    const { title, description, completed, user_id } = req.body;

    // Check if user_id is provided
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Validate if the user exists by making a request to uservice
    try {
      const userResponse = await axios.get(`${userServiceURI}/users/${user_id}`);
      if (userResponse.status !== 200) {
        return res.status(404).json({ error: `User with ID ${user_id} not found` });
      }
    } catch (error) {
      console.error('Error fetching user data from uservice:', error);
      return res.status(500).json({ error: 'Error checking user existence' });
    }

    // Insert task into MySQL after user validation
    const [result] = await db.query(
      'INSERT INTO tasks (title, description, completed, user_id) VALUES (?, ?, ?, ?)',
      [title, description || '', completed || false, user_id]
    );

    res.status(201).json({
      id: result.insertId,
      title,
      description,
      completed,
      user_id,
    });
  } catch (e) {
    console.error('Error creating task:', e);
    res.status(400).json({ error: 'Failed to create task due to:', e });
  }
});



app.put('/tasks/:id', async (req, res) => {
  try {
    const { title, description, completed, user_id } = req.body;

    // Update the task with new user_id (if applicable)
    await db.query(
      'UPDATE tasks SET title = ?, description = ?, completed = ?, user_id = ? WHERE id = ?',
      [title, description, completed, user_id, req.params.id]
    );

    res.json({
      id: req.params.id,
      title,
      description,
      completed,
      user_id,
    });
  } catch (e) {
    console.error('Error updating task:', e);
    res.status(400).json({ error: 'Failed to update task' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    console.error('Error deleting task:', e);
    res.status(400).json({ error: 'Failed to delete task' });
  }
});

// Route to fetch a task with associated user information
app.get('/tasks/:id/user', async (req, res) => {
  try {
    const taskId = req.params.id;

    // Get task details from MySQL
    const [taskRows] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const task = taskRows[0];  // Assuming a single task is returned

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Fetch user details from uservice
    const response = await axios.get(`${userServiceURI}/users/${task.user_id}`);

    // Combine task and user information
    const taskWithUser = {
      ...task,
      user: response.data,
    };

    res.json(taskWithUser);
  } catch (e) {
    console.error('Error fetching task with user:', e);
    res.status(500).json({ error: 'Failed to fetch task with user' });
  }
});
// Start the server
app.listen(port, () => console.log(`TLApp listening on port ${port}`));
