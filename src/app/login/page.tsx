'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const urlError = searchParams.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData?.error ?? 'Sai username hoặc mật khẩu');
        return;
      }
      // Small delay to ensure cookie is stored before redirect
      await new Promise((r) => setTimeout(r, 100));
      window.location.replace(callbackUrl);
    } catch {
      setError('Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="w-full max-w-sm p-8 border border-[#30363d] rounded-lg bg-[#161b22]">
        <h1 className="text-2xl font-semibold text-[#22c55e] mb-2 font-mono">
          PRIVATE STOCK RADAR
        </h1>
        <p className="text-[#8b949e] text-sm mb-6">Admin login</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-[#8b949e] mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-[#8b949e] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent"
              required
              autoComplete="current-password"
            />
          </div>
          {(error || urlError === 'session') && (
            <p className="text-red-400 text-sm">{error || 'Phiên đăng nhập hết hạn.'}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#0d1117] font-semibold rounded font-mono transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0d1117]"><p className="text-[#8b949e]">Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
