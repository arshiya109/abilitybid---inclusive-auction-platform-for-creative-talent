const Bid = require('../models/Bid');
const { createNotification } = require('./notificationService');

const closeAuctionAndNotify = async (artwork, io) => {
  if (!artwork) return artwork;
  const isExpired = new Date() > new Date(artwork.auctionEnd);
  if (!isExpired || artwork.status !== 'active') return artwork;

  artwork.status = artwork.currentBid > 0 ? 'sold' : 'ended';
  await artwork.save();

  if (artwork.status === 'sold' && artwork.highestBidderId) {
    await createNotification({
      io,
      userId: artwork.highestBidderId,
      type: 'auction-won',
      title: 'You won the auction',
      message: `Congratulations! You won "${artwork.title}" with ₹${artwork.currentBid}.`,
      artworkId: artwork._id,
      eventKey: `auction-won:${artwork._id}:${artwork.highestBidderId}`
    });
  }

  const participants = await Bid.distinct('bidderId', { artworkId: artwork._id });
  await Promise.all(
    participants
      .filter((bidderId) => String(bidderId) !== String(artwork.highestBidderId || ''))
      .map((bidderId) => createNotification({
        io,
        userId: bidderId,
        type: 'auction-lost',
        title: 'Auction ended',
        message: artwork.status === 'sold'
          ? `You did not win "${artwork.title}". Try again in upcoming auctions.`
          : `Auction for "${artwork.title}" ended without a winning bid.`,
        artworkId: artwork._id,
        eventKey: `auction-lost:${artwork._id}:${bidderId}`
      }))
  );

  io?.to(`artwork-${artwork._id}`).emit('auction:ended', {
    artworkId: artwork._id,
    artworkTitle: artwork.title,
    status: artwork.status,
    highestBidderId: artwork.highestBidderId,
    currentBid: artwork.currentBid
  });

  return artwork;
};

module.exports = {
  closeAuctionAndNotify
};
