import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { bidAPI, userAPI } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import SimpleBarChart from '../components/SimpleBarChart';
import { getSocket } from '../services/socket';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/getImageUrl';
import './Dashboard.css';

export default function BuyerDashboard() {
  const [bids, setBids] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { pushNotification } = useNotifications();
  const { user } = useAuth();
  const previousOutcomesRef = useRef({});

  const loadData = () => Promise.all([bidAPI.getUserBids(), userAPI.getStats()])
    .then(([b, s]) => {
      setBids(b.data.data);
      setStats(s.data.data);

      const nextOutcomes = {};
      b.data.data.forEach((bid) => {
        const artwork = bid.artworkId;
        if (!artwork) return;
        const outcome = (artwork.status === 'ended' || artwork.status === 'sold')
          ? (String(artwork.highestBidderId) === String(user?.id) ? 'won' : 'lost')
          : 'active';
        nextOutcomes[String(artwork._id)] = outcome;

        if (previousOutcomesRef.current[String(artwork._id)] === 'active' && outcome !== 'active') {
          pushNotification({
            type: outcome === 'won' ? 'bid-placed' : 'outbid',
            title: outcome === 'won' ? 'Auction won' : 'Auction ended',
            message: outcome === 'won'
              ? `You won "${artwork.title}".`
              : `You lost "${artwork.title}". Try another bid.`
          });
        }
      });
      previousOutcomesRef.current = nextOutcomes;
    })
    .catch(() => {})
    .finally(() => setLoading(false));

  useEffect(() => {
    loadData();
    const socket = getSocket();
    const onRealtimeNotice = (payload) => {
      pushNotification(payload);
      loadData();
    };
    socket.on('notification:new', onRealtimeNotice);

    const timer = setInterval(loadData, 30000);
    return () => {
      socket.off('notification:new', onRealtimeNotice);
      clearInterval(timer);
    };
  }, [user?.id, pushNotification]);

  const chartData = stats
    ? [
        { label: 'Won', value: stats.wonBids || 0, color: 'var(--success)' },
        { label: 'Lost', value: stats.lostBids || 0, color: 'var(--danger)' },
        { label: 'Active', value: stats.activeBids || 0, color: 'var(--primary)' }
      ]
    : [];

  return (
    <div className="dashboard">
      <h1>My Bids</h1>

      {stats && (
        <div className="dashboard-stats-section card">
          <h3>Bid Overview</h3>
          <div className="stats-row">
            <div className="stat-card card">
              <strong>{stats.wonBids || 0}</strong>
              <span>Won Bids</span>
            </div>
            <div className="stat-card card">
              <strong>{stats.lostBids || 0}</strong>
              <span>Lost Bids</span>
            </div>
            <div className="stat-card card">
              <strong>{stats.activeBids || 0}</strong>
              <span>Active Bids</span>
            </div>
            <div className="stat-card card">
              <strong>{stats.activeWinning || 0}</strong>
              <span>Currently Winning</span>
            </div>
          </div>
          {chartData.some((d) => d.value > 0) && (
            <div className="chart-section">
              <h4>Bid Summary (Graphical)</h4>
              <SimpleBarChart data={chartData} />
            </div>
          )}
        </div>
      )}

      <h3>My Bidding History</h3>
      {loading ? (
        <p>Loading...</p>
      ) : bids.length > 0 ? (
        <div className="bids-list">
          {bids.map((b) => {
            const artwork = b.artworkId;
            if (!artwork) return null;
            const imageUrl = getImageUrl(artwork.image);
            return (
              <div key={b._id} className="bid-card card">
                <div className="bid-card-content">
                  <img src={imageUrl} alt={artwork.title} className="bid-thumb" />
                  <div>
                    <h3><Link to={`/artworks/${artwork._id}`}>{artwork.title}</Link></h3>
                    <p>Your bid: {formatCurrency(b.bidAmount)}</p>
                    <p className="small">
                      {(artwork.status === 'ended' || artwork.status === 'sold') ? (
                        String(artwork.highestBidderId) === String(user?.id) ? (
                          <span className="highest">Won auction</span>
                        ) : (
                          <span className="lost">Lost auction</span>
                        )
                      ) : (b.isHighest ? (
                        <span className="highest">Currently highest bidder</span>
                      ) : 'Outbid')}
                    </p>
                    <p className="small">Bid at: {new Date(b.bidTime).toLocaleString()}</p>
                  </div>
                </div>
                <Link to={`/artworks/${artwork._id}`} className="btn btn-primary">View</Link>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">No bids yet. <Link to="/artworks">Browse artworks</Link> to place a bid.</p>
      )}
    </div>
  );
}
