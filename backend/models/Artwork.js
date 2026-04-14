const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Artwork title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Artwork description is required']
  },
  image: {
    type: String,
    required: [true, 'Artwork image is required'],
    default: 'uploads/default-artwork.png'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['painting', 'sculpture', 'pottery', 'textile', 'jewelry', 'handicraft', 'digital-art', 'other']
  },
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: 0
  },
  auctionStart: {
    type: Date,
    default: Date.now
  },
  auctionEnd: {
    type: Date,
    required: [true, 'Auction end date is required']
  },
  currentBid: {
    type: Number,
    default: 0
  },
  highestBidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'ended', 'sold', 'cancelled'],
    default: 'active'
  },
  bidCount: {
    type: Number,
    default: 0
  },
  // Admin verification for auction/artwork details
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectionReason: { type: String, default: null }
}, {
  timestamps: true
});

// Index for search
artworkSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Artwork', artworkSchema);
