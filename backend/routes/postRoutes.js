const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getUserPosts,
  getPost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  upload
} = require('../controllers/postController');

// @route   POST /api/posts
// @desc    Create a new post
// @access  Public
router.post('/', upload.single('image'), createPost);

// @route   GET /api/posts
// @desc    Get all posts (feed)
// @access  Public
router.get('/', getAllPosts);

// @route   GET /api/posts/user/:userId
// @desc    Get posts by user
// @access  Public
router.get('/user/:userId', getUserPosts);

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Public
router.get('/:id', getPost);

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Public
router.delete('/:id', deletePost);

// @route   POST /api/posts/:id/like
// @desc    Like/Unlike post
// @access  Public
router.post('/:id/like', toggleLike);

// @route   POST /api/posts/:id/comment
// @desc    Add comment to post
// @access  Public
router.post('/:id/comment', addComment);

// @route   DELETE /api/posts/:postId/comment/:commentId
// @desc    Delete comment
// @access  Public
router.delete('/:postId/comment/:commentId', deleteComment);

module.exports = router;

