'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
        <div className="w-full max-w-md mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">Password Reset Successful</h1>
            <p className="text-slate-400">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
          </div>

          <Button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-full h-10 font-semibold"
          >
            Go to Login
          </Button>
        </div>
    );
  }

  return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Reset Password</h1>
          <p className="text-slate-400">
            Enter your new password below.
          </p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase font-mono text-slate-400">New Password</label>
            <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
            />
            <p className="text-xs text-slate-500">Minimum 6 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-mono text-slate-400">Confirm Password</label>
            <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
            />
          </div>

          <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-full h-10 font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>

        <div className="mt-4 text-center text-slate-400 text-sm">
          <Link href="/auth/login" className="text-white hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      router.push('/auth/forgot-password');
    }
  }, [token, router]);

  if (!token) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-white">Invalid Link</h1>
              <p className="text-slate-400">
                The password reset link is invalid or has expired.
              </p>
            </div>

            <Link href="/auth/forgot-password">
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-full h-10 font-semibold">
                Request New Link
              </Button>
            </Link>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ResetPasswordForm token={token} />
        </div>
      </div>
  );
}

export default function ResetPasswordPage() {
  return (
      <Suspense
          fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
      >
        <ResetPasswordContent />
      </Suspense>
  );
}