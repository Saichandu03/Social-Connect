const express = require('express');
const router = express.Router();
const {
  createNewUser,
  authenticateUser,
  fetchUserProfile,
  updateUserProfile,
  handleAvatarUpload,
  getAllUsers,
  upload
} = require('../controllers/userController');

router.post('/register', createNewUser);
router.post('/login', authenticateUser);
router.get('/', getAllUsers);
router.get('/:id', fetchUserProfile);
router.put('/:id', updateUserProfile);
router.post('/:id/avatar', upload.single('avatar'), handleAvatarUpload);

module.exports = router;

