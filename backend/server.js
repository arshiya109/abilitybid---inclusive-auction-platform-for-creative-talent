require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const artworkRoutes = require('./routes/artworks');
const bidRoutes = require('./routes/bids');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allows server-to-server and same-origin tools
  return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
};
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }
});

// Socket.io for real-time bid updates
io.on('connection', (socket) => {
  socket.on('join-artwork', (artworkId) => {
    socket.join(`artwork-${artworkId}`);
  });

  socket.on('leave-artwork', (artworkId) => {
    socket.leave(`artwork-${artworkId}`);
  });

  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
  });
});

// Make io available in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/abilitybid';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create default admin (optional - run once)
const User = require('./models/User');
const createDefaultAdmin = async () => {
  const adminExists = await User.findOne({ email: 'admin@abilitybid.com' });
  if (!adminExists) {
    await User.create({
      name: 'Admin',
      email: 'admin@abilitybid.com',
      password: 'admin123',
      role: 'admin',
      verified: true
    });
    console.log('Default admin created (admin@abilitybid.com / admin123)');
  }
};

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  await createDefaultAdmin();
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io };
