import { useState } from 'react';
import { useDumpsStore } from '../store/dumpsStore';
import styles from './DumpCard.module.css';

const MOOD_CONFIG = {
  idea: { emoji: '💡', label: 'idea', className: 'tag-idea' },
  rant: { emoji: '😤', label: 'rant', className: 'tag-rant' },
  goal: { emoji: '🎯', label: 'goal', className: 'tag-goal' },
  random: { emoji: '🌀', label: 'random', className: 'tag-random' },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DumpCard({ dump, searchQuery, related = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { deleteDump } = useDumpsStore();

  const mood = MOOD_CONFIG[dump.moodTag] || MOOD_CONFIG.random;
  const isLong = dump.content.length > 280;
  const displayContent = isLong && !expanded ? dump.content.slice(0, 280) + '…' : dump.content;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    await deleteDump(dump._id);
  };

  // Highlight search query in content
  const highlightText = (text, query) => {
    if (!query || !query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className={styles.highlight}>{part}</mark> : part
    );
  };

  return (
    <div
      className={`${styles.card} ${dump._optimistic ? styles.optimistic : ''} ${deleting ? styles.deleting : ''} fade-in`}
      id={`dump-${dump._id}`}
    >
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={`tag ${mood.className}`}>
            {mood.emoji} {mood.label}
          </span>
          <span className={styles.time}>{timeAgo(dump.createdAt)}</span>
          <span className={styles.wordCount}>{dump.wordCount}w</span>
        </div>
        <button
          className={`btn ${confirmDelete ? 'btn-danger' : styles.deleteBtn}`}
          onClick={handleDelete}
          title={confirmDelete ? 'Click again to confirm' : 'Delete dump'}
          id={`delete-dump-${dump._id}`}
        >
          {confirmDelete ? '⚠ Confirm' : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          )}
        </button>
      </div>

      <p className={styles.content}>
        {highlightText(displayContent, searchQuery)}
      </p>

      {isLong && (
        <button className={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less ↑' : 'Read more ↓'}
        </button>
      )}

      {related.length > 0 && (
        <RelatedDumps dumps={related} />
      )}
    </div>
  );
}

function RelatedDumps({ dumps: relatedList }) {
  const [open, setOpen] = useState(false);
  const MOOD_CONFIG_LOCAL = {
    idea: '💡', rant: '😤', goal: '🎯', random: '🌀',
  };

  return (
    <div className={styles.related}>
      <button className={styles.relatedToggle} onClick={() => setOpen(!open)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
        </svg>
        {open ? 'Hide' : `${relatedList.length} related thought${relatedList.length > 1 ? 's' : ''}`}
        <span className={styles.relatedChevron}>{open ? '↑' : '↓'}</span>
      </button>

      {open && (
        <div className={styles.relatedList}>
          {relatedList.map((r) => (
            <div key={r._id} className={styles.relatedItem}
              onClick={() => document.getElementById(`dump-${r._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
              <span className={styles.relatedEmoji}>{MOOD_CONFIG_LOCAL[r.moodTag] || '🌀'}</span>
              <p className={styles.relatedContent}>
                {r.content.length > 100 ? r.content.slice(0, 100) + '…' : r.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
