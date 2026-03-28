const Message = require('../models/Message');
const Room = require('../models/Room');
const path = require('path');

// GET /api/messages/:roomId — paginated message history
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ room: roomId });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasMore: skip + messages.length < total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages/upload — file/image upload
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const isImage = req.file.mimetype.startsWith('image/');

    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      type: isImage ? 'image' : 'file',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, uploadMedia };
