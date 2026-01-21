'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthRedirectUrl } from '@/lib/authClient';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already logged in
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();

        if (data.authenticated) {
          router.push('/dashboard');
          return;
        }
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setChecking(false);
      }
    }

    // Check URL params for error
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(errorParam);
    }

    checkSession();
  }, [router]);

  const handleLogin = () => {
    // Use hardcoded URL to avoid localhost issues behind nginx
    const returnUrl = 'https://admin.usgrp.xyz';
    window.location.href = getAuthRedirectUrl(returnUrl);
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
            <p>Sign in via USGRP Auth to access the administrative dashboard</p>
          </div>

          <div className="login-form-gov" style={{ textAlign: 'center' }}>
            {error && (
              <div className="login-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {checking ? (
              <div style={{ padding: '2rem' }}>
                <span className="loading-spinner"></span>
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Checking session...</p>
              </div>
            ) : (
              <button onClick={handleLogin} className="btn-login-gov" style={{ width: '100%', marginTop: '1rem' }}>
                <span>🔐</span>
                Sign in with USGRP Auth
              </button>
            )}

            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              You'll be redirected to auth.usgrp.xyz to sign in securely.
            </p>
          </div>

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
