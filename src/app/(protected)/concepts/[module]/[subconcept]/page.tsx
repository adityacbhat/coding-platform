import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getModuleBySlug,
  getSubConceptBySlug,
  getAllModuleSlugs,
  getModuleSubConceptSlugs,
} from '@/lib/concepts-data';
import PatternCard from '@/components/concepts/PatternCard';

export function generateStaticParams() {
  const params: { module: string; subconcept: string }[] = [];
  
  getAllModuleSlugs().forEach((moduleSlug) => {
    getModuleSubConceptSlugs(moduleSlug).forEach((subconceptSlug) => {
      params.push({ module: moduleSlug, subconcept: subconceptSlug });
    });
  });
  
  return params;
}

export default async function SubConceptPage({
  params,
}: {
  params: Promise<{ module: string; subconcept: string }>;
}) {
  const { module: moduleSlug, subconcept: subconceptSlug } = await params;
  
  const module = getModuleBySlug(moduleSlug);
  const subConcept = getSubConceptBySlug(moduleSlug, subconceptSlug);

  if (!module || !subConcept) {
    notFound();
  }

  const currentIndex = module.subConcepts.findIndex((sc) => sc.slug === subconceptSlug);
  const prevSubConcept = currentIndex > 0 ? module.subConcepts[currentIndex - 1] : null;
  const nextSubConcept =
    currentIndex < module.subConcepts.length - 1 ? module.subConcepts[currentIndex + 1] : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/concepts" className="hover:text-blue-400 transition-colors">
          Concepts
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/concepts/${module.slug}`} className="hover:text-blue-400 transition-colors">
          {module.title}
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-300">{subConcept.title}</span>
      </div>

      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-3">{subConcept.title}</h1>
        <p className="text-xl text-slate-400">{subConcept.description}</p>
      </div>

      <div className="bg-gradient-to-r from-blue-900/20 to-slate-900/50 border border-blue-800/30 rounded-xl p-6 mb-10">
        <h2 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {subConcept.pythonExamples ? 'When This Is Useful' : 'When to Use This Pattern'}
        </h2>
        <ul className="space-y-3">
          {subConcept.whenToUse.map((use, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-blue-400 font-semibold">{i + 1}</span>
              </span>
              <span className="leading-relaxed">{use}</span>
            </li>
          ))}
        </ul>
      </div>

      {subConcept.pythonExamples ? (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Code Examples</h2>
          <div className="space-y-6">
            {subConcept.pythonExamples.map((example, i) => (
              <div key={i} className="space-y-2">
                <pre className="bg-slate-950 rounded-lg p-4 border border-slate-800 overflow-x-auto">
                  <code className="text-sm font-mono text-slate-200 leading-relaxed whitespace-pre">
                    {example.code}
                  </code>
                </pre>
                <p className="text-sm text-slate-400 italic pl-1">{example.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Sample Problems</h2>
              <span className="text-sm text-slate-500">
                Click to expand pattern details
              </span>
            </div>

            <div className="space-y-4">
              {subConcept.problems.map((problem, index) => (
                <PatternCard key={problem.title} problem={problem} index={index} />
              ))}
            </div>
          </div>

          {subConcept.problems.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-10">
              <h3 className="text-lg font-semibold text-white mb-4">Key Takeaways</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2">Pattern Recognition</h4>
                  <p className="text-sm text-slate-400">
                    Look for keywords like &quot;{subConcept.problems[0]?.recognitionCues[0]?.replace(/"/g, '')}&quot;
                    in problem statements.
                  </p>
                </div>
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                  <h4 className="text-sm font-semibold text-amber-400 mb-2">First Thought</h4>
                  <p className="text-sm text-slate-400">
                    When you see these cues, immediately think: &quot;{subConcept.title}&quot;
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        {prevSubConcept ? (
          <Link
            href={`/concepts/${module.slug}/${prevSubConcept.slug}`}
            className="group flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="text-left">
              <div className="text-xs text-slate-500">Previous</div>
              <div className="font-medium">{prevSubConcept.title}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextSubConcept ? (
          <Link
            href={`/concepts/${module.slug}/${nextSubConcept.slug}`}
            className="group flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-right"
          >
            <div>
              <div className="text-xs text-slate-500">Next</div>
              <div className="font-medium">{nextSubConcept.title}</div>
            </div>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <Link
            href={`/concepts/${module.slug}`}
            className="group flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-right"
          >
            <div>
              <div className="text-xs text-slate-500">Back to</div>
              <div className="font-medium">{module.title}</div>
            </div>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
