import React, { RefObject } from 'react';
import { ConversionResult, LayoutMode } from '../types';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-tomorrow.css';

const processHtmlForToC = (html: string, pageIndex: number) => {
  let hIdx = 0;
  // First, add figure IDs
  let processed = html.replace(/data-figure-id="([^"]+)"/g, `data-figure-id="$1" data-page-index="${pageIndex}"`);
  // Next, add TOC ids to headings if missing
  processed = processed.replace(/<(h[1-3])([^>]*)>/gi, (match, tag, attrs) => {
    if (attrs.includes('id=')) return match;
    return `<${tag} id="heading-p${pageIndex}-${hIdx++}"${attrs}>`;
  });
  return processed;
};

interface ResultsContentProps {
  viewMode: 'preview' | 'source';
  layoutMode: LayoutMode;
  results: ConversionResult[];
  activeTab: number;
  showAnnotations: boolean;
  isReadingMode: boolean;
  isProcessing: boolean;
  onReprocessPage: (pageIndex: number) => void;
  onUpdateHtml: (pageIndex: number, html: string) => void;
  setEditingMathPageIndex: (index: number) => void;
  contentRef: RefObject<HTMLDivElement | null>;
  containerMaxWidthClass: string;
  articleClass: string;
  accessibilityStyle: React.CSSProperties;
}

export const ResultsContent: React.FC<ResultsContentProps> = ({
  viewMode,
  layoutMode,
  results,
  activeTab,
  showAnnotations,
  isReadingMode,
  isProcessing,
  onReprocessPage,
  onUpdateHtml,
  setEditingMathPageIndex,
  contentRef,
  containerMaxWidthClass,
  articleClass,
  accessibilityStyle
}) => {
  return (
    <>
      {viewMode === 'preview' ? (
        <div 
          ref={contentRef} 
          className={`w-full transition-all duration-200 ${showAnnotations ? 'show-annotations' : ''} ${
            isReadingMode 
              ? 'bg-transparent p-0 shadow-none border-none rounded-none' 
              : 'bg-[#FDFBF7] p-2 md:p-8 lg:p-12 rounded-3xl shadow-sm border border-zinc-100'
          }`}
        >
           {layoutMode === 'continuous' ? (
             <div className={`space-y-0 ${containerMaxWidthClass} mx-auto`}>
               {results.map((r, i) => (
                 <div key={i} className="relative">
                   {i > 0 && (
                     <div className="flex items-center justify-center my-16 relative no-print">
                       <div className="absolute inset-0 flex items-center" aria-hidden="true">
                         <div className="w-full border-t border-dashed border-zinc-300"></div>
                       </div>
                       <div className="relative flex justify-center items-center gap-3">
                         <span className={`${isReadingMode ? 'bg-transparent text-current font-bold' : 'bg-[#FDFBF7] text-zinc-400'} px-4 text-[10px] font-bold uppercase tracking-widest`}>Page {r.pageNumber}</span>
                         {!isReadingMode && (
                           <div className="flex items-center gap-2">
                             <button onClick={() => setEditingMathPageIndex(i)} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors">
                               EDIT MATH
                             </button>
                             <button 
                               onClick={() => onReprocessPage(i)}
                               disabled={isProcessing}
                               className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-colors disabled:opacity-50"
                               title="Reprocess this page"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                               Reprocess
                             </button>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
                   <span className="sr-only">Original Page {r.pageNumber}</span>
                   <article 
                     className={articleClass}
                     style={accessibilityStyle}
                   >
                     <div dangerouslySetInnerHTML={{ __html: processHtmlForToC(r.html, i) }} />
                   </article>
                 </div>
               ))}
             </div>
           ) : (
             <article 
               className={`${articleClass} mx-auto ${containerMaxWidthClass}`}
               style={accessibilityStyle}
             >
               <div dangerouslySetInnerHTML={{ __html: results[activeTab] ? processHtmlForToC(results[activeTab].html, activeTab) : '' }} />
             </article>
           )}
        </div>
      ) : (
        <div className="font-mono text-[11px] text-zinc-500 bg-zinc-50 p-6 md:p-8 rounded-3xl leading-loose flex flex-col gap-6 w-full">
          {layoutMode === 'continuous' 
            ? results.map((r, i) => (
                <div key={i} className="flex flex-col gap-2 w-full">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Page {r.pageNumber}</div>
                  <div className="w-full bg-[#2d2d2d] rounded-2xl overflow-hidden shadow-inner border border-zinc-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                    <Editor
                      value={r.html}
                      onValueChange={(code) => onUpdateHtml(i, code)}
                      highlight={(code) => Prism.highlight(code, Prism.languages.markup, 'markup')}
                      padding={24}
                      className="font-mono text-[11px] md:text-xs text-white min-h-[300px]"
                      style={{
                        fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                      }}
                    />
                  </div>
                </div>
              ))
            : (
                <div className="w-full bg-[#2d2d2d] rounded-2xl overflow-hidden shadow-inner border border-zinc-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                  <Editor
                    value={results[activeTab]?.html || ''}
                    onValueChange={(code) => onUpdateHtml(activeTab, code)}
                    highlight={(code) => Prism.highlight(code, Prism.languages.markup, 'markup')}
                    padding={24}
                    className="font-mono text-[11px] md:text-xs text-white min-h-[600px]"
                    style={{
                      fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                    }}
                  />
                </div>
            )
          }
        </div>
      )}
    </>
  );
};
