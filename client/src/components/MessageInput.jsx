import { useState, useRef, useCallback } from 'react';
import api from '../api/axios';

const EMOJIS = ['😀','😂','🥰','😎','🤔','👍','👎','❤️','🔥','✨','🎉','😭','🙏','💪','🤣','😊','😍','🥳','😅','😴','🤩','😒','😏','🤗','😤','🙄','🤦','🤷','💯','🎊'];

export default function MessageInput({ onSend, roomId, onTyping, onStopTyping }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);

    // Typing events
    onTyping?.();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping?.();
    }, 2000);

    // Auto-resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setFilePreview({ type: 'image', url, name: f.name });
    } else {
      setFilePreview({ type: 'file', name: f.name, size: f.size });
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = useCallback(async () => {
    if (!text.trim() && !file) return;
    onStopTyping?.();
    clearTimeout(typingTimeoutRef.current);

    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onSend({
          type: res.data.type,
          fileUrl: res.data.fileUrl,
          fileName: res.data.fileName,
          fileSize: res.data.fileSize,
          content: text.trim() || res.data.fileName,
        });
        clearFile();
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setUploading(false);
      }
    } else {
      onSend({ type: 'text', content: text.trim() });
    }

    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, file, onSend, onStopTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="message-input-area">
      {/* File preview bar */}
      {filePreview && (
        <div className="file-preview-bar">
          <span className="file-preview-icon">
            {filePreview.type === 'image' ? '🖼️' : '📎'}
          </span>
          {filePreview.type === 'image' && (
            <img src={filePreview.url} alt="preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
          )}
          <span className="file-preview-name">{filePreview.name}</span>
          <button className="file-preview-remove" onClick={clearFile} title="Remove">✕</button>
        </div>
      )}

      <div className="message-input-wrapper">
        {/* Attach file */}
        <input
          id="file-upload-input"
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.mp4,.mp3"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          id="attach-file-btn"
          className="input-action-btn"
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
        >
          📎
        </button>

        {/* Textarea */}
        <textarea
          id="message-input"
          ref={textareaRef}
          className="message-textarea"
          placeholder={`Message #${roomId ? '…' : 'Select a room'}`}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={!roomId || uploading}
        />

        {/* Emoji */}
        <div className="input-extras-wrapper">
          <button
            id="emoji-btn"
            className="input-action-btn"
            title="Emoji"
            onClick={() => setShowEmoji((v) => !v)}
          >
            😊
          </button>
          {showEmoji && (
            <div className="emoji-panel">
              {EMOJIS.map((e) => (
                <button key={e} className="emoji-btn" onClick={() => addEmoji(e)} title={e}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send */}
        <button
          id="send-message-btn"
          className="send-btn"
          onClick={handleSend}
          disabled={(!text.trim() && !file) || uploading || !roomId}
          title="Send (Enter)"
        >
          {uploading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '➤'}
        </button>
      </div>

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right' }}>
        Enter to send · Shift+Enter for new line · 📎 to attach files
      </p>
    </div>
  );
}
