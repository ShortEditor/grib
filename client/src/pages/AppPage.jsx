import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDumpsStore } from '../store/dumpsStore';
import DumpInput from '../components/DumpInput';
import DumpFeed from '../components/DumpFeed';
import ChatPanel from '../components/ChatPanel';
import SearchBar from '../components/SearchBar';
import InsightsCard from '../components/InsightsCard';
import MobileChat from '../components/MobileChat';
import styles from './AppPage.module.css';

export default function AppPage() {
  const { user, logout } = useAuthStore();
  const { dumps } = useDumpsStore();
  const navigate = useNavigate();
  const [showInsights, setShowInsights] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      {/* Left pane */}
      <div className={styles.leftPane}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerBrand}>
            <div className={styles.logoMark}>G</div>
            <span className={styles.appName}>GRIB</span>
            <span className={styles.dumpCount}>{dumps.length} thoughts</span>
          </div>
          <div className={styles.headerActions}>
            <SearchBar />
            <button
              className={`btn btn-ghost ${styles.insightsBtn} ${showInsights ? styles.insightsBtnActive : ''}`}
              onClick={() => setShowInsights(!showInsights)}
              id="insights-toggle-btn"
              title="Weekly insights"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Insights
            </button>
            <div className={styles.userMenu}>
              <button
                className={styles.avatarBtn}
                title={user?.email}
                id="user-menu-btn"
              >
                {(user?.name || user?.email || 'G')[0].toUpperCase()}
              </button>
              <div className={styles.dropdown}>
                <div className={styles.dropdownEmail}>{user?.email}</div>
                <button className={styles.dropdownLogout} onClick={handleLogout} id="logout-btn">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Insights panel (collapsible) */}
        {showInsights && (
          <div className={styles.insightsPanel}>
            <InsightsCard />
          </div>
        )}

        {/* Dump Input */}
        <div className={styles.inputSection}>
          <DumpInput />
        </div>

        {/* Feed */}
        <div className={styles.feedSection}>
          <DumpFeed />
        </div>
      </div>

      {/* Right pane — Chat (desktop) */}
      <aside className={styles.chatPane}>
        <ChatPanel />
      </aside>

      {/* Mobile floating chat */}
      <MobileChat />
    </div>
  );
}
