export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) {
    return <div className="typing-indicator" />;
  }

  const names =
    typingUsers.length === 1
      ? typingUsers[0].username
      : typingUsers.length === 2
      ? `${typingUsers[0].username} and ${typingUsers[1].username}`
      : `${typingUsers[0].username} and ${typingUsers.length - 1} others`;

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      <span>{names} {typingUsers.length === 1 ? 'is' : 'are'} typing…</span>
    </div>
  );
}
