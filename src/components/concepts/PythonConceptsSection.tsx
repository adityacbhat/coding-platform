'use client';

import { useState } from 'react';
import { PYTHON_CONCEPTS, type PythonConcept } from '@/lib/concepts-data';

function PythonConceptCard({ concept, index }: { concept: PythonConcept; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`
        bg-slate-900 border border-slate-800 rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        ${expanded ? 'ring-1 ring-cyan-500/30' : ''}
      `}
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.5 4.5h1v3h-1v-3zm-3.5 3h1v1h-1V7.5zm7 0h1v1h-1V7.5zM8 9.5h8v1H8v-1zm0 2h8v1H8v-1zm0 2h8v1H8v-1zm1 2h6v1H9v-1zm-1-11h1v1H8V4.5zm8 0h1v1h-1V4.5z"/>
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">{concept.title}</h4>
            <p className="text-sm text-slate-400 mt-0.5">{concept.description}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-5 pb-5 space-y-4 border-t border-slate-800/50 pt-5">
          {concept.examples.map((example, i) => (
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
    </div>
  );
}

export default function PythonConceptsSection() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mt-16">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-900 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
            </svg>
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
              General Python Concepts
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Essential Python knowledge for solving coding problems
            </p>
          </div>
        </div>
        <svg
          className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`
          overflow-hidden transition-all duration-500 ease-out
          ${isOpen ? 'max-h-[5000px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}
        `}
      >
        <div className="grid gap-4">
          {PYTHON_CONCEPTS.map((concept, index) => (
            <PythonConceptCard key={concept.slug} concept={concept} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
