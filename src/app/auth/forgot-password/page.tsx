'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ForgotPasswordForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!identifier) {
      setError('Email or username is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setIsSubmitted(true);
      } else {
        setError(data.message || 'Failed to send reset link');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Check Your Email</h1>
          <p className="text-slate-400">
            We&apos;ve sent a password reset link to the email associated with your account.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
          <p className="text-slate-300 mb-4">
            The link will expire in 24 hours. If you don&apos;t see the email, check your spam folder.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-full h-10 font-semibold"
          >
            Back to Login
          </Button>
          <Button
            onClick={() => {
              setIsSubmitted(false);
              setIdentifier('');
            }}
            variant="outline"
            className="w-full border-slate-700 text-slate-400 hover:text-white rounded-full h-10 font-semibold"
          >
            Try Another Email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Reset Password</h1>
        <p className="text-slate-400">
          Enter your email or username and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs uppercase font-mono text-slate-400">Email or Username</label>
          <Input
            type="text"
            placeholder="user@domain.net or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={isLoading}
            className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-full h-10 font-semibold disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="mt-4 text-center text-slate-400 text-sm">
        Remember your password?{' '}
        <Link href="/auth/login" className="text-white hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
