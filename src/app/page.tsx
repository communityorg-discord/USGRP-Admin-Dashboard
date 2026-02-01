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
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo-icon">
            <span>U</span>
          </div>
          <div className="logo-text">
            <h1>USGRP Admin</h1>
            <p>Secure System Access</p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Content */}
        <div className="login-content">
          {checking ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Verifying secure session...</p>
            </div>
          ) : (
            <>
              <div className="classification-banner">
                <span className="lock-icon">🔒</span>
                RESTRICTED ACCESS
              </div>
              
              <p className="login-desc">
                This system is restricted to authorized USGRP staff only. 
                All actions are monitored and logged.
              </p>

              <button onClick={handleLogin} className="login-btn">
                <span className="btn-icon">🔐</span>
                Authenticate with USGRP ID
              </button>

              <div className="login-footer">
                <p>Protected by USGRP Auth • 2026</p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 24px;
          color: white;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }

        .logo-text h1 {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          line-height: 1.2;
        }

        .logo-text p {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          margin: 0;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 0;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.1);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-state p {
          color: #94a3b8;
          font-size: 14px;
        }

        .classification-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 8px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }

        .lock-icon { font-size: 12px; }

        .login-desc {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 32px;
          text-align: left;
        }

        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .login-btn:active { transform: translateY(0); }

        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 20px;
        }

        .login-footer p {
          font-size: 12px;
          color: #475569;
        }
      `}</style>
    </div>
  );
}
