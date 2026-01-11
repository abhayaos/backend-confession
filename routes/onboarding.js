const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      displayName: 'Anonymous Soul' // Default display name
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        isOnboarded: user.isOnboarded
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        isOnboarded: user.isOnboarded
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Complete user profile (onboarding)
router.put('/complete-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { bio, interests, profilePicture } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        bio,
        interests,
        profilePicture: profilePicture || '👤', // Default emoji if none provided
        isOnboarded: true
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile completed successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        isOnboarded: updatedUser.isOnboarded
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ message: 'Server error during profile completion' });
  }
});

module.exports = router;