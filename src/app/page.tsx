'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)'
    }}>
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold gradient-text mb-2">USGRP Admin</h1>
          <p className="text-gray-500">Government Utilities Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@usgrp.xyz"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">●</span> Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-500 text-sm">
              Use your <span className="text-cyan-400">mail.usgrp.xyz</span> credentials
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <a href="https://mail.usgrp.xyz" className="text-gray-500 hover:text-cyan-400 transition-colors">
            📧 Webmail
          </a>
          <a href="/appeal" className="text-gray-500 hover:text-cyan-400 transition-colors">
            📝 Submit Appeal
          </a>
        </div>
      </div>
    </div>
  );
}
