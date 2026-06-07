import { useEffect, useState } from 'react';
import api from '../api/client';
import styles from './InsightsCard.module.css';

const MOOD_EMOJIS = { idea: '💡', rant: '😤', goal: '🎯', random: '🌀' };
const MOOD_LABELS = { idea: 'Ideas', rant: 'Rants', goal: 'Goals', random: 'Random' };

export default function InsightsCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/insights')
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.loadingRow}>
          <div className={`skeleton ${styles.skel}`} />
          <div className={`skeleton ${styles.skel}`} />
          <div className={`skeleton ${styles.skel}`} />
        </div>
      </div>
    );
  }

  if (!data || data.totalDumps === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>No data yet — start dumping to see your weekly patterns</p>
      </div>
    );
  }

  const moodEntries = Object.entries(data.moodDistribution).sort((a, b) => b[1] - a[1]);
  const topMood = moodEntries[0];

  return (
    <div className={styles.card} id="insights-card">
      <div className={styles.header}>
        <span className={styles.title}>This week's brain</span>
        <span className={styles.period}>Last 7 days</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{data.totalDumps}</span>
          <span className={styles.statLabel}>dumps</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{data.totalWords}</span>
          <span className={styles.statLabel}>words</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{data.avgWordsPerDump}</span>
          <span className={styles.statLabel}>avg words</span>
        </div>
        {data.mostActiveHour && (
          <div className={styles.stat}>
            <span className={styles.statValue}>{data.mostActiveHour.label}</span>
            <span className={styles.statLabel}>peak hour</span>
          </div>
        )}
      </div>

      {moodEntries.length > 0 && (
        <div className={styles.moods}>
          {moodEntries.map(([tag, count]) => {
            const pct = Math.round((count / data.totalDumps) * 100);
            return (
              <div key={tag} className={styles.moodRow}>
                <span className={`tag tag-${tag}`}>{MOOD_EMOJIS[tag]} {MOOD_LABELS[tag]}</span>
                <div className={styles.bar}>
                  <div className={`${styles.barFill} ${styles[`bar_${tag}`]}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.pct}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
