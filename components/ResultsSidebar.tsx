import React from 'react';
import { ConversionResult, LayoutMode, AccessibilityAudit } from '../types';

interface ResultsSidebarProps {
  results: ConversionResult[];
  activeTab: number;
  setActiveTab: (index: number) => void;
  layoutMode: LayoutMode;
  activeAudit: AccessibilityAudit | undefined;
  onShowAudit: () => void;
  onDownloadHtml: () => void;
  handlePrint: () => void;
  showAnnotations: boolean;
  setShowAnnotations: (show: boolean) => void;
  onReprocessAll: () => void;
  isProcessing: boolean;
  onReset: () => void;
  onOpenMetadataModal?: () => void;
}

export const ResultsSidebar: React.FC<ResultsSidebarProps> = ({
  results,
  activeTab,
  setActiveTab,
  layoutMode,
  activeAudit,
  onShowAudit,
  onDownloadHtml,
  handlePrint,
  showAnnotations,
  setShowAnnotations,
  onReprocessAll,
  isProcessing,
  onReset,
  onOpenMetadataModal
}) => {
  const currentResult = results[activeTab];
  const tags = currentResult?.semanticTags;

  // Calculate count of margin notes / explanations
  const currentPageMarginNotes = currentResult?.html 
    ? (currentResult.html.match(/class=["'][^"']*(?:auto-annotation|note-box|callout|annotated-note|margin-note)[^"']*["']|<aside[^>]*role=["']note["']/gi)?.length || 0)
    : 0;

  const totalMarginNotes = results.reduce((acc, r) => {
    const matches = (r.html || '').match(/class=["'][^"']*(?:auto-annotation|note-box|callout|annotated-note|margin-note)[^"']*["']|<aside[^>]*role=["']note["']/gi);
    return acc + (matches ? matches.length : 0);
  }, 0);

  const displayMarginNotesCount = layoutMode === 'paginated' ? currentPageMarginNotes : totalMarginNotes;

  return (
    <aside className="w-full xl:w-64 flex-shrink-0 flex flex-col gap-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar pb-8">
      {layoutMode === 'paginated' && (
        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-zinc-900 text-[10px] uppercase tracking-widest">Accessibility</h3>
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeAudit?.score === 100 ? 'bg-zinc-200 text-zinc-700' : 'bg-amber-100 text-amber-700'}`}>
              {activeAudit?.score}% AA
            </div>
          </div>
          
          <div className="mb-4">
            <div className="w-full bg-zinc-200 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${activeAudit?.score === 100 ? 'bg-zinc-500' : 'bg-amber-500'}`}
                style={{ width: `${activeAudit?.score || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            {activeAudit?.checks.map((check, idx) => (
              <div key={idx} className="group relative">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 flex items-center justify-center ${check.passed ? 'bg-zinc-200 text-zinc-600' : 'bg-amber-100 text-amber-600'}`}>
                    {check.passed ? (
                      <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                      <span className="text-[8px] font-bold">!</span>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold leading-tight ${check.passed ? 'text-zinc-500' : 'text-amber-600'}`}>{check.title}</span>
                </div>
                <div className="hidden group-hover:block absolute left-full ml-4 top-0 w-56 p-4 bg-zinc-800 text-white text-[10px] rounded-xl shadow-2xl z-50">
                  <p className="font-bold mb-1">{check.description}</p>
                  {check.suggestion && (
                    <p className="text-amber-300 mt-2 flex items-start gap-1">
                      <span className="font-black">Fix:</span> {check.suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={onShowAudit}
            className="w-full py-2 mb-6 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
          >
            View Full Report
          </button>
        </div>
      )}

      {layoutMode === 'paginated' && tags && (
        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-zinc-900 text-[10px] uppercase tracking-widest">Semantic Structure</h3>
            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
              Page {activeTab + 1}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-white rounded-xl border border-zinc-200/80 flex flex-col">
              <span className="text-[9px] font-medium text-zinc-500">Math Blocks</span>
              <span className="font-bold text-zinc-900 text-xs mt-0.5">{tags.mathExpressionsCount} formulas</span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-zinc-200/80 flex flex-col">
              <span className="text-[9px] font-medium text-zinc-500">Tables</span>
              <span className="font-bold text-zinc-900 text-xs mt-0.5">{tags.tablesCount} semantic</span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-zinc-200/80 flex flex-col">
              <span className="text-[9px] font-medium text-zinc-500">Figures</span>
              <span className="font-bold text-zinc-900 text-xs mt-0.5">{tags.figuresCount} diagrams</span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-zinc-200/80 flex flex-col">
              <span className="text-[9px] font-medium text-zinc-500">Headings</span>
              <span className="font-bold text-zinc-900 text-xs mt-0.5">{tags.headingsCount} structured</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-200/60 space-y-1.5 text-[9px] font-medium text-zinc-600">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${tags.hasAriaLandmarks ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>ARIA Landmark Regions: {tags.hasAriaLandmarks ? 'Active' : 'Missing'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${tags.hasAccessibleTables ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>Table Headers & Scope: {tags.hasAccessibleTables ? 'Compliant' : 'Needs Review'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex-shrink-0">
        <h3 className="font-bold text-zinc-900 mb-4 text-[10px] uppercase tracking-widest">Controls</h3>
        <div className="space-y-2">
           <div className="grid grid-cols-1 gap-2">
             <button onClick={onDownloadHtml} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               Download HTML
             </button>
             <button onClick={handlePrint} title="Use your browser's 'Save as PDF' feature to create a tagged PDF" className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-[10px] font-bold transition-all mb-2 flex items-center justify-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
               Export PDF
             </button>
             {onOpenMetadataModal && (
               <button 
                 onClick={onOpenMetadataModal}
                 title="Edit document properties, author, title, and subject metadata"
                 className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-[10px] font-bold transition-all mb-2 flex items-center justify-center gap-2 cursor-pointer"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13l4 0"/><path d="M10 17l4 0"/></svg>
                 <span>Edit Metadata & Info</span>
               </button>
             )}
             <button 
                onClick={() => setShowAnnotations(!showAnnotations)}
                title="Toggle margin notes, step-by-step breakdowns, and teacher annotations"
                className={`w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-[10px] font-bold transition-all ${showAnnotations ? 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-xs' : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
               <span>{showAnnotations ? `Hide Margin Notes (${displayMarginNotesCount})` : `Margin Notes (${displayMarginNotesCount})`}</span>
             </button>
           </div>
           <button 
              onClick={onReprocessAll}
              disabled={isProcessing}
             className="w-full py-2.5 mt-2 bg-amber-100 text-amber-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
             title="Reprocess all pages to improve quality"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
             Reprocess All
           </button>
           <button 
              onClick={onReset}
              className="w-full py-2.5 mt-4 bg-white border-2 border-zinc-200 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 hover:text-zinc-900 transition-all flex items-center justify-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
             New Document
           </button>
        </div>
      </div>
    </aside>
  );
};
