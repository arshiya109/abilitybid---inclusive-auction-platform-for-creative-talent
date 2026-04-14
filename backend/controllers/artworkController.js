const Artwork = require('../models/Artwork');
const { closeAuctionAndNotify } = require('../services/auctionService');

const normalizeArtworkStatus = async (artwork, io = null) => {
  if (!artwork) return artwork;
  return closeAuctionAndNotify(artwork, io);
};

// @desc    Create artwork (Artist only)
// @route   POST /api/artworks
exports.createArtwork = async (req, res) => {
  try {
    const start = req.body.auctionStart ? new Date(req.body.auctionStart) : new Date();
    const end = req.body.auctionEnd ? new Date(req.body.auctionEnd) : null;
    if (!end || Number.isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Valid auction end date is required' });
    }
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid auction start date' });
    }
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'Auction end time must be after start time' });
    }

    const artworkData = {
      ...req.body,
      artistId: req.user.id,
      auctionStart: start,
      auctionEnd: end,
      image: req.file ? `uploads/${req.file.filename}` : req.body.image || 'uploads/default-artwork.png'
    };

    const artwork = await Artwork.create(artworkData);

    res.status(201).json({
      success: true,
      data: artwork
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all artworks (with filters)
// @route   GET /api/artworks
exports.getArtworks = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 12 } = req.query;
    
    let query = { status: 'active', $or: [{ verificationStatus: 'approved' }, { verificationStatus: { $exists: false } }] };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    const artworks = await Artwork.find(query)
      .populate('artistId', 'name email')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    await Promise.all(artworks.map((artwork) => normalizeArtworkStatus(artwork, req.app.get('io'))));
    const total = await Artwork.countDocuments(query);

    res.status(200).json({
      success: true,
      data: artworks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single artwork
// @route   GET /api/artworks/:id
exports.getArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artistId', 'name email verified')
      .populate('highestBidderId', 'name email verified');

    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    await normalizeArtworkStatus(artwork, req.app.get('io'));

    // Only approved artworks visible to public; artist (owner) and admin can see pending/rejected
    const verified = artwork.verificationStatus === 'approved' || !artwork.verificationStatus;
    const artistId = artwork.artistId?._id || artwork.artistId;
    const isOwner = req.user && artistId && String(artistId) === String(req.user.id);
    const isAdmin = req.user && req.user.role === 'admin';
    if (!verified && !isOwner && !isAdmin) {
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

// @desc    Get artist's artworks
// @route   GET /api/artist/artworks
exports.getArtistArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find({ artistId: req.user.id })
      .sort('-createdAt');
    await Promise.all(artworks.map((artwork) => normalizeArtworkStatus(artwork, req.app.get('io'))));

    res.status(200).json({
      success: true,
      data: artworks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update artwork (Artist only)
// @route   PUT /api/artworks/:id
exports.updateArtwork = async (req, res) => {
  try {
    let artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    if (artwork.artistId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const nextStart = req.body.auctionStart ? new Date(req.body.auctionStart) : artwork.auctionStart;
    const nextEnd = req.body.auctionEnd ? new Date(req.body.auctionEnd) : artwork.auctionEnd;
    if (Number.isNaN(new Date(nextStart).getTime()) || Number.isNaN(new Date(nextEnd).getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid auction start or end date' });
    }
    if (new Date(nextEnd) <= new Date(nextStart)) {
      return res.status(400).json({ success: false, message: 'Auction end time must be after start time' });
    }

    artwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        auctionStart: nextStart,
        auctionEnd: nextEnd,
        image: req.file ? `uploads/${req.file.filename}` : artwork.image
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: artwork
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete artwork
// @route   DELETE /api/artworks/:id
exports.deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    if (artwork.artistId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await artwork.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Artwork deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
