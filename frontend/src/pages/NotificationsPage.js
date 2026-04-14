import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import './NotificationsPage.css';

const FILTERS = ['all', 'unread', 'bid', 'auction'];

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread') return !n.read;
      if (filter === 'bid') return n.type === 'bid-placed' || n.type === 'outbid';
      if (filter === 'auction') return n.type === 'auction-won' || n.type === 'auction-lost';
      return true;
    });
  }, [notifications, filter]);

  return (
    <div className="notifications-page">
      <div className="notifications-header card">
        <div>
          <h1>Notifications</h1>
          <p className="muted">Track bidding activity, auction status, wins and losses.</p>
        </div>
        <button className="btn btn-primary" onClick={markAllRead} disabled={unreadCount === 0}>
          Mark all as read {unreadCount > 0 ? `(${unreadCount})` : ''}
        </button>
      </div>

      <div className="notifications-filters card">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="notifications-list card">
        {filtered.length === 0 ? (
          <p className="muted">No notifications found for this filter.</p>
        ) : (
          filtered.map((n) => (
            <div key={n.id} className={`notification-row ${n.read ? 'is-read' : 'is-unread'}`}>
              <div className="notification-row-main">
                <h4>{n.title}</h4>
                <p>{n.message}</p>
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </div>
              <div className="notification-row-actions">
                {!n.read && (
                  <button className="btn btn-outline-secondary" onClick={() => markRead([n.id])}>
                    Mark read
                  </button>
                )}
                {n.artworkId && (
                  <Link to={`/artworks/${n.artworkId}`} className="btn btn-primary">
                    View Auction
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
