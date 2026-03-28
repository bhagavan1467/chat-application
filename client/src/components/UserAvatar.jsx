// Generates a deterministic gradient avatar based on a username
const GRADIENTS = [
  ['#7c6af7', '#5b4dd4'],
  ['#f04f5c', '#c0392b'],
  ['#22d3a5', '#0db886'],
  ['#f59e0b', '#d97706'],
  ['#38bdf8', '#0369a1'],
  ['#a78bfa', '#7c3aed'],
  ['#fb7185', '#be185d'],
  ['#34d399', '#059669'],
];

const getGradient = (name = '') => {
  const idx = (name.charCodeAt(0) || 0) % GRADIENTS.length;
  return GRADIENTS[idx];
};

export default function UserAvatar({ user, size = 'md', showStatus = false }) {
  const name = user?.username || '?';
  const [g1, g2] = getGradient(name);
  const initial = name[0]?.toUpperCase() || '?';

  return (
    <div className="avatar-wrapper">
      <div
        className={`avatar avatar-${size}`}
        style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, color: 'white' }}
        title={name}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          initial
        )}
      </div>
      {showStatus && (
        <div className={`avatar-status-dot ${user?.status || 'offline'}`} />
      )}
    </div>
  );
}
