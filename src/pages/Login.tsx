import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import loginImage from './assets/images/login.jpg';

export function Login() {
  const { user, loading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        phone_number: phoneNumber,
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
      setPhoneNumber('');
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
    <div className="min-h-screen h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Left Section - Illustration & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {/* Logo area with actual image */}
          <img 
            src={loginImage} 
            alt="Wava AI Login Illustration" 
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden h-screen">
        <div className="w-full max-w-sm max-h-screen overflow-y-auto">
          {/* Welcome Text - Desktop and Mobile */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">
              {isLoginMode ? 'Welcome back' : 'Hey there'}
            </h1>
            <p className="text-slate-400">
              {isLoginMode ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {showEmailConfirmation ? (
            // Email Confirmation Screen
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Check your email</h2>
                <p className="text-sm text-slate-400 mb-4">
                  We've sent a confirmation link to:
                </p>
                <p className="text-sm font-mono bg-slate-950 p-3 rounded-lg text-blue-400 break-all">
                  {pendingEmail}
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong>Please verify your email</strong> to complete your account setup.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-slate-900 border-slate-800 hover:bg-slate-800"
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
            // Login/Signup Form
            <form onSubmit={isLoginMode ? handleLogin : handleSignUp} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {!isLoginMode && (
                <>
                  <div>
                    <Label htmlFor="name" className="text-slate-300 mb-2 block">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="your name"
                      required
                      className="bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber" className="text-slate-300 mb-2 block">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 00000000"
                      required
                      className="bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="organization" className="text-slate-300 mb-2 block">Organization</Label>
                    <Input
                      id="organization"
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Your Company"
                      required
                      className="bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email" className="text-slate-300 mb-2 block">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isLoginMode ? 'your@email.com' : 'your@email.com'}
                  required
                  className="bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-300 mb-2 block">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {!isLoginMode && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-slate-300 mb-2 block">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className="bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    {isLoginMode ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLoginMode ? 'Continue with Email' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-950 text-slate-400">or</span>
                </div>
              </div>

              <Button
                type="button"
                className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-colors"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError('');
                }}
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.852v3.608h5.337c-0.676,2.537-2.921,4.3-5.337,4.3c-3.288,0-5.953-2.664-5.953-5.952 c0-3.287,2.665-5.952,5.953-5.952c1.574,0,2.954,0.585,4.041,1.537l2.693-2.589C15.737,2.737,14.146,1.5,12.545,1.5 c-5.848,0-10.545,4.697-10.545,10.545c0,5.848,4.697,10.545,10.545,10.545c5.143,0,9.634-3.625,10.386-8.817h0.024V12.41 H12.545z" />
                </svg>
                Continue with Google
              </Button>

              <p className="text-center text-slate-400 text-sm mt-4">
                {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setError('');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
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
