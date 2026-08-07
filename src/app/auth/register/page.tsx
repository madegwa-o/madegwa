'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const [step, setStep] = useState<'initial' | 'form' | 'verification'>('initial');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.username || !formData.name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Registration failed');
        return;
      }

      setRegisteredEmail(formData.email);
      setStep('verification');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // const handleGoogleRegister = async () => {
  //   setError('');
  //   try {
  //     await signIn('google', { callbackUrl: '/auth/complete-profile' });
  //   } catch (err: any) {
  //     setError(err.message || 'Google registration failed');
  //   }
  // };

  const handleGoogleRegister = async () => {
    setError('');
    try {
      await signIn('google', { callbackUrl: '/auth/complete-profile' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md border border-slate-700 bg-slate-950/50 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-1">
          <div className="text-xs font-mono text-slate-400 mb-2">COSEKE.AUTH</div>
          <CardTitle className="text-3xl font-bold text-white">Register</CardTitle>
          <CardDescription className="text-slate-400">
            Create your intelligence platform account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {step === 'initial' && (
            <div className="space-y-3">
              <button
                onClick={handleGoogleRegister}
                className="w-full rounded-full bg-slate-800 hover:bg-slate-700 h-10 transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.033s2.701-6.033 6.033-6.033c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.969-1.833-4.616-2.955-7.735-2.955-6.329 0-11.45 5.121-11.45 11.45s5.121 11.45 11.45 11.45c6.038 0 11.315-4.949 11.315-11.45 0-0.811-0.101-1.594-0.278-2.354h-11.037z"
                  />
                </svg>
                <span className="text-sm font-medium text-white">Register with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-slate-950 text-slate-500">Or continue with email</span>
                </div>
              </div>

              <Button
                onClick={() => setStep('form')}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-full h-10 font-semibold"
              >
                Email Registration
              </Button>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase font-mono text-slate-400">Name</label>
                <Input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-mono text-slate-400">Username</label>
                <Input
                  type="text"
                  name="username"
                  placeholder="your_username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-mono text-slate-400">Email</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="user@domain.net"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-mono text-slate-400">Password</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase font-mono text-slate-400">Confirm Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setStep('initial')}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 rounded-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          )}

          {step === 'verification' && (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <p className="text-green-200 font-medium mb-2">Check your email!</p>
                <p className="text-sm text-green-100/80">
                  We&apos;ve sent a verification link to <span className="font-semibold">{registeredEmail}</span>
                </p>
              </div>
              <p className="text-sm text-slate-400">
                Click the link in your email to verify your account and complete registration.
              </p>
              <Button
                onClick={() => setStep('initial')}
                variant="outline"
                className="w-full rounded-full border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Back to Registration
              </Button>
            </div>
          )}

          {step !== 'verification' && (
            <div className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
