const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [50, 'Room name must be at most 50 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ['public', 'private', 'dm'],
      default: 'public',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
