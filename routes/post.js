const express = require('express');
const Confession = require('../models/Confession');
const User = require('../models/User');
const router = express.Router();

// Create a new post/confession
router.post('/', async (req, res) => {
  try {
    const { content, author, isAnonymous = true } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (content.length > 500) {
      return res.status(400).json({ message: 'Content is too long' });
    }

    const confession = new Confession({
      content: content.trim(),
      author,
      isAnonymous
    });

    await confession.save();

    // Populate author info before returning
    await confession.populate('author', 'username profilePicture displayName isOnboarded');

    // Update user's confession count
    await User.findByIdAndUpdate(
      author,
      { $inc: { confessionCount: 1 } }
    );

    res.status(201).json({
      message: 'Post created successfully',
      post: confession
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error while creating post' });
  }
});

// Get a specific post
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Confession.findById(postId)
      .populate('author', 'username profilePicture displayName isOnboarded')
      .populate('comments.user', 'username profilePicture displayName');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error while fetching post' });
  }
});

// Update a post
router.put('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (content.length > 500) {
      return res.status(400).json({ message: 'Content is too long' });
    }

    const updatedPost = await Confession.findByIdAndUpdate(
      postId,
      { content: content.trim() },
      { new: true }
    ).populate('author', 'username profilePicture displayName isOnboarded');

    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error while updating post' });
  }
});

// Delete a post
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Confession.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await Confession.findByIdAndDelete(postId);

    // Decrease user's confession count
    await User.findByIdAndUpdate(
      post.author,
      { $inc: { confessionCount: -1 } }
    );

    res.status(200).json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error while deleting post' });
  }
});

module.exports = router;