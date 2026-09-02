import React, { useState } from 'react';
import { Download, Sparkles, FileCode, Check, X, FileText, Files, User, BookOpen, Edit3 } from 'lucide-react';
import { DocumentMetadata } from '../types';

export type ExportFlavor = 'full' | 'simplified';

interface ExportFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (combine: boolean, flavor: ExportFlavor, stripAnnotations: boolean, customDocTitle?: string) => void;
  defaultTitle: string;
  totalFiles: number;
  totalPages: number;
  initialCombineMode: boolean;
  metadata?: DocumentMetadata;
  onOpenMetadataModal?: () => void;
}

export const ExportFormatModal: React.FC<ExportFormatModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultTitle,
  totalFiles,
  totalPages,
  initialCombineMode,
  metadata,
  onOpenMetadataModal
}) => {
  const [combine, setCombine] = useState<boolean>(initialCombineMode);
  const [flavor, setFlavor] = useState<ExportFlavor>('full');
  const [stripAnnotations, setStripAnnotations] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>(defaultTitle);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(combine, flavor, stripAnnotations, combine ? (docTitle.trim() || defaultTitle) : undefined);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="export-options-title"
    >
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Download size={20} />
            </div>
            <div>
              <h3 id="export-options-title" className="text-base font-bold text-zinc-900 leading-tight">
                Download HTML
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {totalFiles} file{totalFiles > 1 ? 's' : ''} ({totalPages} page{totalPages > 1 ? 's' : ''})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-all cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. HTML Output Flavor Choice */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
              HTML Output Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Full Interactive Document */}
              <button
                type="button"
                onClick={() => setFlavor('full')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  flavor === 'full'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 text-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>Full Interactive</span>
                    </div>
                    {flavor === 'full' && <Check size={14} className="text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-snug">
                    Includes font adjustments, margin notes sidebar, drawing tools, and page navigation.
                  </p>
                </div>
              </button>

              {/* Simplified Clean HTML */}
              <button
                type="button"
                onClick={() => setFlavor('simplified')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  flavor === 'simplified'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 text-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                      <FileCode size={14} className="text-emerald-600" />
                      <span>Simplified HTML</span>
                    </div>
                    {flavor === 'simplified' && <Check size={14} className="text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-snug">
                    Pure converted math HTML with clean styling. No sidebars, buttons, or extra toolbars.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Simplified sub-option: Strip margin notes */}
          {flavor === 'simplified' && (
            <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-zinc-800">
                <input
                  type="checkbox"
                  checked={stripAnnotations}
                  onChange={(e) => setStripAnnotations(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                />
                <span>Also exclude margin notes and callout boxes</span>
              </label>
            </div>
          )}

          {/* Embedded Metadata Banner & Edit Trigger */}
          {metadata && (
            <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                  Embedded Metadata
                </div>
                <div className="text-xs font-bold text-zinc-900 truncate">
                  {metadata.title || 'Untitled'}
                </div>
                {(metadata.author || metadata.subject) && (
                  <div className="text-[11px] text-zinc-500 truncate mt-0.5 flex items-center gap-2">
                    {metadata.author && (
                      <span className="flex items-center gap-1">
                        <User size={11} className="text-zinc-400 shrink-0" />
                        {metadata.author}
                      </span>
                    )}
                    {metadata.subject && (
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} className="text-zinc-400 shrink-0" />
                        {metadata.subject}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {onOpenMetadataModal && (
                <button
                  type="button"
                  onClick={onOpenMetadataModal}
                  className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Edit3 size={12} />
                  <span>Edit Metadata</span>
                </button>
              )}
            </div>
          )}

          {/* 2. Document Batch Mode (if multiple files) */}
          {totalFiles > 1 && (
            <div className="space-y-2 pt-1 border-t border-zinc-100">
              <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                File Organization
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCombine(true)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    combine
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 font-medium'
                  }`}
                >
                  <FileText size={15} className={combine ? "text-indigo-600" : "text-zinc-400"} />
                  <span className="text-xs">Combine 1 File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCombine(false)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    !combine
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 font-medium'
                  }`}
                >
                  <Files size={15} className={!combine ? "text-indigo-600" : "text-zinc-400"} />
                  <span className="text-xs">Separate Files ({totalFiles})</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Document Title Prompt */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-100">
            <label htmlFor="custom-doc-title" className="text-xs font-bold text-zinc-700">
              File Name
            </label>
            <div className="relative">
              <input
                id="custom-doc-title"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Calculus_Lecture_Notes"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
              <span className="absolute right-3 top-2.5 text-zinc-400 text-xs pointer-events-none">
                -acc.html
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Download {flavor === 'simplified' ? 'Simplified HTML' : 'HTML'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportFormatModal;
