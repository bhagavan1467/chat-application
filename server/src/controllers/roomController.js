const Room = require('../models/Room');
const User = require('../models/User');
const Message = require('../models/Message');

// GET /api/rooms — list all public rooms + user's rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { type: 'public' },
        { members: req.user._id },
      ],
    })
      .populate('members', 'username avatar status')
      .populate('admin', 'username')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rooms — create a new room
const createRoom = async (req, res) => {
  try {
    const { name, description, type } = req.body;

    if (!name) return res.status(400).json({ message: 'Room name is required.' });

    const room = await Room.create({
      name,
      description: description || '',
      type: type || 'public',
      admin: req.user._id,
      members: [req.user._id],
    });

    // Add room to user's room list
    await User.findByIdAndUpdate(req.user._id, { $push: { rooms: room._id } });

    const populated = await room.populate('members', 'username avatar status');

    res.status(201).json({ room: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rooms/:id/join — join a room
const joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    if (room.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member.' });
    }

    room.members.push(req.user._id);
    await room.save();

    await User.findByIdAndUpdate(req.user._id, { $push: { rooms: room._id } });

    const populated = await room.populate('members', 'username avatar status');
    res.json({ room: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rooms/dm — create or get DM room between two users
const createOrGetDM = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) return res.status(400).json({ message: 'Target user ID required.' });

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    // Find existing DM room
    let room = await Room.findOne({
      type: 'dm',
      members: { $all: [req.user._id, targetUserId], $size: 2 },
    }).populate('members', 'username avatar status');

    if (!room) {
      room = await Room.create({
        name: `${req.user.username}-${targetUser.username}`,
        type: 'dm',
        members: [req.user._id, targetUserId],
        admin: req.user._id,
      });
      room = await room.populate('members', 'username avatar status');
    }

    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/rooms/:id — get room details
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('members', 'username avatar status')
      .populate('admin', 'username');

    if (!room) return res.status(404).json({ message: 'Room not found.' });

    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRooms, createRoom, joinRoom, createOrGetDM, getRoomById };
