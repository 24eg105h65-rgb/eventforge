const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const sanitizeUser = (user) => user.toAuthJSON();

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
    });

    const token = createToken(user);

    res.status(201).json({
      success: true,
      message: 'You are now in. 🎟️',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.isActive || !(await user.comparePassword(password))) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const token = createToken(user);

    res.json({
      success: true,
      message: 'You are now logged in.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.json({
    success: true,
    message: 'You have been logged out.',
  });
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { name, avatar, interests } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    if (typeof name === 'string') user.name = name.trim();
    if (typeof avatar === 'string') user.avatar = avatar.trim();
    if (Array.isArray(interests)) user.interests = interests.map((interest) => String(interest).trim()).filter(Boolean);

    await user.save();

    res.json({ success: true, message: 'Profile updated.', user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const roleCheck = (req, res) => {
  res.json({
    success: true,
    user: req.user,
    authorized: req.user.role === 'organizer',
  });
};

module.exports = { register, login, logout, getMe, updateMe, roleCheck };
