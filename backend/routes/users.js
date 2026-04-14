const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getStats,
  getNotifications,
  markNotificationsRead
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { avatarUpload } = require('../config/multer');

const router = express.Router();
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/avatar', avatarUpload.single('avatar'), uploadAvatar);
router.get('/stats', getStats);
router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);

module.exports = router;
