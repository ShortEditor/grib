import { useState } from 'react';
import ChatPanel from './ChatPanel';
import styles from './MobileChat.module.css';

export default function MobileChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating chat button */}
      {!open && (
        <button
          className={styles.fab}
          onClick={() => setOpen(true)}
          id="mobile-chat-btn"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span className={styles.fabLabel}>Chat</span>
        </button>
      )}

      {/* Slide-up modal */}
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.handle} />
            <div className={styles.closeRow}>
              <span className={styles.sheetTitle}>GRIB AI</span>
              <button className={styles.closeBtn} onClick={() => setOpen(false)} id="mobile-chat-close">✕</button>
            </div>
            <div className={styles.panelWrap}>
              <ChatPanel />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
