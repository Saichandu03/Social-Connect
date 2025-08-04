const express = require('express');
const router = express.Router();
const {
  createNewPost,
  fetchAllPosts,
  fetchUserPosts,
  fetchSinglePost,
  removePost,
  handlePostLike,
  addCommentToPost,
  removeCommentFromPost,
  upload
} = require('../controllers/postController');

router.post('/', upload.single('image'), createNewPost);
router.get('/', fetchAllPosts);
router.get('/user/:userId', fetchUserPosts);
router.get('/:id', fetchSinglePost);
router.delete('/:id', removePost);
router.post('/:id/like', handlePostLike);
router.post('/:id/comments', addCommentToPost);
router.delete('/:postId/comments/:commentId', removeCommentFromPost);

module.exports = router;

