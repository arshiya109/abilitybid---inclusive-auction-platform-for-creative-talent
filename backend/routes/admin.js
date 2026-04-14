const express = require('express');
const {
  getUsers,
  verifyArtist,
  verifyBuyer,
  verifyArtwork,
  rejectArtwork,
  getPendingVerifications,
  getAuctions,
  removeArtwork,
  getStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.get('/auctions', getAuctions);
router.get('/stats', getStats);
router.get('/pending-verifications', getPendingVerifications);
router.put('/verify-artist/:id', verifyArtist);
router.put('/verify-buyer/:id', verifyBuyer);
router.put('/verify-artwork/:id', verifyArtwork);
router.put('/reject-artwork/:id', rejectArtwork);
router.delete('/artworks/:id', removeArtwork);

module.exports = router;
