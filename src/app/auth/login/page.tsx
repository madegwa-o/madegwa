'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Sign in failed', { description: result.error });
      } else if (result?.ok) {
        toast.success('Welcome back', { description: 'You are now signed in.' });
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      toast.error('Sign in failed', {
        description: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err: unknown) {
      toast.error('Google sign in failed', {
        description: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
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
            <CardTitle className="text-3xl font-bold text-white">Authenticate</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to access your intelligence platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OAuth Buttons */}
            <div className="space-y-3">
              <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                      fill="currentColor"
                      d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.033s2.701-6.033 6.033-6.033c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.969-1.833-4.616-2.955-7.735-2.955-6.329 0-11.45 5.121-11.45 11.45s5.121 11.45 11.45 11.45c6.038 0 11.315-4.949 11.315-11.45 0-0.811-0.101-1.594-0.278-2.354h-11.037z"
                  />
                </svg>
                <span className="text-sm font-medium text-white">Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-slate-950 text-slate-500">Standard Protocol</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
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

              <div className="space-y-2">
                <label className="text-xs uppercase font-mono text-slate-400">Passcode</label>
                <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                />
              </div>

              <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-full h-10 font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Initialize Access'}
              </Button>
            </form>

            {/* Links */}
            <div className="flex flex-col gap-2 text-sm text-slate-400">
              <Link
                  href="/auth/register"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Don&apos;t have an account? Register here
              </Link>
              <Link
                  href="/auth/forgot-password"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}

export default function LoginPage() {
  return (
      <Suspense
          fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
      >
        <LoginForm />
      </Suspense>
  );
}