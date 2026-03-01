import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-8 py-5 flex justify-between items-center border-b border-slate-800">
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
          CodePrep
        </span>
        <div className="flex items-center gap-3">
          <Link href="/signin" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
            Sign In
          </Link>
          <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="text-center space-y-6 py-16 px-4 max-w-3xl mx-auto">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
            Master Your Coding Interview
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Learn patterns, solve problems, and prepare for top tech companies with our structured learning path.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/signin"
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-slate-700"
            >
              Sign In
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
