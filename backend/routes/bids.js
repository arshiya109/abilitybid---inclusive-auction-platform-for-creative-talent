const express = require('express');
const { placeBid, getUserBids, getArtworkBids } = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('buyer', 'artist', 'admin'), placeBid);

router.get('/user', protect, getUserBids);

router.get('/artwork/:artworkId', protect, getArtworkBids);

module.exports = router;
