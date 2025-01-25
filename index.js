const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.json()); // for parsing JSON bodies

// In-memory storage for users and their exercise logs
let users = [];
let exercises = {};

// Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  
  // Check if the username already exists
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const newUser = {
    username,
    _id: new Date().toISOString(), // Unique user ID
  };

  users.push(newUser);
  res.json(newUser);
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Add an exercise to a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  // Ensure the duration is a number
  const exerciseDuration = Number(duration);

  // Validate the duration is a valid number
  if (isNaN(exerciseDuration)) {
    return res.status(400).json({ error: 'Duration must be a number' });
  }

  // Find user by ID
  const user = users.find(user => user._id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create the exercise object
  const exercise = {
    description,
    duration: exerciseDuration,
    date: date ? new Date(date).toDateString() : new Date().toDateString(), // If no date is provided, use current date
  };

  // Initialize user log if it doesn't exist
  if (!exercises[userId]) {
    exercises[userId] = [];
  }

  // Add exercise to user's log
  exercises[userId].push(exercise);

  // Update user's exercise count
  user.count = exercises[userId].length;

  // Return the updated user with exercise details
  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
  });
});

// Get the exercise log for a user
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  // Find user by ID
  const user = users.find(user => user._id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get the user's exercise log
  let userLog = exercises[userId] || [];

  // Filter by date if 'from' or 'to' are provided
  if (from) {
    const fromDate = new Date(from).getTime();
    userLog = userLog.filter(exercise => new Date(exercise.date).getTime() >= fromDate);
  }
  if (to) {
    const toDate = new Date(to).getTime();
    userLog = userLog.filter(exercise => new Date(exercise.date).getTime() <= toDate);
  }

  // Limit the number of logs if 'limit' is provided
  if (limit) {
    userLog = userLog.slice(0, Number(limit));
  }

  // Return the user object with the exercise log
  res.json({
    _id: user._id,
    username: user.username,
    count: userLog.length,
    log: userLog.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    })),
  });
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
