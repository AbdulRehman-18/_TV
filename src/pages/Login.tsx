import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

export function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Check if signup query parameter exists
  useEffect(() => {
    const signupParam = searchParams.get('signup');
    if (signupParam === 'true') {
      setIsLoginMode(false);
    }
  }, [searchParams]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/client'} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.auth.login({
        email,
        password,
      });
      navigate(response?.data?.user?.is_admin ? '/admin' : '/client', { replace: true });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Invalid credentials');
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.auth.register({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
      });

      if (response?.success) {
        setPendingEmail(email);
        setShowEmailConfirmation(true);
        setError('');

        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'An error occurred during sign up');
      } else {
        setError('An error occurred during sign up');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] text-zinc-100 selection:bg-white/20 selection:text-white font-sans p-6 relative">

      {/* Minimalist Back Button */}
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back</span>
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-[380px] space-y-8">

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-medium tracking-tight text-white">
            {isLoginMode ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-zinc-500 text-sm font-light">
            {isLoginMode
              ? 'Enter your credentials to access your workspace.'
              : 'Enter your details to get started.'}
          </p>
        </div>

        {showEmailConfirmation ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-5 w-5 text-zinc-300" />
              </div>
              <h2 className="text-lg font-medium text-white">Check your email</h2>
              <p className="text-sm text-zinc-400 font-light leading-relaxed">
                We sent a verification link to <br />
                <span className="font-medium text-zinc-200">{pendingEmail}</span>
              </p>
              <p className="text-xs text-zinc-600">The link expires in 24 hours.</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 bg-transparent border-zinc-800 hover:bg-zinc-900 hover:text-white text-zinc-300 transition-all font-medium rounded-xl"
              onClick={() => {
                setShowEmailConfirmation(false);
                setPendingEmail('');
                setError('');
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={isLoginMode ? handleLogin : handleSignUp} className="space-y-6 animate-in fade-in zoom-in-95 duration-500">

            {error && (
              <div className="bg-red-500/5 border border-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-3 font-light">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">

              {!isLoginMode && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-medium text-zinc-400 ml-1">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="h-12 bg-transparent border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-0 rounded-xl transition-colors px-4"
                  />
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

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-medium text-zinc-400">Password</Label>
                  {isLoginMode && (
                    <Link to="/forgot-password" className="text-xs text-zinc-500 hover:text-white transition-colors">
                      Forgot password?
                    </Link>
                  )}
                </div>
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

              {!isLoginMode && (
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
              )}

              
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
                  {isLoginMode ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2 opacity-60" />
                </>
              )}
            </Button>


            <div className="text-center pt-4">
              <p className="text-zinc-500 text-sm font-light">
                {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setError('');
                  }}
                  className="text-zinc-200 hover:text-white hover:underline underline-offset-4 font-medium transition-colors ml-1"
                  disabled={isLoading}
                >
                  {isLoginMode ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
