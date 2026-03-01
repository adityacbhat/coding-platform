import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm text-slate-200 p-4 shadow-sm border-b border-slate-700">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href={user ? '/dashboard' : '/'}
          className="text-xl font-bold tracking-tight gradient-text"
        >
          CodePrep
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          {user ? (
            <>
              <Link href="/dashboard" className="text-slate-400 hover:text-indigo-400 transition-colors">Dashboard</Link>
              <Link href="/problems" className="text-slate-400 hover:text-indigo-400 transition-colors">Problems</Link>
              <Link href="/concepts" className="text-slate-400 hover:text-indigo-400 transition-colors">Concepts</Link>
              <Link href="/companies" className="text-slate-400 hover:text-indigo-400 transition-colors">Companies</Link>
              <Link href="/playcards" className="text-slate-400 hover:text-indigo-400 transition-colors">Playcards</Link>
              <Link href="/interview" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25">
                Interview Prep
              </Link>
              <span className="text-slate-500 text-xs hidden md:block">{user.email}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/signin" className="text-slate-400 hover:text-indigo-400 transition-colors">Sign In</Link>
              <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
