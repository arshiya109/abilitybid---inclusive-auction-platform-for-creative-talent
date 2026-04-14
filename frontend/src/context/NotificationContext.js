import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { getSocket } from '../services/socket';
import { userAPI } from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const pushNotification = useCallback((notification) => {
    const normalized = {
      id: notification._id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info',
      createdAt: notification.createdAt || new Date().toISOString(),
      read: Boolean(notification.read),
      artworkId: notification.artworkId || null
    };

    setNotifications((prev) => {
      const filtered = prev.filter((item) => item.id !== normalized.id);
      return [normalized, ...filtered].slice(0, 50);
    });
    setUnreadCount((prev) => prev + (normalized.read ? 0 : 1));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    const socket = getSocket();
    socket.emit('join-user', user.id);

    userAPI.getNotifications(50)
      .then((res) => {
        const mapped = (res.data.data || []).map((n) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          type: n.type,
          createdAt: n.createdAt,
          read: n.read,
          artworkId: n.artworkId
        }));
        setNotifications(mapped);
        setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {});

    const onNotification = (payload) => pushNotification(payload);
    socket.on('notification:new', onNotification);

    return () => {
      socket.off('notification:new', onNotification);
    };
  }, [user?.id, pushNotification]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    pushNotification,
    removeNotification,
    markRead: async (ids = []) => {
      if (!ids.length) return;
      const unreadInSelection = notifications.filter((n) => ids.includes(n.id) && !n.read).length;
      await userAPI.markNotificationsRead(ids);
      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - unreadInSelection));
    },
    markAllRead: async () => {
      await userAPI.markNotificationsRead([]);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }), [notifications, unreadCount, pushNotification, removeNotification]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}

