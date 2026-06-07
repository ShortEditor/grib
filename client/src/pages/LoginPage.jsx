import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = mode === 'login'
      ? await login(email, password)
      : await register(email, password, name);
    if (result.success) navigate('/');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearError();
  };

  return (
    <div className={styles.page}>
      {/* Background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.container}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logo}>G</div>
          <h1 className={styles.brandName}>GRIB</h1>
          <p className={styles.tagline}>Your brain, dumped. Your AI, trained on you.</p>
        </div>

        {/* Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              {mode === 'login' ? 'Welcome back' : 'Start dumping'}
            </h2>
            <p className={styles.cardSubtitle}>
              {mode === 'login' ? 'Sign in to your second brain' : 'Create your GRIB account'}
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} id="auth-form">
            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name-input">Name (optional)</label>
                <input
                  id="name-input"
                  className="input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should GRIB call you?"
                  autoComplete="name"
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email-input">Email</label>
              <input
                id="email-input"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password-input">Password</label>
              <input
                id="password-input"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className={styles.errorBox} id="auth-error">
                ⚠️ {error}
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                mode === 'login' ? 'Sign In →' : 'Create Account →'
              )}
            </button>
          </form>

          <div className={styles.toggle}>
            <span>{mode === 'login' ? "Don't have an account?" : 'Already have one?'}</span>
            <button
              className={styles.toggleBtn}
              onClick={switchMode}
              id="auth-mode-toggle"
              type="button"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </div>
        </div>

        <p className={styles.footer}>dump everything. forget nothing.</p>
      </div>
    </div>
  );
}
