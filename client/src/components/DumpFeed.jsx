import { useEffect, useRef, useCallback } from 'react';
import { useDumpsStore } from '../store/dumpsStore';
import DumpCard from './DumpCard';
import styles from './DumpFeed.module.css';

const PLACEHOLDER_DUMPS = [
  { _id: 'p1', content: 'I want to build something people actually use every day. Not just another SaaS nobody opens.', moodTag: 'goal', wordCount: 18, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { _id: 'p2', content: 'Why does every productivity app feel like homework? They should feel like thinking out loud.', moodTag: 'rant', wordCount: 16, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { _id: 'p3', content: 'What if AI remembered not just what you said but HOW you think? That would be insane.', moodTag: 'idea', wordCount: 16, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: 'p4', content: 'Ship it before it is perfect. Always. Perfect is the enemy of shipped.', moodTag: 'random', wordCount: 13, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
];

export default function DumpFeed() {
  const { dumps, pagination, loading, searchResults, searchQuery, isSearching, fetchDumps, clearSearch, relatedMap } = useDumpsStore();
  const loaderRef = useRef(null);

  useEffect(() => {
    fetchDumps(1);
  }, []);

  // Infinite scroll
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && !loading && pagination.page < pagination.pages) {
      fetchDumps(pagination.page + 1, true);
    }
  }, [loading, pagination]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const isInSearchMode = searchQuery.length > 0;
  const displayDumps = isInSearchMode ? (searchResults || []) : dumps;
  const showPlaceholders = !isInSearchMode && dumps.length === 0 && !loading;

  if (showPlaceholders) {
    return (
      <div className={styles.feed}>
        <div className={styles.emptyBanner}>
          <p className={styles.emptyTitle}>Your thought stream starts here</p>
          <p className={styles.emptySubtitle}>Here's what GRIB looks like — drop your first thought above 👆</p>
        </div>
        <div className={styles.placeholderList}>
          {PLACEHOLDER_DUMPS.map((d) => (
            <div key={d._id} className={styles.placeholderCard}>
              <DumpCard dump={d} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feed} id="dump-feed">
      {isInSearchMode && (
        <div className={styles.searchHeader}>
          <span className={styles.searchInfo}>
            {isSearching ? 'Searching…' : `${displayDumps.length} result${displayDumps.length !== 1 ? 's' : ''} for "${searchQuery}"`}
          </span>
          <button className="btn btn-ghost" onClick={clearSearch} id="clear-search-btn">
            ✕ Clear
          </button>
        </div>
      )}

      {isSearching && (
        <div className={styles.skeletonList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${styles.skeleton} skeleton`} />
          ))}
        </div>
      )}

      {!isSearching && displayDumps.length === 0 && isInSearchMode && (
        <div className={styles.noResults}>
          <p>No dumps match "{searchQuery}"</p>
          <button className="btn btn-ghost" onClick={clearSearch}>Clear search</button>
        </div>
      )}

      <div className={styles.list}>
        {displayDumps.map((dump) => (
          <DumpCard
            key={dump._id}
            dump={dump}
            searchQuery={isInSearchMode ? searchQuery : ''}
            related={relatedMap[dump._id] || []}
          />
        ))}
      </div>

      {!isInSearchMode && (
        <div ref={loaderRef} className={styles.loader}>
          {loading && <div className={styles.loadingDots}><span /><span /><span /></div>}
          {!loading && pagination.page >= pagination.pages && dumps.length > 0 && (
            <p className={styles.endText}>— end of your thought stream —</p>
          )}
        </div>
      )}
    </div>
  );
}
