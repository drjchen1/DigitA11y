const fs = require('fs');
let code = fs.readFileSync('components/ResultsView.tsx', 'utf8');
const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes('{results.map((r, i) => ('));
const endIndex = lines.findIndex(l => l.includes(') : ('));
if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `                     {results.map((r, i) => (
                       <div key={i} className="relative">
                         {i > 0 && (
                           <div className="flex items-center justify-center my-16 relative no-print">
                             <div className="absolute inset-0 flex items-center" aria-hidden="true">
                               <div className="w-full border-t border-dashed border-zinc-300"></div>
                             </div>
                             <div className="relative flex justify-center items-center gap-3">
                               <span className={\`\${isReadingMode ? 'bg-transparent text-current font-bold' : 'bg-[#FDFBF7] text-zinc-400'} px-4 text-[10px] font-bold uppercase tracking-widest\`}>Page {r.pageNumber}</span>
                               {!isReadingMode && (
                                 <div className="flex items-center gap-2">
                                   <button onClick={() => setEditingMathPageIndex(i)} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors">
                                     EDIT MATH
                                   </button>
                                   <button 
                                     onClick={() => onReprocessPage(r.pageNumber - 1)}
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
                           <div dangerouslySetInnerHTML={{ __html: r.html.replace(/data-figure-id="([^"]+)"/g, \`data-figure-id="$1" data-page-index="\${i}"\`) }} />
                         </article>
                       </div>
                     ))}
                   </div>`;
  // The ')' before ' : (' is actually on a line by itself, let's just find the exact slice to replace
  // endindex is the line with ') : ('
  
  // Actually, I'll just replace startIndex to endIndex - 1. Wait, there is a `</div>` before `) : (`.
  // The structure is:
  /*
                   <div className={`space-y-0 ${containerMaxWidthClass} mx-auto`}>
                     {results.map((r, i) => (
                        ...
                     ))}
                   </div>
                 ) : (
  */
  // So I'll replace everything between `<div className={\`space-y-0 \${containerMaxWidthClass} mx-auto\`}>` and `</div>`
}
