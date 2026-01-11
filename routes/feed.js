const express = require('express');
const Confession = require('../models/Confession');
const User = require('../models/User');
const router = express.Router();

// Get all confessions for the feed (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get confessions with author information (excluding password)
    const confessions = await Confession.find()
      .populate('author', 'username profilePicture displayName isOnboarded')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Confession.countDocuments();

    res.status(200).json({
      confessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error while fetching feed' });
  }
});

// Get trending confessions (most liked in last 24 hours)
router.get('/trending', async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trendingConfessions = await Confession.find({
      createdAt: { $gte: oneDayAgo }
    })
      .populate('author', 'username profilePicture displayName isOnboarded')
      .sort({ likes: -1, createdAt: -1 })
      .limit(10);

    res.status(200).json({
      confessions: trendingConfessions
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ message: 'Server error while fetching trending confessions' });
    }
});

// Get confessions from followed users
router.get('/following', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get the user to find who they're following
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get confessions from followed users
    const confessions = await Confession.find({
      author: { $in: user.following }
    })
      .populate('author', 'username profilePicture displayName isOnboarded')
      .sort({ createdAt: -1 });

    res.status(200).json({
      confessions
    });
  } catch (error) {
    console.error('Get following feed error:', error);
    res.status(500).json({ message: 'Server error while fetching following feed' });
  }
});

// Like a confession
router.post('/:confessionId/like', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const confession = await Confession.findById(confessionId);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }

    // Check if user already liked
    const userLiked = confession.likes.includes(userId);
    
    if (userLiked) {
      // Unlike
      await Confession.findByIdAndUpdate(
        confessionId,
        { $pull: { likes: userId } }
      );
      res.status(200).json({
        message: 'Confession unliked',
        liked: false
      });
    } else {
      // Like
      await Confession.findByIdAndUpdate(
        confessionId,
        { $addToSet: { likes: userId } }
      );
      res.status(200).json({
        message: 'Confession liked',
        liked: true
      });
    }
  } catch (error) {
    console.error('Like confession error:', error);
    res.status(500).json({ message: 'Server error while liking confession' });
  }
});

// Add a comment to a confession
router.post('/:confessionId/comment', async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ message: 'User ID and content are required' });
    }

    if (content.length > 200) {
      return res.status(400).json({ message: 'Comment is too long' });
    }

    const confession = await Confession.findById(confessionId);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }

    // Add comment to confession
    const updatedConfession = await Confession.findByIdAndUpdate(
      confessionId,
      {
        $push: {
          comments: {
            user: userId,
            content: content.trim()
          }
        }
      },
      { new: true }
    ).populate('author', 'username profilePicture displayName isOnboarded');

    res.status(200).json({
      message: 'Comment added successfully',
      confession: updatedConfession
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

// Get a specific confession
router.get('/:confessionId', async (req, res) => {
  try {
    const { confessionId } = req.params;

    const confession = await Confession.findById(confessionId)
      .populate('author', 'username profilePicture displayName isOnboarded')
      .populate('comments.user', 'username profilePicture displayName');

    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }

    res.status(200).json({
      confession
    });
  } catch (error) {
    console.error('Get confession error:', error);
    res.status(500).json({ message: 'Server error while fetching confession' });
  }
});

module.exports = router;