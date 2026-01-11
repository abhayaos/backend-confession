const express = require('express');
const User = require('../models/User');
const Confession = require('../models/Confession');
const router = express.Router();

// Get user profile by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        interests: user.interests,
        streak: user.streak,
        achievements: user.achievements,
        confessionCount: user.confessionCount,
        followers: user.followers.length,
        following: user.following.length,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { bio, interests, profilePicture, username } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bio, interests, profilePicture, username },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        profilePicture: updatedUser.profilePicture,
        interests: updatedUser.interests,
        streak: updatedUser.streak,
        achievements: updatedUser.achievements,
        confessionCount: updatedUser.confessionCount,
        followers: updatedUser.followers.length,
        following: updatedUser.following.length,
        isOnboarded: updatedUser.isOnboarded
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// Get user's confessions
router.get('/:userId/confessions', async (req, res) => {
  try {
    const { userId } = req.params;

    const confessions = await Confession.find({ author: userId })
      .populate('author', 'username profilePicture displayName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      confessions,
      count: confessions.length
    });
  } catch (error) {
    console.error('Get user confessions error:', error);
    res.status(500).json({ message: 'Server error while fetching confessions' });
  }
});

// Get user stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get confession count (already stored in user model)
    const confessionCount = user.confessionCount;

    // Get follower/following counts
    const followerCount = user.followers.length;
    const followingCount = user.following.length;

    // Get like count across all confessions
    const likeCountResult = await Confession.aggregate([
      { $match: { author: user._id } },
      { $unwind: '$likes' },
      { $count: 'totalLikes' }
    ]);
    
    const likeCount = likeCountResult.length > 0 ? likeCountResult[0].totalLikes : 0;

    // Get comment count across all confessions
    const commentCountResult = await Confession.aggregate([
      { $match: { author: user._id } },
      { $unwind: '$comments' },
      { $count: 'totalComments' }
    ]);
    
    const commentCount = commentCountResult.length > 0 ? commentCountResult[0].totalComments : 0;

    res.status(200).json({
      stats: {
        confessionCount,
        likeCount,
        commentCount,
        followerCount,
        followingCount
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
});

// Delete user account
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    // Verify the user is authorized to delete their own account
    // In a real app, you'd verify the token here
    
    // Find and delete the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete all confessions by this user
    await Confession.deleteMany({ author: userId });
    
    // Remove this user from other users' followers/following lists
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );
    
    // Finally, delete the user
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error while deleting account' });
  }
});

module.exports = router;