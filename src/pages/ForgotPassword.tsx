import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] text-zinc-100 font-sans p-6 relative">

      <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back to sign in</span>
        </Link>
      </div>

      <div className="w-full max-w-[380px] space-y-8">

        {submitted ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-5 w-5 text-zinc-300" />
              </div>
              <h2 className="text-lg font-medium text-white">Check your email</h2>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">
                If an account exists for{' '}
                <span className="font-medium text-zinc-200">{email}</span>,
                you'll receive a password reset link shortly.
              </p>
            </div>
            <Link to="/login">
              <Button
                variant="outline"
                className="w-full h-11 bg-transparent border-zinc-800 hover:bg-zinc-900 hover:text-white text-zinc-300 transition-all font-medium rounded-xl"
              >
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-medium tracking-tight text-white">Forgot password?</h1>
              <p className="text-zinc-500 text-sm font-light">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in zoom-in-95 duration-500">

              {error && (
                <div className="bg-red-500/5 border border-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-3 font-light">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-zinc-400 ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  className="h-12 bg-transparent border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-0 rounded-xl transition-colors px-4"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 mt-2 bg-white text-black hover:bg-zinc-200 active:scale-[0.98] font-medium text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="w-4 h-4 ml-2 opacity-60" />
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
