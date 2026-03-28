const User = require('../models/User');

// GET /api/users — all users (for finding DM targets)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username avatar status bio')
      .sort({ status: 1, username: 1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/:id — single user profile
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username avatar status bio createdAt');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/users/profile — update profile
const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    const update = {};
    if (username) update.username = username;
    if (bio !== undefined) update.bio = bio;

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, getUserById, updateProfile };
