import { useState, useRef, useEffect } from 'react';
import { useDumpsStore } from '../store/dumpsStore';
import styles from './SearchBar.module.css';

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const { search, clearSearch, searchQuery, isSearching } = useDumpsStore();

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else {
      setValue('');
      clearSearch();
    }
  }, [open]);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (v.trim().length > 1) {
      search(v.trim());
    } else if (v.trim().length === 0) {
      clearSearch();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      {!open ? (
        <button
          className={styles.iconBtn}
          onClick={() => setOpen(true)}
          id="search-toggle-btn"
          title="Search dumps"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      ) : (
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            id="search-input"
            className={styles.input}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search your thoughts..."
          />
          {isSearching && <div className={styles.spinner} />}
          <button className={styles.closeBtn} onClick={() => setOpen(false)} id="search-close-btn">✕</button>
        </div>
      )}
    </div>
  );
}
