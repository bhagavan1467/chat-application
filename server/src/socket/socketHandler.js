const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Map of userId -> socketId for tracking online users
const onlineUsers = new Map();

const socketHandler = (io) => {
  // Authenticate socket connections with JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🔌 ${user.username} connected [${socket.id}]`);

    // Track online status
    onlineUsers.set(user._id.toString(), socket.id);
    await User.findByIdAndUpdate(user._id, { status: 'online' });
    io.emit('user_status_changed', { userId: user._id, status: 'online' });

    // Auto-join user's rooms
    const userRooms = await Room.find({ members: user._id });
    userRooms.forEach((room) => socket.join(room._id.toString()));

    // ── JOIN ROOM ──────────────────────────────────────────────
    socket.on('join_room', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        if (!room.members.includes(user._id)) {
          room.members.push(user._id);
          await room.save();
          await User.findByIdAndUpdate(user._id, { $addToSet: { rooms: roomId } });
        }

        socket.join(roomId);

        // Notify others in room
        socket.to(roomId).emit('user_joined', {
          roomId,
          user: { _id: user._id, username: user.username, avatar: user.avatar },
        });
      } catch (err) {
        console.error('join_room error:', err);
      }
    });

    // ── LEAVE ROOM ─────────────────────────────────────────────
    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user_left', {
        roomId,
        userId: user._id,
      });
    });

    // ── SEND MESSAGE ───────────────────────────────────────────
    socket.on('send_message', async ({ roomId, content, type, fileUrl, fileName, fileSize }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        const message = await Message.create({
          sender: user._id,
          room: roomId,
          content: content || '',
          type: type || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          fileSize: fileSize || 0,
          readBy: [user._id],
        });

        // Update room's last message
        await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });

        const populated = await message.populate('sender', 'username avatar');

        // Emit to all users in the room (including sender)
        io.to(roomId).emit('new_message', { message: populated, roomId });
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('message_error', { error: err.message });
      }
    });

    // ── TYPING ─────────────────────────────────────────────────
    socket.on('typing', ({ roomId }) => {
      socket.to(roomId).emit('user_typing', {
        roomId,
        user: { _id: user._id, username: user.username },
      });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('user_stop_typing', {
        roomId,
        userId: user._id,
      });
    });

    // ── DISCONNECT ─────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ ${user.username} disconnected`);
      onlineUsers.delete(user._id.toString());
      await User.findByIdAndUpdate(user._id, { status: 'offline' });
      io.emit('user_status_changed', { userId: user._id, status: 'offline' });
    });
  });
};

module.exports = socketHandler;
