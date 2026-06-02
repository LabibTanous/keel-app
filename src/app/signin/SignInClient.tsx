'use client';

/**
 * SignInClient.tsx — Returning user sign-in via Keel code (log_token).
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { KeelMark } from '@/components/keel/icons';

export function SignInClient(): React.ReactElement {
  const router = useRouter();
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    const trimmed = code.trim();
    if (!trimmed) { setError('Enter your Keel code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logToken: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Account not found. Check your code.');
        setLoading(false);
        return;
      }
      await signIn('anonymous', { userId: data.userId, redirect: false });
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
    letterSpacing: 0.5,
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
          Enter the Keel code from your profile to sign back in.
        </p>

        <div style={{ marginBottom: 12 }}>
          <div className="smallcaps" style={{ fontSize: 10.5, marginBottom: 7 }}>Your Keel code</div>
          <input
            aria-label="Keel code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            placeholder="e.g. kl_abc123xyz"
            style={inputStyle}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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

        <p style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, textAlign: 'center' }}>
          Find your Keel code in <strong>Profile → Keel code</strong>.
        </p>
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
