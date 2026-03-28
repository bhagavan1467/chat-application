import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UserAvatar from './UserAvatar';

export default function Sidebar({ rooms, activeRoom, onSelectRoom, onCreateRoom, onNewDM, onlineUsers }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [showDMModal, setShowDMModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dmLoading, setDmLoading] = useState(false);

  const publicRooms = rooms.filter(
    (r) => r.type !== 'dm' && r.name.toLowerCase().includes(search.toLowerCase())
  );

  const dmRooms = rooms.filter(
    (r) =>
      r.type === 'dm' &&
      getDMName(r, user?._id).toLowerCase().includes(search.toLowerCase())
  );

  const openDMModal = async () => {
    setShowDMModal(true);
    try {
      const res = await api.get('/users');
      setAllUsers(res.data.users);
    } catch {}
  };

  const startDM = async () => {
    if (!selectedUser) return;
    setDmLoading(true);
    try {
      await onNewDM(selectedUser._id);
      setShowDMModal(false);
      setSelectedUser(null);
    } finally {
      setDmLoading(false);
    }
  };

  return (
    <>
      <aside className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">💬</div>
            <span className="sidebar-logo-text">ChitChat</span>
          </div>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <input
            id="sidebar-search-input"
            className="sidebar-search-input"
            type="text"
            placeholder="🔍  Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Rooms */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Channels</span>
            <button
              id="create-room-btn"
              className="sidebar-add-btn"
              onClick={onCreateRoom}
              title="Create channel"
            >
              +
            </button>
          </div>
        </div>

        <div className="sidebar-rooms">
          {publicRooms.map((room) => (
            <RoomItem
              key={room._id}
              room={room}
              active={activeRoom?._id === room._id}
              onClick={() => onSelectRoom(room)}
              label={`# ${room.name}`}
              icon="#"
            />
          ))}

          {publicRooms.length === 0 && !search && (
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              No channels yet. Create one!
            </div>
          )}

          {/* DMs section */}
          <div style={{ marginTop: '1rem' }}>
            <div className="sidebar-section-header" style={{ padding: '0 0.25rem', marginBottom: '0.5rem' }}>
              <span className="sidebar-section-title">Direct Messages</span>
              <button
                id="new-dm-btn"
                className="sidebar-add-btn"
                onClick={openDMModal}
                title="New direct message"
              >
                +
              </button>
            </div>

            {dmRooms.map((room) => {
              const dmName = getDMName(room, user?._id);
              const otherMember = room.members?.find((m) => m._id !== user?._id);
              return (
                <RoomItem
                  key={room._id}
                  room={room}
                  active={activeRoom?._id === room._id}
                  onClick={() => onSelectRoom(room)}
                  label={dmName}
                  icon={null}
                  avatar={<UserAvatar user={otherMember} size="sm" showStatus />}
                />
              );
            })}

            {dmRooms.length === 0 && !search && (
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                No DMs yet.
              </div>
            )}
          </div>
        </div>

        {/* User panel */}
        <div className="sidebar-user">
          <UserAvatar user={user} size="sm" showStatus />
          <div className="sidebar-user-info">
            <div className="sidebar-username">{user?.username}</div>
            <div className="sidebar-user-status">Online</div>
          </div>
          <button
            id="theme-toggle-btn"
            className="btn-icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            style={{ fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            id="logout-btn"
            className="btn-icon"
            onClick={logout}
            title="Sign out"
            style={{ fontSize: '1.1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            🚪
          </button>
        </div>
      </aside>

      {/* DM Modal */}
      {showDMModal && (
        <div className="modal-overlay" onClick={() => setShowDMModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">💬 New Direct Message</h2>
              <button className="modal-close" onClick={() => setShowDMModal(false)}>×</button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Select a user to start a conversation:
            </p>

            <div className="user-list">
              {allUsers.map((u) => (
                <div
                  key={u._id}
                  id={`dm-user-${u._id}`}
                  className={`user-list-item ${selectedUser?._id === u._id ? 'selected' : ''}`}
                  onClick={() => setSelectedUser(u)}
                >
                  <UserAvatar user={u} size="sm" showStatus />
                  <span className="user-list-item-name">{u.username}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: u.status === 'online' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {u.status}
                  </span>
                </div>
              ))}

              {allUsers.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No other users registered yet.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowDMModal(false)}>
                Cancel
              </button>
              <button
                id="start-dm-btn"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={startDM}
                disabled={!selectedUser || dmLoading}
              >
                {dmLoading ? <span className="spinner" /> : '→ Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Room Item ─────────────────────────────────────────────────
function RoomItem({ room, active, onClick, label, icon, avatar }) {
  return (
    <div
      id={`room-item-${room._id}`}
      className={`room-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {avatar ? (
        avatar
      ) : (
        <span className="room-icon">{icon}</span>
      )}
      <div className="room-info">
        <div className="room-name">{label}</div>
      </div>
    </div>
  );
}

function getDMName(room, currentUserId) {
  const other = room.members?.find((m) => m._id !== currentUserId);
  return other?.username || room.name;
}
