import { useState, useRef, useEffect } from 'react';
import { useDumpsStore } from '../store/dumpsStore';
import styles from './DumpInput.module.css';

const PLACEHOLDER_TEXTS = [
  "What's on your mind right now?",
  "Drop a thought. Any thought.",
  "An idea? A rant? A goal? Just type.",
  "Brain dump time. Go.",
  "What are you thinking about?",
];

export default function DumpInput() {
  const [content, setContent] = useState('');
  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);
  const { addDump } = useDumpsStore();

  useEffect(() => {
    const idx = Math.floor(Math.random() * PLACEHOLDER_TEXTS.length);
    setPlaceholder(PLACEHOLDER_TEXTS[idx]);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDump();
    }
  };

  const handleDump = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Write something first.');
      setTimeout(() => setError(''), 2000);
      return;
    }

    setContent('');
    setError('');
    textareaRef.current?.focus();

    const result = await addDump(trimmed);
    if (!result.success) {
      setError(result.error || 'Failed to save. Try again.');
      setContent(trimmed); // restore
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <textarea
          id="dump-input"
          ref={textareaRef}
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          autoFocus
        />
        <div className={styles.footer}>
          <div className={styles.hints}>
            {wordCount > 0 && (
              <span className={styles.wordCount}>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
            )}
            <span className={styles.hint}>Enter to dump · Shift+Enter for new line</span>
          </div>
          <button
            id="dump-submit-btn"
            className={styles.dumpBtn}
            onClick={handleDump}
            disabled={!content.trim()}
          >
            <span>Dump</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
