'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username) {
      setError('Username is required');
      return;
    }

    // Validate password if provided
    if (formData.password) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          phone: formData.phone,
          password: formData.password || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to complete profile');
      }
    } catch (err: unknown) {
      setError( err instanceof Error ? err.message : 'Failed to complete profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md border border-slate-700 bg-slate-950/50 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-1">
          <div className="text-xs font-mono text-slate-400 mb-2">COSEKE.AUTH</div>
          <CardTitle className="text-3xl font-bold text-white">Complete Your Profile</CardTitle>
          <CardDescription className="text-slate-400">
            Just a few more details to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Display info from Google */}
          <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-4 space-y-2">
            <p className="text-sm text-slate-400">Signed in as</p>
            <p className="text-white font-medium">{session?.user?.name}</p>
            <p className="text-sm text-slate-400">{session?.user?.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase font-mono text-slate-400">Username *</label>
              <Input
                type="text"
                name="username"
                placeholder="your_username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
              />
              <p className="text-xs text-slate-500">
                This will be your unique identifier on the platform
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase font-mono text-slate-400">Phone (Optional)</label>
              <Input
                type="tel"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isLoading}
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            <div className="border-t border-slate-700 pt-4">
              <p className="text-xs uppercase font-mono text-slate-400 mb-3">Security</p>
              
              <div className="space-y-2">
                <label className="text-xs uppercase font-mono text-slate-400">Password (Optional)</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                />
                <p className="text-xs text-slate-500">
                  Leave blank to set password later. Minimum 6 characters.
                </p>
              </div>

              {formData.password && (
                <div className="space-y-2 mt-3">
                  <label className="text-xs uppercase font-mono text-slate-400">Confirm Password *</label>
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
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-full h-10 font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Completing...' : 'Complete Profile'}
            </Button>
          </form>

          <button
            onClick={() => signOut()}
            className="w-full text-sm text-slate-400 hover:text-slate-300 transition-colors py-2"
          >
            Sign out instead
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
