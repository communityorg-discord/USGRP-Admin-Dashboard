'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background Pattern */}
      <div className="login-bg-pattern"></div>

      {/* Government Seal Watermark */}
      <div className="login-watermark">
        <svg viewBox="0 0 100 100" className="seal-svg">
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
          {/* Stars around the edge */}
          {[...Array(13)].map((_, i) => {
            const angle = (i * 360 / 13) * (Math.PI / 180);
            const x = 50 + 45 * Math.cos(angle);
            const y = 50 + 45 * Math.sin(angle);
            return <text key={i} x={x} y={y} fontSize="4" textAnchor="middle" dominantBaseline="middle" fill="currentColor">★</text>;
          })}
          {/* Center eagle silhouette (simplified) */}
          <text x="50" y="50" fontSize="24" textAnchor="middle" dominantBaseline="middle" fill="currentColor">🦅</text>
        </svg>
      </div>

      <div className="login-container-gov">
        {/* Header Banner */}
        <div className="login-banner">
          <div className="banner-stripes">
            <div className="stripe red"></div>
            <div className="stripe white"></div>
            <div className="stripe blue"></div>
          </div>
          <div className="banner-content">
            <div className="gov-shield">
              <span className="shield-icon">🏛️</span>
            </div>
            <div className="gov-title">
              <span className="gov-label">UNITED STATES</span>
              <h1>Government Roleplay</h1>
              <span className="gov-sublabel">Administrative Portal</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card-gov">
          <div className="login-card-header">
            <div className="classification-banner">
              <span>AUTHORIZED ACCESS ONLY</span>
            </div>
            <h2>Staff Authentication</h2>
            <p>Enter your credentials to access the administrative dashboard</p>
          </div>

          <form className="login-form-gov" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label-gov">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <input
                type="email"
                className="form-input-gov"
                placeholder="username@usgrp.xyz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label-gov">
                <span className="label-icon">🔐</span>
                Password
              </label>
              <input
                type="password"
                className="form-input-gov"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="login-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button type="submit" className="btn-login-gov" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Authenticating...
                </>
              ) : (
                <>
                  <span>🔓</span>
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="security-notice">
              <span className="notice-icon">🔒</span>
              <span>This system is for authorized personnel only. All access attempts are logged and monitored.</span>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="login-info">
          <p>© 2026 USGRP Administration • Secure Government Portal</p>
        </div>
      </div>
    </div>
  );
}
