import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import styles from './ChatPanel.module.css';

function MessageBubble({ msg, onRate }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble} ${msg.isError ? styles.errorBubble : ''} fade-in`}>
      {!isUser && (
        <div className={styles.aiLabel}>
          <span className={styles.aiDot} />
          GRIB
        </div>
      )}
      <p className={styles.bubbleText}>{msg.content}</p>
      {!isUser && (
        <div className={styles.feedbackRow}>
          <button
            className={`${styles.feedbackBtn} ${msg.feedback === 'up' ? styles.feedbackActive : ''}`}
            onClick={() => onRate(msg._id, 'up')}
            disabled={!!msg.feedback}
            title="Good response"
            id={`feedback-up-${msg._id}`}
          >
            👍
          </button>
          <button
            className={`${styles.feedbackBtn} ${msg.feedback === 'down' ? styles.feedbackActive : ''}`}
            onClick={() => onRate(msg._id, 'down')}
            disabled={!!msg.feedback}
            title="Not helpful"
            id={`feedback-down-${msg._id}`}
          >
            👎
          </button>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className={`${styles.bubble} ${styles.aiBubble} ${styles.typing}`}>
      <div className={styles.aiLabel}><span className={styles.aiDot} />GRIB</div>
      <div className={styles.typingDots}>
        <span /><span /><span />
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { messages, loading, historyLoaded, loadHistory, sendMessage, clearHistory, rateFeedback } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!historyLoaded) loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    await sendMessage(trimmed);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const STARTER_PROMPTS = [
    "What ideas have I been circling around?",
    "What's my biggest goal right now?",
    "Find patterns in my recent thoughts",
    "What should I focus on today?",
  ];

  return (
    <div className={`${styles.panel} ${collapsed ? styles.panelCollapsed : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.statusDot} />
          <span className={styles.title}>GRIB AI</span>
          <span className={styles.subtitle}>your second brain</span>
        </div>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <button
              className={styles.clearBtn}
              onClick={clearHistory}
              title="Clear chat history"
              id="clear-chat-btn"
            >
              Clear
            </button>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand chat' : 'Collapse chat'}
            id="chat-collapse-btn"
          >
            {collapsed ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Messages */}
          <div className={styles.messages} id="chat-messages">
            {messages.length === 0 && !loading && (
              <div className={styles.welcome}>
                <div className={styles.welcomeIcon}>🧠</div>
                <p className={styles.welcomeTitle}>
                  Hey{user?.name ? ` ${user.name}` : ''}. I'm built from your thoughts.
                </p>
                <p className={styles.welcomeSubtitle}>Ask me anything. I'll answer using your own brain as reference.</p>
                <div className={styles.starters}>
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      className={styles.starterBtn}
                      onClick={() => { setInput(p); inputRef.current?.focus(); }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg._id} msg={msg} onRate={rateFeedback} />
            ))}

            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <textarea
              id="chat-input"
              ref={inputRef}
              className={styles.chatInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your second brain..."
              rows={2}
              disabled={loading}
            />
            <button
              id="chat-send-btn"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <div className={styles.sendSpinner} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
