const Bid = require('../models/Bid');
const Artwork = require('../models/Artwork');
const { closeAuctionAndNotify } = require('../services/auctionService');
const { createNotification } = require('../services/notificationService');

const normalizeAuctionState = async (artwork, io = null) => {
  if (!artwork) return artwork;
  return closeAuctionAndNotify(artwork, io);
};

// @desc    Place bid
// @route   POST /api/bids
exports.placeBid = async (req, res) => {
  try {
    const { artworkId, bidAmount } = req.body;

    if (!artworkId || !bidAmount) {
      return res.status(400).json({ success: false, message: 'Artwork ID and bid amount required' });
    }

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }
    await normalizeAuctionState(artwork, req.app.get('io'));

    if (artwork.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Auction is not active' });
    }

    if (new Date() > new Date(artwork.auctionEnd)) {
      return res.status(400).json({ success: false, message: 'Auction has ended' });
    }
    if (new Date() < new Date(artwork.auctionStart)) {
      return res.status(400).json({ success: false, message: 'Auction has not started yet' });
    }

    const minBid = artwork.currentBid > 0 ? artwork.currentBid : artwork.startingPrice;
    if (bidAmount <= minBid) {
      return res.status(400).json({
        success: false,
        message: `Bid must be higher than ₹${minBid}`
      });
    }

    // Artist cannot bid on own artwork
    if (artwork.artistId.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot bid on your own artwork' });
    }

    const previousHighestBidderId = artwork.highestBidderId ? String(artwork.highestBidderId) : null;

    const bid = await Bid.create({
      artworkId,
      bidderId: req.user.id,
      bidAmount,
      isHighest: true
    });

    // Update artwork with new highest bid
    await Artwork.findByIdAndUpdate(artworkId, {
      currentBid: bidAmount,
      highestBidderId: req.user.id,
      $inc: { bidCount: 1 }
    });

    // Set previous highest bids to false
    await Bid.updateMany(
      { artworkId, _id: { $ne: bid._id } },
      { isHighest: false }
    );

    const populatedBid = await Bid.findById(bid._id)
      .populate('bidderId', 'name email')
      .populate('artworkId', 'title currentBid');

    const io = req.app.get('io');
    if (io) {
      io.to(`artwork-${artworkId}`).emit('bid:new', {
        artworkId,
        artworkTitle: artwork.title,
        bidId: bid._id,
        bidderId: req.user.id,
        bidderName: populatedBid.bidderId?.name || 'A user',
        bidAmount,
        bidTime: bid.bidTime
      });

    }

    if (previousHighestBidderId && previousHighestBidderId !== String(req.user.id)) {
      await createNotification({
        io,
        userId: previousHighestBidderId,
        type: 'outbid',
        artworkId,
        title: 'You were outbid',
        message: `A user placed ₹${bidAmount} on "${artwork.title}" and exceeded your bid.`,
        eventKey: `outbid:${artworkId}:${previousHighestBidderId}:${bid._id}`
      });
    }

    await createNotification({
      io,
      userId: req.user.id,
      type: 'bid-placed',
      artworkId,
      title: 'Bid placed successfully',
      message: `You placed ₹${bidAmount} on "${artwork.title}".`,
      eventKey: `bid-placed:${artworkId}:${req.user.id}:${bid._id}`
    });

    if (String(artwork.artistId) !== String(req.user.id)) {
      await createNotification({
        io,
        userId: artwork.artistId,
        type: 'new-bid',
        artworkId,
        title: 'New bid received',
        message: `${populatedBid.bidderId?.name || 'A bidder'} placed ₹${bidAmount} on "${artwork.title}".`,
        eventKey: `new-bid:${artworkId}:${artwork.artistId}:${bid._id}`
      });
    }

    res.status(201).json({
      success: true,
      data: populatedBid
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bids for user
// @route   GET /api/bids/user
exports.getUserBids = async (req, res) => {
  try {
    const bids = await Bid.find({ bidderId: req.user.id })
      .populate('artworkId')
      .sort('-bidTime');

    const normalizedBids = await Promise.all(bids.map(async (bid) => {
      if (!bid.artworkId) return bid;
      await normalizeAuctionState(bid.artworkId, req.app.get('io'));
      return bid;
    }));

    res.status(200).json({
      success: true,
      data: normalizedBids
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bids for artwork
// @route   GET /api/bids/artwork/:artworkId
exports.getArtworkBids = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.artworkId);
    await normalizeAuctionState(artwork, req.app.get('io'));

    const bids = await Bid.find({ artworkId: req.params.artworkId })
      .populate('bidderId', 'name email')
      .sort('-bidAmount');

    res.status(200).json({
      success: true,
      data: bids
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
