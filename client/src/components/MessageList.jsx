import { useEffect, useRef, useState } from 'react';
import UserAvatar from './UserAvatar';
import { useAuth } from '../context/AuthContext';

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

const getFileIcon = (name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
  if (ext === 'pdf') return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (ext === 'zip') return '🗜️';
  if (['mp4', 'webm'].includes(ext)) return '🎬';
  if (['mp3', 'wav'].includes(ext)) return '🎵';
  return '📎';
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function MessageList({ messages, loading }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="message-list" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--accent)', borderColor: 'var(--bg-elevated)', width: 32, height: 32, borderWidth: 2.5 }} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="message-list">
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-title">No messages yet</div>
          <div className="empty-state-desc">Be the first to say something!</div>
        </div>
      </div>
    );
  }

  // Group messages and inject date dividers
  const grouped = [];
  let lastDate = null;
  let lastSenderId = null;

  messages.forEach((msg, idx) => {
    const msgDate = formatDate(msg.createdAt);
    if (msgDate !== lastDate) {
      grouped.push({ type: 'divider', label: msgDate, key: `div-${idx}` });
      lastDate = msgDate;
      lastSenderId = null;
    }

    const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
    const senderId = msg.sender?._id || msg.sender;
    const showAvatar = senderId !== lastSenderId;
    lastSenderId = senderId;

    grouped.push({ type: 'message', msg, isOwn, showAvatar });
  });

  return (
    <>
      <div className="message-list">
        {grouped.map((item, idx) => {
          if (item.type === 'divider') {
            return (
              <div key={item.key} className="message-date-divider">
                <span className="message-date-label">{item.label}</span>
              </div>
            );
          }

          const { msg, isOwn, showAvatar } = item;
          const sender = msg.sender;

          return (
            <div
              key={msg._id || idx}
              className={`message-group ${isOwn ? 'own' : ''}`}
            >
              {/* Avatar column */}
              <div className="message-avatar-col" style={{ width: 36 }}>
                {showAvatar && !isOwn ? (
                  <UserAvatar user={sender} size="sm" />
                ) : (
                  <div style={{ width: 28 }} />
                )}
              </div>

              {/* Content column */}
              <div className="message-content-col">
                {showAvatar && (
                  <div className="message-meta">
                    {!isOwn && (
                      <span className="message-sender-name">{sender?.username || 'Unknown'}</span>
                    )}
                    {isOwn && (
                      <span className="message-sender-name" style={{ color: 'var(--accent)' }}>You</span>
                    )}
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                )}

                {/* Text message */}
                {msg.type === 'text' && (
                  <div className={`message-bubble ${!showAvatar ? 'message-bubble-compact' : ''}`}>
                    {msg.content}
                  </div>
                )}

                {/* Image message */}
                {msg.type === 'image' && (
                  <img
                    src={msg.fileUrl}
                    alt={msg.fileName || 'image'}
                    className="message-image"
                    onClick={() => setLightboxSrc(msg.fileUrl)}
                    loading="lazy"
                  />
                )}

                {/* File message */}
                {msg.type === 'file' && (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="message-file"
                    download={msg.fileName}
                  >
                    <span className="message-file-icon">{getFileIcon(msg.fileName)}</span>
                    <div className="message-file-info">
                      <div className="message-file-name">{msg.fileName}</div>
                      <div className="message-file-size">{formatSize(msg.fileSize)}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '1rem', opacity: 0.6 }}>⬇</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image Lightbox */}
      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Full size" />
        </div>
      )}
    </>
  );
}
