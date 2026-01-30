import React, { useState, useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import loginImage from './assets/images/login.jpg';

export function Login() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Check if signup query parameter exists
  useEffect(() => {
    const signupParam = searchParams.get('signup');
    if (signupParam === 'true') {
      setIsLoginMode(false);
    }
  }, [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'An error occurred during login');
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

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Create client profile
      const { error: profileError } = await supabase.from('clients').insert({
        id: authData.user.id,
        name,
        email,
        organization,
        is_approved: false,
      });

      if (profileError) throw profileError;

      // Show email confirmation screen
      setPendingEmail(email);
      setShowEmailConfirmation(true);
      setError('');

      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setOrganization('');
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
    <div className="h-screen w-full flex bg-black text-white selection:bg-zinc-800 selection:text-white overflow-hidden">
      {/* Left Section - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <img
          src={loginImage}
          alt="Login Visual"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute bottom-0 left-0 p-16 z-20 max-w-2xl">
          <h2 className="text-4xl font-bold mb-6 tracking-tight text-white">
            Experience the future of digital signage.
          </h2>
          <p className="text-zinc-300 text-lg leading-relaxed">
            Seamlessly manage your content, schedule displays, and engage your audience with our powerful platform.
          </p>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-black relative">
        {/* Back Button */}
        <div className="absolute top-8 left-8 sm:left-12 lg:left-16">
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isLoginMode ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {isLoginMode ? 'Enter your credentials to access your account.' : 'Fill in your details to get started.'}
            </p>
          </div>

          {showEmailConfirmation ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-zinc-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Check your email</h2>
                <p className="text-sm text-zinc-400 mb-6">
                  We've sent a confirmation link to:
                </p>
                <div className="bg-black border border-zinc-800 rounded-lg p-3 mb-6">
                  <p className="text-sm font-mono text-zinc-300 break-all">
                    {pendingEmail}
                  </p>
                </div>
                <p className="text-xs text-zinc-500">
                  Please verify your email to complete registration.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-transparent border-zinc-800 hover:bg-zinc-900 text-white"
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setPendingEmail('');
                  setError('');
                }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={isLoginMode ? handleLogin : handleSignUp} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {!isLoginMode && (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-zinc-400">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          required
                          className="bg-zinc-900/50 border-zinc-800 focus:border-zinc-600 focus:ring-zinc-600/20 h-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="bg-zinc-900/50 border-zinc-800 focus:border-zinc-600 focus:ring-zinc-600/20 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-zinc-400">Password</Label>
                    {isLoginMode && (
                      <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="bg-zinc-900/50 border-zinc-800 focus:border-zinc-600 focus:ring-zinc-600/20 h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isLoginMode && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-zinc-400">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className="bg-zinc-900/50 border-zinc-800 focus:border-zinc-600 focus:ring-zinc-600/20 h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-medium text-base transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLoginMode ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-2 text-zinc-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-10 bg-transparent border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                }}
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.852v3.608h5.337c-0.676,2.537-2.921,4.3-5.337,4.3c-3.288,0-5.953-2.664-5.953-5.952 c0-3.287,2.665-5.952,5.953-5.952c1.574,0,2.954,0.585,4.041,1.537l2.693-2.589C15.737,2.737,14.146,1.5,12.545,1.5 c-5.848,0-10.545,4.697-10.545,10.545c0,5.848,4.697,10.545,10.545,10.545c5.143,0,9.634-3.625,10.386-8.817h0.024V12.41 H12.545z" />
                </svg>
                Google
              </Button>

              <p className="text-center text-zinc-500 text-sm">
                {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setError('');
                  }}
                  className="text-white hover:underline font-medium transition-all"
                  disabled={isLoading}
                >
                  {isLoginMode ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
