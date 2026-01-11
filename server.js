// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://backend-confession.vercel.app',
    'https://confession-git-main-abhayabikramshahi.vercel.app',
    'https://confession.vercel.app',
    'https://confession.yugalmeet.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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
