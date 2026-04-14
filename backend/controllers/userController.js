const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');
const { closeAuctionAndNotify } = require('../services/auctionService');

const normalizeArtworkStatus = async (artwork, io = null) => {
  if (!artwork) return artwork;
  return closeAuctionAndNotify(artwork, io);
};

// @desc    Get current user profile
// @route   GET /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name || undefined, phone: phone || undefined, address: address || undefined },
      { new: true, runValidators: true }
    ).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload avatar
// @route   PUT /api/users/avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const avatarPath = `uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user stats (buyer: won/lost bids; artist: artworks, total bids)
// @route   GET /api/users/stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'buyer' || role === 'admin') {
      const allBids = await Bid.find({ bidderId: userId }).populate('artworkId').sort('-bidTime');

      const latestBidByArtwork = new Map();
      for (const bid of allBids) {
        const artwork = bid.artworkId;
        if (!artwork) continue;
        await normalizeArtworkStatus(artwork, req.app.get('io'));
        const key = String(artwork._id);
        if (!latestBidByArtwork.has(key)) latestBidByArtwork.set(key, bid);
      }

      const uniqueArtworkBids = Array.from(latestBidByArtwork.values());
      const endedArtworks = uniqueArtworkBids.filter((b) => b.artworkId && (b.artworkId.status === 'ended' || b.artworkId.status === 'sold'));
      const wonBids = endedArtworks.filter((b) => String(b.artworkId.highestBidderId) === String(userId));
      const lostBids = endedArtworks.filter((b) => String(b.artworkId.highestBidderId) !== String(userId));
      const activeBids = uniqueArtworkBids.filter((b) => b.artworkId && b.artworkId.status === 'active');
      const activeWinning = activeBids.filter((b) => String(b.artworkId.highestBidderId) === String(userId));

      return res.status(200).json({
        success: true,
        data: {
          totalBids: uniqueArtworkBids.length,
          wonBids: wonBids.length,
          lostBids: lostBids.length,
          activeBids: activeBids.length,
          activeWinning: activeWinning.length
        }
      });
    }

    if (role === 'artist') {
      const artworks = await Artwork.find({ artistId: userId });
      for (const artwork of artworks) {
        await normalizeArtworkStatus(artwork, req.app.get('io'));
      }
      const activeCount = artworks.filter((a) => a.status === 'active').length;
      const endedCount = artworks.filter((a) => a.status === 'ended' || a.status === 'sold').length;
      const totalBidsReceived = artworks.reduce((sum, a) => sum + (a.bidCount || 0), 0);

      return res.status(200).json({
        success: true,
        data: {
          totalArtworks: artworks.length,
          activeArtworks: activeCount,
          endedArtworks: endedCount,
          totalBidsReceived
        }
      });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
exports.getNotifications = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 30;
    const notifications = await Notification.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(limit);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/users/notifications/read
exports.markNotificationsRead = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (ids.length > 0) {
      await Notification.updateMany({ _id: { $in: ids }, userId: req.user.id }, { read: true });
    } else {
      await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
