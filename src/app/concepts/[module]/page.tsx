import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getModuleBySlug, getAllModuleSlugs, MODULES } from '@/lib/concepts-data';

export function generateStaticParams() {
  return getAllModuleSlugs().map((module) => ({ module }));
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleSlug } = await params;
  const module = getModuleBySlug(moduleSlug);

  if (!module) {
    notFound();
  }

  const prerequisites = module.dependencies
    .map((dep) => MODULES.find((m) => m.slug === dep))
    .filter(Boolean);

  const isPlaceholder = module.subConcepts.length === 0;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/concepts"
        className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Roadmap
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-4xl font-bold text-white">{module.title}</h1>
          {isPlaceholder && (
            <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-1 rounded border border-amber-800/50">
              Coming Soon
            </span>
          )}
        </div>
        <p className="text-xl text-slate-400">{module.description}</p>
      </div>

      {prerequisites.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Prerequisites
          </h3>
          <div className="flex flex-wrap gap-2">
            {prerequisites.map((prereq) => (
              <Link
                key={prereq!.slug}
                href={`/concepts/${prereq!.slug}`}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors border border-slate-700"
              >
                {prereq!.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {isPlaceholder ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Content Coming Soon</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            We're working on detailed patterns and problems for {module.title}. 
            Check back soon or explore other concepts in the meantime.
          </p>
          <Link
            href="/concepts"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Explore Other Concepts
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Patterns & Techniques</h2>
            <span className="text-sm text-slate-500">
              {module.subConcepts.length} sub-concepts
            </span>
          </div>

          <div className="grid gap-4">
            {module.subConcepts.map((subConcept, index) => (
              <Link
                key={subConcept.slug}
                href={`/concepts/${module.slug}/${subConcept.slug}`}
                className="group block bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all duration-200"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-slate-500 font-mono text-sm">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {subConcept.title}
                      </h3>
                    </div>
                    <p className="text-slate-400 mb-4 pl-9">{subConcept.description}</p>
                    
                    <div className="pl-9">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        When to use
                      </h4>
                      <ul className="space-y-1">
                        {subConcept.whenToUse.slice(0, 2).map((use, i) => (
                          <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-blue-500" />
                            {use}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-500 group-hover:text-blue-400 transition-colors">
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded">
                      {subConcept.problems.length} problems
                    </span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
