const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    default: 'Anonymous Soul',
    trim: true
  },
  profilePicture: {
    type: String, // Will store emoji or image URL
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200
  },
  interests: [{
    type: String
  }],
  isOnboarded: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  confessionCount: {
    type: Number,
    default: 0
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  achievements: [{
    type: String
  }],
  streak: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);