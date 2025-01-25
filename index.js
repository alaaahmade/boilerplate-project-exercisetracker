const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());  // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL encoded form data

// In-memory store for users and their exercises
const users = {};

// Route to create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Create a unique user ID
  const _id = Math.random().toString(36).substring(2, 15);

  // Create the user object
  users[_id] = {
    _id,
    username,
    exercises: [],
  };

  // Send response with username and user ID
  res.json({ username, _id });
});

// Route to get a list of all users
app.get('/api/users', (req, res) => {
  const userList = Object.values(users); // Convert users object to an array
  res.json(userList);
});

// Route to add an exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const user = users[_id];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const exercise = {
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date(),
  };

  user.exercises.push(exercise);

  // Return the updated user and exercise data
  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  });
});

// Route to get a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = users[_id];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let log = user.exercises;

  // Filter by 'from' and 'to' dates if provided
  if (from || to) {
    log = log.filter(exercise => {
      const exerciseDate = new Date(exercise.date);
      return (
        (from ? exerciseDate >= new Date(from) : true) &&
        (to ? exerciseDate <= new Date(to) : true)
      );
    });
  }

  // Limit the number of log entries if the 'limit' is provided
  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  // Return the user with exercise log and count
  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    })),
  });
});

// Server listening
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
