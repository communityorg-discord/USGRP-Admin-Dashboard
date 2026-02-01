'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthRedirectUrl } from '@/lib/authClient';

export default function LoginPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState('');
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
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

        // Check URL params
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get('error');
        const expiredParam = params.get('expired');
        
        if (expiredParam === '1') {
            setSessionExpired(true);
        }
        if (errorParam) {
            setError(errorParam);
        }

        checkSession();
    }, [router]);

    const handleLogin = () => {
        const returnUrl = 'https://admin.usgrp.xyz';
        window.location.href = getAuthRedirectUrl(returnUrl);
    };

    return (
        <div className="login-page">
            {/* Animated background */}
            <div className="bg-pattern">
                <div className="gradient-orb orb-1" />
                <div className="gradient-orb orb-2" />
                <div className="gradient-orb orb-3" />
            </div>

            <div className="login-container">
                {/* Left side - branding */}
                <div className="brand-side">
                    <div className="brand-content">
                        <div className="logo-mark">
                            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="60" height="60" rx="14" fill="url(#logo-gradient)" />
                                <path d="M20 20V40H26V34H32C36.4183 34 40 30.4183 40 26V20H20ZM26 28V26H34V28C34 29.1046 33.1046 30 32 30H26V28Z" fill="white" fillOpacity="0.9" />
                                <defs>
                                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#3b82f6" />
                                        <stop offset="1" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h1 className="brand-title">USGRP Admin</h1>
                        <p className="brand-subtitle">Government Administration Portal</p>

                        <div className="features">
                            <div className="feature">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <span className="feature-title">Secure Access</span>
                                    <span className="feature-desc">End-to-end encryption</span>
                                </div>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <span className="feature-title">Staff Management</span>
                                    <span className="feature-desc">Full access control</span>
                                </div>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <span className="feature-title">Real-time Analytics</span>
                                    <span className="feature-desc">Monitor everything</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side - login */}
                <div className="login-side">
                    <div className="login-card">
                        <div className="login-header">
                            <h2>Welcome Back</h2>
                            <p>Sign in to access the admin dashboard</p>
                        </div>

                        {/* Alerts */}
                        {sessionExpired && (
                            <div className="alert warning">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <div>
                                    <span className="alert-title">Session Expired</span>
                                    <span className="alert-text">Please sign in again to continue.</span>
                                </div>
                            </div>
                        )}

                        {error && !sessionExpired && (
                            <div className="alert error">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                <div>
                                    <span className="alert-title">Authentication Error</span>
                                    <span className="alert-text">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Login content */}
                        {checking ? (
                            <div className="checking-state">
                                <div className="spinner" />
                                <p>Checking session...</p>
                            </div>
                        ) : (
                            <div className="login-content">
                                <div className="security-notice">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <span>Restricted to authorized USGRP staff only. All access is logged.</span>
                                </div>

                                <button onClick={handleLogin} className="login-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    Sign in with USGRP ID
                                </button>

                                <div className="login-divider">
                                    <span>Protected by</span>
                                </div>

                                <div className="auth-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        <path d="M9 12l2 2 4-4" />
                                    </svg>
                                    <span>USGRP Auth</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="login-footer">
                        <p>© 2026 USGRP Administration • <a href="https://status.usgrp.xyz" target="_blank" rel="noopener">System Status</a></p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0a0a0f;
                    position: relative;
                    overflow: hidden;
                }

                .bg-pattern {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                }

                .gradient-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.4;
                    animation: float 20s infinite;
                }

                .orb-1 {
                    width: 600px;
                    height: 600px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    top: -200px;
                    left: -200px;
                    animation-delay: 0s;
                }

                .orb-2 {
                    width: 500px;
                    height: 500px;
                    background: linear-gradient(135deg, #8b5cf6, #ec4899);
                    bottom: -150px;
                    right: -150px;
                    animation-delay: -7s;
                }

                .orb-3 {
                    width: 300px;
                    height: 300px;
                    background: linear-gradient(135deg, #06b6d4, #3b82f6);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation-delay: -14s;
                }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(30px, -30px) scale(1.05); }
                    50% { transform: translate(-20px, 20px) scale(0.95); }
                    75% { transform: translate(-30px, -20px) scale(1.02); }
                }

                .login-container {
                    display: flex;
                    width: 100%;
                    max-width: 1100px;
                    min-height: 600px;
                    margin: 24px;
                    background: rgba(20, 20, 30, 0.6);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.5);
                    position: relative;
                    z-index: 1;
                }

                .brand-side {
                    flex: 1;
                    padding: 48px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                }

                .brand-content {
                    max-width: 400px;
                }

                .logo-mark {
                    width: 64px;
                    height: 64px;
                    margin-bottom: 24px;
                }

                .logo-mark svg {
                    width: 100%;
                    height: 100%;
                }

                .brand-title {
                    font-size: 32px;
                    font-weight: 800;
                    color: #fff;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.02em;
                }

                .brand-subtitle {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.6);
                    margin: 0 0 40px 0;
                }

                .features {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .feature {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }

                .feature-icon {
                    width: 44px;
                    height: 44px;
                    background: rgba(59, 130, 246, 0.15);
                    border: 1px solid rgba(59, 130, 246, 0.25);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .feature-icon svg {
                    width: 22px;
                    height: 22px;
                    color: #60a5fa;
                }

                .feature-text {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .feature-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #fff;
                }

                .feature-desc {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.5);
                }

                .login-side {
                    flex: 1;
                    padding: 48px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }

                .login-card {
                    width: 100%;
                    max-width: 380px;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .login-header h2 {
                    font-size: 28px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 8px 0;
                }

                .login-header p {
                    font-size: 15px;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0;
                }

                .alert {
                    display: flex;
                    align-items: flex-start;
                    gap: 14px;
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                }

                .alert svg {
                    width: 22px;
                    height: 22px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .alert.warning {
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.25);
                }

                .alert.warning svg {
                    color: #f59e0b;
                }

                .alert.error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.25);
                }

                .alert.error svg {
                    color: #ef4444;
                }

                .alert-title {
                    display: block;
                    font-size: 14px;
                    font-weight: 600;
                    color: #fff;
                    margin-bottom: 2px;
                }

                .alert-text {
                    display: block;
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .checking-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    padding: 40px 0;
                }

                .checking-state p {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(59, 130, 246, 0.2);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .login-content {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .security-notice {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 14px 16px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 10px;
                }

                .security-notice svg {
                    width: 18px;
                    height: 18px;
                    color: rgba(255, 255, 255, 0.4);
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                .security-notice span {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.5);
                    line-height: 1.5;
                }

                .login-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    width: 100%;
                    padding: 16px 24px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
                }

                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
                }

                .login-btn:active {
                    transform: translateY(0);
                }

                .login-btn svg {
                    width: 20px;
                    height: 20px;
                }

                .login-divider {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .login-divider::before,
                .login-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.1);
                }

                .login-divider span {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.3);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .auth-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 12px;
                    background: rgba(16, 185, 129, 0.08);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 10px;
                }

                .auth-badge svg {
                    width: 18px;
                    height: 18px;
                    color: #10b981;
                }

                .auth-badge span {
                    font-size: 14px;
                    font-weight: 600;
                    color: #10b981;
                }

                .login-footer {
                    margin-top: 40px;
                    text-align: center;
                }

                .login-footer p {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.3);
                    margin: 0;
                }

                .login-footer a {
                    color: rgba(255, 255, 255, 0.5);
                    text-decoration: none;
                    transition: color 0.15s;
                }

                .login-footer a:hover {
                    color: #60a5fa;
                }

                @media (max-width: 900px) {
                    .login-container {
                        flex-direction: column;
                        max-width: 480px;
                    }

                    .brand-side {
                        padding: 32px;
                        border-right: none;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }

                    .brand-content {
                        text-align: center;
                        max-width: none;
                    }

                    .logo-mark {
                        margin: 0 auto 20px;
                    }

                    .brand-subtitle {
                        margin-bottom: 24px;
                    }

                    .features {
                        display: none;
                    }

                    .login-side {
                        padding: 32px;
                    }
                }

                @media (max-width: 500px) {
                    .login-container {
                        margin: 16px;
                        border-radius: 20px;
                    }

                    .brand-side,
                    .login-side {
                        padding: 24px;
                    }
                }
            `}</style>
        </div>
    );
}
