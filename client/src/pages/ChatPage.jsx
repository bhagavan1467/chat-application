import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import RoomModal from '../components/RoomModal';
import TypingIndicator from '../components/TypingIndicator';
import UserAvatar from '../components/UserAvatar';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [roomMembers, setRoomMembers] = useState([]);

  // ── Load rooms ─────────────────────────────────────────────
  const loadRooms = useCallback(async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data.rooms);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // ── Load messages for active room ───────────────────────────
  const loadMessages = useCallback(async (roomId) => {
    setMessagesLoading(true);
    setMessages([]);
    try {
      const res = await api.get(`/messages/${roomId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // ── Select a room ───────────────────────────────────────────
  const handleSelectRoom = useCallback((room) => {
    if (activeRoom?._id === room._id) return;

    // Leave old socket room
    if (socket && activeRoom) {
      socket.emit('leave_room', { roomId: activeRoom._id });
    }

    setActiveRoom(room);
    setTypingUsers([]);
    setRoomMembers(room.members || []);
    loadMessages(room._id);

    // Join new socket room
    if (socket) {
      socket.emit('join_room', { roomId: room._id });
    }
  }, [activeRoom, socket, loadMessages]);

  // ── Socket.IO event listeners ───────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ message, roomId }) => {
      // Add to messages if it's the active room
      if (roomId === activeRoom?._id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }

      // Update room's last message preview
      setRooms((prev) =>
        prev.map((r) =>
          r._id === roomId ? { ...r, lastMessage: message } : r
        )
      );
    };

    const handleUserTyping = ({ roomId, user: typingUser }) => {
      if (roomId !== activeRoom?._id) return;
      if (typingUser._id === user?._id) return;
      setTypingUsers((prev) => {
        if (prev.find((u) => u._id === typingUser._id)) return prev;
        return [...prev, typingUser];
      });
    };

    const handleUserStopTyping = ({ roomId, userId }) => {
      if (roomId !== activeRoom?._id) return;
      setTypingUsers((prev) => prev.filter((u) => u._id !== userId));
    };

    const handleStatusChanged = ({ userId, status }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: status }));
      setRoomMembers((prev) =>
        prev.map((m) => (m._id === userId ? { ...m, status } : m))
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('user_status_changed', handleStatusChanged);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('user_status_changed', handleStatusChanged);
    };
  }, [socket, activeRoom, user]);

  // ── Send message ────────────────────────────────────────────
  const handleSend = useCallback(({ type, content, fileUrl, fileName, fileSize }) => {
    if (!socket || !activeRoom) return;
    socket.emit('send_message', {
      roomId: activeRoom._id,
      content,
      type,
      fileUrl,
      fileName,
      fileSize,
    });
  }, [socket, activeRoom]);

  // ── Typing events ───────────────────────────────────────────
  const handleTyping = useCallback(() => {
    if (socket && activeRoom) {
      socket.emit('typing', { roomId: activeRoom._id });
    }
  }, [socket, activeRoom]);

  const handleStopTyping = useCallback(() => {
    if (socket && activeRoom) {
      socket.emit('stop_typing', { roomId: activeRoom._id });
    }
  }, [socket, activeRoom]);

  // ── Create room ─────────────────────────────────────────────
  const handleRoomCreated = useCallback((newRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
    handleSelectRoom(newRoom);
  }, [handleSelectRoom]);

  // ── New DM ──────────────────────────────────────────────────
  const handleNewDM = useCallback(async (targetUserId) => {
    const res = await api.post('/rooms/dm', { targetUserId });
    const room = res.data.room;
    setRooms((prev) => {
      if (prev.find((r) => r._id === room._id)) return prev;
      return [room, ...prev];
    });
    handleSelectRoom(room);
  }, [handleSelectRoom]);

  // ── Room display name ───────────────────────────────────────
  const getRoomDisplayName = (room) => {
    if (!room) return '';
    if (room.type === 'dm') {
      const other = room.members?.find((m) => m._id !== user?._id);
      return other?.username || room.name;
    }
    return `# ${room.name}`;
  };

  const getRoomMemberCount = () => {
    return roomMembers.length;
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <Sidebar
        rooms={rooms}
        activeRoom={activeRoom}
        onSelectRoom={handleSelectRoom}
        onCreateRoom={() => setShowRoomModal(true)}
        onNewDM={handleNewDM}
        onlineUsers={onlineUsers}
      />

      {/* Main area */}
      <main className="chat-main">
        {activeRoom ? (
          <>
            {/* Topbar */}
            <div className="chat-topbar">
              <div className="chat-topbar-info">
                <div className="chat-topbar-name">{getRoomDisplayName(activeRoom)}</div>
                <div className="chat-topbar-meta">
                  {activeRoom.type === 'dm' ? (
                    (() => {
                      const other = activeRoom.members?.find((m) => m._id !== user?._id);
                      return (
                        <span style={{ color: other?.status === 'online' ? 'var(--success)' : 'var(--text-muted)' }}>
                          ● {other?.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      );
                    })()
                  ) : (
                    <span>{getRoomMemberCount()} member{getRoomMemberCount() !== 1 ? 's' : ''}</span>
                  )}
                  {activeRoom.description && (
                    <span style={{ marginLeft: '0.75rem' }}>· {activeRoom.description}</span>
                  )}
                </div>
              </div>

              {/* Member avatars */}
              <div className="chat-topbar-actions">
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {roomMembers.slice(0, 5).map((m) => (
                    <UserAvatar key={m._id} user={m} size="sm" showStatus />
                  ))}
                  {roomMembers.length > 5 && (
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--bg-hover)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', color: 'var(--text-secondary)',
                      }}
                    >
                      +{roomMembers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <MessageList messages={messages} loading={messagesLoading} />

            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />

            {/* Input */}
            <MessageInput
              roomId={activeRoom._id}
              onSend={handleSend}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
            />
          </>
        ) : (
          /* Welcome screen */
          <div className="welcome-panel">
            <div style={{ fontSize: '4rem' }}>💬</div>
            <h1 className="welcome-title">Welcome to ChitChat</h1>
            <p className="welcome-subtitle">
              Real-time messaging for teams and friends. Select a channel from the sidebar or start a direct conversation.
            </p>
            <div className="welcome-features">
              <div className="welcome-feature">
                <div className="welcome-feature-icon">⚡</div>
                <div className="welcome-feature-label">Real-time</div>
              </div>
              <div className="welcome-feature">
                <div className="welcome-feature-icon">🔒</div>
                <div className="welcome-feature-label">Secure</div>
              </div>
              <div className="welcome-feature">
                <div className="welcome-feature-icon">📎</div>
                <div className="welcome-feature-label">File Sharing</div>
              </div>
              <div className="welcome-feature">
                <div className="welcome-feature-icon">💾</div>
                <div className="welcome-feature-label">Persistent</div>
              </div>
            </div>
            <button
              id="welcome-create-room-btn"
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => setShowRoomModal(true)}
            >
              ✨ Create your first channel
            </button>
          </div>
        )}
      </main>

      {/* Room creation modal */}
      {showRoomModal && (
        <RoomModal
          onClose={() => setShowRoomModal(false)}
          onRoomCreated={handleRoomCreated}
        />
      )}
    </div>
  );
}
