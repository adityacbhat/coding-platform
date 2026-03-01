import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden relative">
      {/* Animated background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-3xl animate-float-slow" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/15 blur-3xl animate-breathe" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-3xl animate-float" />
        <div className="absolute top-[60%] left-[-5%] w-[300px] h-[300px] rounded-full bg-pink-500/10 blur-3xl animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      <header className="px-8 py-5 flex justify-between items-center border-b border-slate-700/50 glass sticky top-0 z-50 animate-fade-in">
        <span className="text-xl font-bold tracking-tight gradient-text">
          CodePrep
        </span>
        <div className="flex items-center gap-3">
          <Link href="/signin" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors font-medium">
            Sign In
          </Link>
          <Link href="/signup" className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="text-center space-y-8 py-20 px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-sm text-indigo-300 font-medium animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-breathe" />
            Your coding interview companion
          </div>

          <h1 className="text-6xl font-extrabold tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span className="gradient-text animate-gradient bg-[length:200%_200%]">
              Master Your Coding Interview
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Learn patterns, solve problems, and prepare for top tech companies with our structured learning path.
          </p>

          <div className="flex justify-center gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Link
              href="/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started Free
            </Link>
            <Link
              href="/signin"
              className="soft-card hover:bg-slate-700/50 text-slate-200 px-8 py-3.5 rounded-xl font-semibold transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign In
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            {['Pattern-Based Learning', 'Company Questions', 'Visual Debugger', 'Flash Cards', 'Interview Prep'].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 rounded-full bg-slate-800/60 border border-slate-600/50 text-sm text-slate-300 font-medium shadow-sm hover:shadow-md hover:border-violet-500/30 hover:text-violet-400 transition-all cursor-default backdrop-blur-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-slate-500 border-t border-slate-700/50">
        Built for aspiring engineers
      </footer>
    </div>
  );
}
