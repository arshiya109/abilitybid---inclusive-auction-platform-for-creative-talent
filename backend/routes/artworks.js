const express = require('express');
const {
  createArtwork,
  getArtworks,
  getArtwork,
  getArtistArtworks,
  updateArtwork,
  deleteArtwork
} = require('../controllers/artworkController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/multer');

const router = express.Router();

router.route('/')
  .get(getArtworks)
  .post(protect, authorize('artist', 'admin'), upload.single('image'), createArtwork);

router.get('/artist/artworks', protect, authorize('artist', 'admin'), getArtistArtworks);

router.route('/:id')
  .get(optionalAuth, getArtwork)
  .put(protect, authorize('artist', 'admin'), upload.single('image'), updateArtwork)
  .delete(protect, deleteArtwork);

module.exports = router;
