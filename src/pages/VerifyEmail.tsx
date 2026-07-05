import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';

type VerifyState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const uid = useMemo(() => searchParams.get('uid') || '', [searchParams]);
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [state, setState] = useState<VerifyState>({ status: 'idle' });

  useEffect(() => {
    if (!uid || !token) {
      setState({ status: 'error', message: 'Missing verification parameters. Please use the link from your email.' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    api.auth
      .verifyEmail({ uid, token })
      .then((res) => {
        if (cancelled) return;
        setState({ status: 'success', message: res?.message || 'Email verified successfully! You can now log in.' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Email verification failed.';
        setState({ status: 'error', message: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [uid, token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] text-zinc-100 selection:bg-white/20 selection:text-white font-sans p-6">
      <div className="w-full max-w-[420px] space-y-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="h-5 w-5 text-zinc-300" />
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-white">Verify your email</h1>
          <p className="text-zinc-500 text-sm font-light">We’re confirming your email address.</p>
        </div>

        {state.status === 'loading' && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        )}

        {state.status === 'success' && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-300 px-4 py-3 rounded-lg text-sm font-light">
            {state.message}
          </div>
        )}

        {state.status === 'error' && (
          <div className="bg-red-500/5 border border-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm font-light">
            {state.message}
          </div>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full h-11 rounded-xl">
            <Link to="/login">Go to login</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full h-11 bg-transparent border-zinc-800 hover:bg-zinc-900 hover:text-white text-zinc-300 transition-all font-medium rounded-xl"
          >
            <Link to="/">Back to home</Link>
          </Button>
        </div>

        <p className="text-xs text-zinc-600 font-light text-center leading-relaxed">
          If clicking the email link doesn’t work, copy the full URL from the email and paste it into your browser.
        </p>
      </div>
    </div>
  );
}
