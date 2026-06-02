'use client';

/**
 * SignInClient.tsx — Returning user sign-in via email + password.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { KeelMark } from '@/components/keel/icons';

export function SignInClient(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSignIn() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { setError('Enter your email address.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign in failed.');
        setLoading(false);
        return;
      }
      await signIn('email-password', { email: trimmedEmail, password, redirect: false });
      router.push('/dashboard');
    } catch {
      setError('Something went wrong — try again.');
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 13,
    border: '1px solid var(--hairline)',
    background: 'var(--surface)',
    color: 'var(--ink)',
    fontFamily: 'var(--font-ui)',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      data-theme="light"
      style={{
        height: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 480,
        margin: '0 auto',
        padding: '0 24px',
      }}
    >
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push('/')}
        aria-label="Back"
        style={{
          marginTop: 24,
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: 'var(--muted)',
          fontSize: 22,
          lineHeight: 1,
        }}
      >
        ←
      </button>

      {/* Centre */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
          <KeelMark size={26} />
          <span className="serif" style={{ fontSize: 20, color: 'var(--pine)' }}>Keel</span>
        </div>

        <div className="serif" style={{ fontSize: 32, color: 'var(--ink)', letterSpacing: -0.4, marginBottom: 8 }}>
          Welcome back.
        </div>
        <p style={{ margin: '0 0 32px', fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          Sign in with your email and password.
        </p>

        <div style={{ marginBottom: 12 }}>
          <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>Email</div>
          <input
            aria-label="Email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            placeholder="you@example.com"
            style={inputStyle}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>Password</div>
          <input
            aria-label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            placeholder="Your password"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{ fontSize: 13.5, color: 'var(--clay)', marginBottom: 16 }}>{error}</div>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--r-pill)',
            background: loading ? 'var(--pine-soft)' : 'var(--pine)',
            color: loading ? 'var(--pine)' : 'var(--on-pine)',
            border: 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>

      <div style={{ paddingBottom: 40, textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => router.push('/onboarding')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--pine)', fontSize: 14.5, fontWeight: 600,
            fontFamily: 'var(--font-ui)',
          }}
        >
          New to Keel? Get started →
        </button>
      </div>
    </div>
  );
}
