const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { initFirebaseAdmin } = require('../config/firebaseAdmin');

const getToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'abilitybid_secret_key_2024',
    { expiresIn: '7d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, disabilityCertificate } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'buyer',
      disabilityCertificate: role === 'artist' ? disabilityCertificate : null
    });

    const token = getToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = getToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login/Register via Firebase ID token
// @route   POST /api/auth/firebase
exports.firebaseAuth = async (req, res) => {
  try {
    const { idToken, role, name, disabilityCertificate } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Firebase token is required' });
    }

    const admin = initFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email ? decoded.email.toLowerCase() : null;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Firebase account has no email' });
    }

    let user = await User.findOne({
      $or: [{ firebaseUid: decoded.uid }, { email }]
    }).select('+password');

    if (!user) {
      const safeRole = role === 'artist' ? 'artist' : 'buyer';
      user = await User.create({
        name: name || decoded.name || email.split('@')[0],
        email,
        authProvider: 'firebase',
        firebaseUid: decoded.uid,
        role: safeRole,
        password: `${decoded.uid}-${Date.now()}-firebase`,
        disabilityCertificate: safeRole === 'artist' ? (disabilityCertificate || null) : null,
        verified: !!decoded.email_verified
      });
    } else {
      let changed = false;
      if (!user.firebaseUid) {
        user.firebaseUid = decoded.uid;
        changed = true;
      }
      if (user.authProvider !== 'firebase') {
        user.authProvider = 'firebase';
        changed = true;
      }
      if (decoded.email_verified && !user.verified) {
        user.verified = true;
        changed = true;
      }
      if (changed) await user.save();
    }

    const token = getToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message || 'Firebase authentication failed' });
  }
};
