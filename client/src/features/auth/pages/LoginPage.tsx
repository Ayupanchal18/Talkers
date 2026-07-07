import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, AlertCircle, Video, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Spinner } from '@/shared/components/Loading';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, setError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // Error is stored in auth store
    }
  };

  return (
    <div className="auth-root">
      {/* ── Left panel ── */}
      <div className="auth-left">
        {/* Animated orbs */}
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-left-content">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Video size={22} className="text-white" />
            </div>
            <span className="auth-logo-text">Vidss</span>
          </div>

          {/* Hero copy */}
          <div className="auth-hero">
            <h2 className="auth-hero-title">
              Connect with anyone,<br />anywhere.
            </h2>
            <p className="auth-hero-sub">
              HD video calls, screen sharing, and real-time collaboration — all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div className="auth-pills">
            {['🎥 HD Video Calls', '🖥 Screen Sharing', '⚡ Instant Join'].map((f) => (
              <span key={f} className="auth-pill">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Mobile logo */}
          <div className="auth-logo auth-logo-mobile">
            <div className="auth-logo-icon">
              <Video size={18} className="text-white" />
            </div>
            <span className="auth-logo-text">Vidss</span>
          </div>

          <div className="auth-card-header">
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-sub">Sign in to your Vidss account</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <Mail size={15} className="auth-input-icon" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className="auth-input"
                  id="login-email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <Lock size={15} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="auth-input auth-input-password"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-eye-btn"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="auth-submit-btn"
              id="login-submit"
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            Don&apos;t have an account?{' '}
            <Link to="/register" state={{ from }} className="auth-link">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
