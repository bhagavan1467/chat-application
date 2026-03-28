import { useState } from 'react';
import api from '../api/axios';

export default function RoomModal({ onClose, onRoomCreated }) {
  const [form, setForm] = useState({ name: '', description: '', type: 'public' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Room name is required.');
    setLoading(true);
    try {
      const res = await api.post('/rooms', {
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
      });
      onRoomCreated(res.data.room);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">✨ Create Channel</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="room-name">Channel Name</label>
            <input
              id="room-name"
              className="form-input"
              type="text"
              name="name"
              placeholder="e.g. general, random, design"
              value={form.name}
              onChange={handleChange}
              maxLength={50}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="room-description">Description (Optional)</label>
            <input
              id="room-description"
              className="form-input"
              type="text"
              name="description"
              placeholder="What's this channel about?"
              value={form.description}
              onChange={handleChange}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div className="type-selector">
              <button
                type="button"
                id="type-public-btn"
                className={`type-chip ${form.type === 'public' ? 'selected' : ''}`}
                onClick={() => setForm((p) => ({ ...p, type: 'public' }))}
              >
                🌐 Public
              </button>
              <button
                type="button"
                id="type-private-btn"
                className={`type-chip ${form.type === 'private' ? 'selected' : ''}`}
                onClick={() => setForm((p) => ({ ...p, type: 'private' }))}
              >
                🔒 Private
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {form.type === 'public'
                ? 'Anyone can find and join this channel.'
                : 'Only invited members can join.'}
            </p>
          </div>

          {error && (
            <div className="alert alert-error">⚠️ {error}</div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button
              id="create-room-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : '✨ Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
