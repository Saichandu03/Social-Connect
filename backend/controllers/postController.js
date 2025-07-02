const Post = require('../models/Post');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for post image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/posts/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Create a new post
const createPost = async (req, res) => {
  try {
    const { content, userId } = req.body;

    if (!content || !userId) {
      return res.status(400).json({ message: 'Content and userId are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = new Post({
      user: userId,
      content,
      image: req.file ? `/uploads/posts/${req.file.filename}` : ''
    });

    await post.save();

    // Add post to user's posts array
    user.posts.push(post._id);
    await user.save();

    // Populate user data for response
    await post.populate('user', 'name email avatar');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all posts (feed)
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('likes.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get posts by user
const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const posts = await Post.find({ user: userId })
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('likes.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single post
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('likes.user', 'name email avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete post - Only post owner can delete
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.body.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the post owner
    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: 'Only the post owner can delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    // Remove post from user's posts array
    await User.findByIdAndUpdate(userId, {
      $pull: { posts: postId }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Like/Unlike post
const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already liked the post
    const existingLike = post.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
      // Unlike the post
      post.likes = post.likes.filter(like => like.user.toString() !== userId);
    } else {
      // Like the post
      post.likes.push({ user: userId });
    }

    await post.save();

    // Populate the updated post
    await post.populate('user', 'name email avatar');
    await post.populate('comments.user', 'name email avatar');
    await post.populate('likes.user', 'name email avatar');

    res.json({
      message: existingLike ? 'Post unliked' : 'Post liked',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add comment to post
const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text, userId } = req.body;

    if (!text || !userId) {
      return res.status(400).json({ message: 'Text and userId are required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add comment
    post.comments.push({
      user: userId,
      text
    });

    await post.save();

    // Populate the updated post
    await post.populate('user', 'name email avatar');
    await post.populate('comments.user', 'name email avatar');
    await post.populate('likes.user', 'name email avatar');

    res.json({
      message: 'Comment added successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete comment - Only comment owner or post owner can delete
const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment owner or the post owner
    const isCommentOwner = comment.user.toString() === userId;
    const isPostOwner = post.user.toString() === userId;

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({ 
        message: 'Only the comment owner or post owner can delete this comment' 
      });
    }

    post.comments.pull(commentId);
    await post.save();

    // Populate the updated post
    await post.populate('user', 'name email avatar');
    await post.populate('comments.user', 'name email avatar');
    await post.populate('likes.user', 'name email avatar');

    res.json({
      message: 'Comment deleted successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getUserPosts,
  getPost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  upload
};

