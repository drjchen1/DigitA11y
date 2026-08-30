import React from 'react';

interface ExportPdfModalProps {
  onClose: () => void;
  onOpenPrintable: () => void;
  onDownloadHtml: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  onClose,
  onOpenPrintable,
  onDownloadHtml
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col items-center text-center relative border border-zinc-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-center text-indigo-800 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </div>
        
        <h3 className="text-xl font-extrabold text-zinc-900 mb-2 tracking-tight">Export as Tagged PDF</h3>
        <p className="text-zinc-600 text-xs md:text-sm mb-6 leading-relaxed">
          Export your digitized document as a clean, accessible PDF with high-contrast text and vector math rendering.
        </p>
        <div className="w-full space-y-3 mb-6">
          <button 
            onClick={onOpenPrintable}
            className="w-full py-3.5 px-5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-100 active:scale-[0.99]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open Printable Page in New Tab
          </button>
          <button 
            onClick={onDownloadHtml}
            className="w-full py-3 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download HTML File Instead
          </button>
        </div>
        <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 text-left w-full">
          <div className="flex items-start gap-2.5">
            <span className="text-amber-600 font-bold text-sm">💡</span>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              <strong>How to save as PDF:</strong> In the newly opened page, click the top <strong className="font-bold underline">Print PDF</strong> button (or press <kbd className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded text-[10px] font-mono">Ctrl+P</kbd> / <kbd className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded text-[10px] font-mono">Cmd+P</kbd>), then select <strong>Save as PDF</strong> as your destination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
