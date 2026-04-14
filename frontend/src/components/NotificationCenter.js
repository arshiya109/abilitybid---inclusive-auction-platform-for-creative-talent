import React, { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationCenter.css';

export default function NotificationCenter() {
  const { notifications, unreadCount, removeNotification, markAllRead } = useNotifications();

  useEffect(() => {
    if (!notifications.length) return undefined;
    const timers = notifications.map((n) => setTimeout(() => removeNotification(n.id), 5000));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [notifications, removeNotification]);

  return (
    <div className="notification-center" aria-live="polite" aria-atomic="false">
      {notifications.length > 0 && (
        <div className="notification-toolbar">
          <span>{unreadCount} unread</span>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead}>Mark all as read</button>
          )}
        </div>
      )}
      {notifications.map((n) => (
        <div key={n.id} className={`notification-toast type-${n.type}`}>
          <div>
            <strong>{n.title}</strong>
            {n.message && <p>{n.message}</p>}
          </div>
          <button type="button" onClick={() => removeNotification(n.id)} aria-label="Dismiss notification">
            x
          </button>
        </div>
      ))}
    </div>
  );
}

