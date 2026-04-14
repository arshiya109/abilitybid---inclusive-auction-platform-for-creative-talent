import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { artworkAPI, bidAPI } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getSocket, joinArtworkRoom, leaveArtworkRoom } from '../services/socket';
import { getImageUrl } from '../utils/getImageUrl';
import './ArtworkDetail.css';

export default function ArtworkDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { pushNotification } = useNotifications();
  const [artwork, setArtwork] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidding, setBidding] = useState(false);

  useEffect(() => {
    artworkAPI.getOne(id)
      .then((res) => {
        const data = res.data.data;
        setArtwork(data);
        const curr = data.currentBid > 0 ? data.currentBid : data.startingPrice;
        setBidAmount(curr + 1);
      })
      .catch(() => setArtwork(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user && artwork) {
      bidAPI.getArtworkBids(id).then((res) => setBids(res.data.data)).catch(() => {});
    }
  }, [user, id, artwork]);

  useEffect(() => {
    const socket = getSocket();
    joinArtworkRoom(id);

    const onNewBid = (payload) => {
      if (String(payload.artworkId) !== String(id)) return;

      setArtwork((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentBid: payload.bidAmount,
          highestBidderId: payload.bidderId,
          bidCount: (prev.bidCount || 0) + 1
        };
      });

      setBids((prev) => [
        {
          _id: payload.bidId,
          bidAmount: payload.bidAmount,
          bidTime: payload.bidTime,
          bidderId: { _id: payload.bidderId, name: payload.bidderName }
        },
        ...prev
      ]);

      if (user && String(payload.bidderId) !== String(user.id)) {
        pushNotification({
          type: 'info',
          title: 'New bid placed',
          message: `${payload.bidderName} bid ${formatCurrency(payload.bidAmount)}.`
        });
      }
    };

    const onAuctionEnded = (payload) => {
      if (String(payload.artworkId) !== String(id)) return;
      setArtwork((prev) => prev ? {
        ...prev,
        status: payload.status,
        currentBid: payload.currentBid,
        highestBidderId: payload.highestBidderId
      } : prev);
      pushNotification({
        type: payload.status === 'sold' ? 'auction-won' : 'info',
        title: 'Auction ended',
        message: payload.status === 'sold'
          ? `${payload.artworkTitle} closed at ${formatCurrency(payload.currentBid)}.`
          : `${payload.artworkTitle} ended without a winning bid.`
      });
    };

    socket.on('bid:new', onNewBid);
    socket.on('auction:ended', onAuctionEnded);
    return () => {
      leaveArtworkRoom(id);
      socket.off('bid:new', onNewBid);
      socket.off('auction:ended', onAuctionEnded);
    };
  }, [id, user, pushNotification]);

  const handleBid = async (e) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setBidding(true);
    try {
      await bidAPI.place({ artworkId: id, bidAmount: Number(bidAmount) });
      const res = await artworkAPI.getOne(id);
      setArtwork(res.data.data);
      const bidsRes = await bidAPI.getArtworkBids(id);
      setBids(bidsRes.data.data);
      setBidAmount(res.data.data.currentBid + 1);
      pushNotification({
        type: 'bid-placed',
        title: 'Bid submitted',
        message: `Your bid of ${formatCurrency(Number(bidAmount))} has been placed.`
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Bid failed');
    } finally {
      setBidding(false);
    }
  };

  if (loading || !artwork) return <div className="loading">Loading...</div>;

  const imageUrl = getImageUrl(artwork.image);

  const endDate = new Date(artwork.auctionEnd);
  const startDate = new Date(artwork.auctionStart);
  const hasStarted = startDate <= new Date();
  const isEnded = artwork.status !== 'active' || endDate < new Date();
  const currentPrice = artwork.currentBid > 0 ? artwork.currentBid : artwork.startingPrice;
  const artistId = artwork.artistId?._id || artwork.artistId;
  const canBid = user && hasStarted && !isEnded && artwork.status === 'active' && String(artistId) !== String(user.id);
  const minBid = currentPrice + 1;

  return (
    <div className="artwork-detail">
      <div className="artwork-detail-grid">
        <div className="artwork-image-wrap">
          <img src={imageUrl} alt={artwork.title} />
        </div>
        <div className="artwork-info">
          <h1>{artwork.title}</h1>
          <p className="category">{artwork.category}</p>
          {artwork.artistId && (
            <p className="artist">by {artwork.artistId.name}</p>
          )}
          <p className="description">{artwork.description}</p>
          <div className="bid-section">
            <div className="current-bid">
              <span>Current Bid</span>
              <strong>{formatCurrency(currentPrice)}</strong>
            </div>
            <p className="auction-end">
              Auction starts: {startDate.toLocaleString()}
            </p>
            <p className="auction-end">
              Auction ends: {endDate.toLocaleString()}
            </p>
            {!hasStarted && <p className="ended-badge">Auction not started yet</p>}
            {isEnded && <p className="ended-badge">Auction Ended</p>}
            {canBid && (
              <form onSubmit={handleBid} className="bid-form">
                {error && <div className="error-msg">{error}</div>}
                <div className="form-group">
                  <label htmlFor="bidAmount">Your bid (min {formatCurrency(minBid)})</label>
                  <input
                    id="bidAmount"
                    type="number"
                    min={minBid}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-accent" disabled={bidding}>
                  {bidding ? 'Placing bid...' : 'Place Bid'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      {bids.length > 0 && (
        <div className="bid-history card">
          <h3>Bid History</h3>
          <ul>
            {bids.slice(0, 10).map((b) => (
              <li key={b._id}>
                {b.bidderId?.name} - {formatCurrency(b.bidAmount)} ({new Date(b.bidTime).toLocaleString()})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
