import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md border-b border-slate-800">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href={user ? '/dashboard' : '/'}
          className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text"
        >
          CodePrep
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link>
              <Link href="/problems" className="hover:text-blue-400 transition-colors">Problems</Link>
              <Link href="/concepts" className="hover:text-blue-400 transition-colors">Concepts</Link>
              <Link href="/companies" className="hover:text-blue-400 transition-colors">Companies</Link>
              <Link href="/playcards" className="hover:text-blue-400 transition-colors">Playcards</Link>
              <Link href="/interview" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                Interview Prep
              </Link>
              <span className="text-slate-500 text-xs hidden md:block">{user.email}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/signin" className="hover:text-blue-400 transition-colors">Sign In</Link>
              <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
