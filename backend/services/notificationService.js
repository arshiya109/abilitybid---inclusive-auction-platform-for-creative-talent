const Notification = require('../models/Notification');

const emitNotification = (io, userId, payload) => {
  if (!io || !userId) return;
  io.to(`user-${userId}`).emit('notification:new', payload);
};

const createNotification = async ({ io, userId, type, title, message, artworkId = null, eventKey = null }) => {
  if (!userId || !type || !title || !message) return null;

  let notification;
  if (eventKey) {
    notification = await Notification.findOneAndUpdate(
      { userId, eventKey },
      { userId, type, title, message, artworkId, eventKey, read: false },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } else {
    notification = await Notification.create({ userId, type, title, message, artworkId });
  }

  emitNotification(io, userId, {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    artworkId: notification.artworkId,
    read: notification.read,
    createdAt: notification.createdAt
  });

  return notification;
};

module.exports = {
  createNotification
};
