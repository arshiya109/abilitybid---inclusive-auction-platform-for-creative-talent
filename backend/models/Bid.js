const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  artworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true
  },
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bidAmount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: 0
  },
  bidTime: {
    type: Date,
    default: Date.now
  },
  isHighest: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

bidSchema.index({ artworkId: 1, bidderId: 1 });

module.exports = mongoose.model('Bid', bidSchema);
