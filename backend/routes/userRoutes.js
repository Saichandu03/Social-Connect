const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  getAllUsers,
  upload
} = require('../controllers/userController');


router.post('/register', registerUser);

router.post('/login', loginUser);


router.get('/', getAllUsers);


router.get('/:id', getUserProfile);


router.put('/:id', updateUserProfile);


router.post('/:id/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;

