import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <section className="text-center space-y-6 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
          Master Your Coding Interview
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Learn patterns, solve problems, and prepare for top tech companies with our structured learning path.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/concepts"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Learning
          </Link>
          <Link
            href="/problems"
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-slate-700"
          >
            Practice Problems
          </Link>
        </div>
      </section>
    </div>
  );
}
