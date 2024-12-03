const express = require("express");
const mysql = require("mysql2/promise");
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;
const cors = require('cors');

app.use(express.json());
app.use(cors());


// Environment variables for MySQL
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password123',
  database: process.env.MYSQL_DB || 'tlapp',
};

// MySQL Connection
let db;
(async () => {
  try {
    db = await mysql.createPool(dbConfig);  // Connection pool for MySQL
    console.log("MySQL connected");
  } catch (e) {
    console.error("Failed to connect to MySQL error:", e);
    process.exit(1);
  }
})();


// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './views/index.html'));  // Serve index.html
});
// Create new user
app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    // SQL query to insert a new user into the database
    const [result] = await db.query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );
    const user = { id: result.insert_id, name, email };
    res.status(201).send(user);
  } catch (e) {
    console.error("Error creating user:", e);
    res.status(400).json({ error: "Failed to create user" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users');
    res.send(users);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
// Get a specific user by user_id
app.get("/users/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({ error: `User with ID ${userId} not found` });
    }
    
    res.send(user[0]);
  } catch (e) {
    console.error("Error fetching user:", e);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

