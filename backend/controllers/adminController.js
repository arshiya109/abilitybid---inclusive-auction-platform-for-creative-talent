const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Bid = require('../models/Bid');
const Transaction = require('../models/Transaction');

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending verifications
// @route   GET /api/admin/pending-verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    const pendingArtworks = await Artwork.find({ verificationStatus: 'pending' })
      .populate('artistId', 'name email verified')
      .sort('-createdAt');
    const unverifiedArtists = await User.find({ role: 'artist', verified: false }).select('-password');
    const unverifiedBuyers = await User.find({ role: 'buyer', verified: false }).select('-password');

    res.status(200).json({
      success: true,
      data: {
        pendingArtworks,
        unverifiedArtists,
        unverifiedBuyers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify artist (seller identity)
// @route   PUT /api/admin/verify-artist/:id
exports.verifyArtist = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify buyer (buyer identity)
// @route   PUT /api/admin/verify-buyer/:id
exports.verifyBuyer = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify artwork/auction
// @route   PUT /api/admin/verify-artwork/:id
exports.verifyArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: 'approved',
        verifiedAt: new Date(),
        verifiedBy: req.user.id,
        rejectionReason: null
      },
      { new: true }
    )
      .populate('artistId', 'name email verified')
      .populate('verifiedBy', 'name');

    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    res.status(200).json({
      success: true,
      data: artwork
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject artwork/auction
// @route   PUT /api/admin/reject-artwork/:id
exports.rejectArtwork = async (req, res) => {
  try {
    const { reason } = req.body;
    const artwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: 'rejected',
        verifiedAt: new Date(),
        verifiedBy: req.user.id,
        rejectionReason: reason || 'Rejected by admin'
      },
      { new: true }
    );

    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    res.status(200).json({
      success: true,
      data: artwork
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all auctions
// @route   GET /api/admin/auctions
exports.getAuctions = async (req, res) => {
  try {
    const artworks = await Artwork.find()
      .populate('artistId', 'name email verified')
      .populate('highestBidderId', 'name email verified')
      .populate('verifiedBy', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: artworks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove/delete artwork (fake listing)
// @route   DELETE /api/admin/artworks/:id
exports.removeArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findByIdAndDelete(req.params.id);

    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    await Bid.deleteMany({ artworkId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Artwork removed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalArtists = await User.countDocuments({ role: 'artist' });
    const totalArtworks = await Artwork.countDocuments();
    const activeAuctions = await Artwork.countDocuments({ status: 'active', verificationStatus: 'approved' });
    const totalBids = await Bid.countDocuments();
    const pendingArtworks = await Artwork.countDocuments({ verificationStatus: 'pending' });
    const unverifiedArtists = await User.countDocuments({ role: 'artist', verified: false });
    const unverifiedBuyers = await User.countDocuments({ role: 'buyer', verified: false });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalArtists,
        totalArtworks,
        activeAuctions,
        totalBids,
        pendingArtworks,
        unverifiedArtists,
        unverifiedBuyers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
