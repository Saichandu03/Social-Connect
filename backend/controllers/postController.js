const Post = require('../models/Post');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

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
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const createNewPost = async (req, res) => {
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

    user.posts.push(post._id);
    await user.save();

    await post.populate('user', 'name email avatar');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const fetchAllPosts = async (req, res) => {
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

const fetchUserPosts = async (req, res) => {
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

const fetchSinglePost = async (req, res) => {
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

const removePost = async (req, res) => {
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

    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: 'Only the post owner can delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    await User.findByIdAndUpdate(userId, {
      $pull: { posts: postId }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const handlePostLike = async (req, res) => {
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

    const existingLike = post.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
      post.likes = post.likes.filter(like => like.user.toString() !== userId);
    } else {
      post.likes.push({ user: userId });
    }

    await post.save();

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

const addCommentToPost = async (req, res) => {
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

    post.comments.push({
      user: userId,
      text
    });

    await post.save();

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

const removeCommentFromPost = async (req, res) => {
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

    const isCommentOwner = comment.user.toString() === userId;
    const isPostOwner = post.user.toString() === userId;

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({ 
        message: 'Only the comment owner or post owner can delete this comment' 
      });
    }

    post.comments.pull(commentId);
    await post.save();

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
  createNewPost,
  fetchAllPosts,
  fetchUserPosts,
  fetchSinglePost,
  removePost,
  handlePostLike,
  addCommentToPost,
  removeCommentFromPost,
  upload
};

