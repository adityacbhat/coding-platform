'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If a session is returned immediately, email confirmation is disabled — redirect to dashboard
    if (data.session) {
      router.push('/dashboard');
      router.refresh();
      return;
    }

    // Otherwise, user needs to confirm their email
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Check your email</h2>
            <p className="text-slate-400 text-sm">
              We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
              Click the link to activate your account and sign in.
            </p>
            <Link href="/signin" className="inline-block text-blue-400 hover:text-blue-300 text-sm font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Create an account</h1>
            <p className="text-slate-400 mt-1 text-sm">Start your coding interview prep today</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-rose-400 text-sm bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/signin" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
