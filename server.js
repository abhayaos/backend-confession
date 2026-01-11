// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
const onboardingRoutes = require('./routes/onboarding');
const profileRoutes = require('./routes/profile');
const feedRoutes = require('./routes/feed');
const postRoutes = require('./routes/post');

app.use('/api/onboarding', onboardingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/post', postRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
