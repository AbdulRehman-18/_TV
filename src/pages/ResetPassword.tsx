import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!uid || !token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] text-zinc-100 font-sans p-6">
        <div className="w-full max-w-[380px] text-center space-y-6">
          <h1 className="text-2xl font-medium text-white">Invalid link</h1>
          <p className="text-zinc-500 text-sm font-light">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password">
            <Button className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-medium rounded-xl">
              Request a new link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword({ uid, token, password, confirm_password: confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
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

        {success ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ArrowRight className="h-5 w-5 text-zinc-300" />
            </div>
            <h2 className="text-lg font-medium text-white">Password reset!</h2>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              Your password has been updated. Redirecting to sign in…
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-medium tracking-tight text-white">Set new password</h1>
              <p className="text-zinc-500 text-sm font-light">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in zoom-in-95 duration-500">

              {error && (
                <div className="bg-red-500/5 border border-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-3 font-light">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium text-zinc-400 ml-1">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-12 bg-transparent border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-0 rounded-xl transition-colors px-4 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-400 ml-1">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-12 bg-transparent border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-0 rounded-xl transition-colors px-4 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
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
                    Reset password
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
