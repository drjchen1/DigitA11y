import React, { useState } from 'react';
import { Download, FileText, Files, X } from 'lucide-react';

interface ExportDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (combine: boolean, customDocTitle?: string) => void;
  defaultTitle: string;
  totalFiles: number;
  totalPages: number;
  initialCombineMode: boolean;
}

export const ExportDialogModal: React.FC<ExportDialogModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultTitle,
  totalFiles,
  totalPages,
  initialCombineMode
}) => {
  const [combine, setCombine] = useState<boolean>(initialCombineMode);
  const [docTitle, setDocTitle] = useState<string>(defaultTitle);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(combine, combine ? (docTitle.trim() || defaultTitle) : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="export-dialog-title">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-zinc-200">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Download size={20} />
            </div>
            <div>
              <h3 id="export-dialog-title" className="text-base font-bold text-zinc-900 leading-tight">
                Export Options
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                {totalFiles} files uploaded ({totalPages} total pages)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-all"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Document Format
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => setCombine(true)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  combine
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                }`}
              >
                <div className={`mt-0.5 p-2 rounded-xl ${combine ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                  <FileText size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold flex items-center gap-2">
                    Combine into 1 Document
                    {combine && <span className="text-[10px] bg-indigo-200 text-indigo-900 font-bold px-1.5 py-0.5 rounded-md">Selected</span>}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Merges all {totalPages} pages into a single accessible HTML file with unified navigation.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCombine(false)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  !combine
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                }`}
              >
                <div className={`mt-0.5 p-2 rounded-xl ${!combine ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                  <Files size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold flex items-center gap-2">
                    Separate Files
                    {!combine && <span className="text-[10px] bg-indigo-200 text-indigo-900 font-bold px-1.5 py-0.5 rounded-md">Selected</span>}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Downloads {totalFiles} separate HTML files corresponding to each original upload.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Prompt Document Title when Combining */}
          {combine && (
            <div className="space-y-1.5 pt-1">
              <label htmlFor="custom-doc-title" className="text-xs font-bold text-zinc-700">
                Document Title / File Name
              </label>
              <div className="relative">
                <input
                  id="custom-doc-title"
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Calculus_Lecture_Notes"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  autoFocus
                />
                <span className="absolute right-3 top-2.5 text-zinc-400 text-xs pointer-events-none">
                  -acc.html
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Will be saved as: <span className="font-mono text-zinc-600 font-semibold">{docTitle.trim() ? docTitle.trim().replace(/\.[^/.]+$/, "") : defaultTitle}-acc.html</span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              Export HTML
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ExportDialogModal;
