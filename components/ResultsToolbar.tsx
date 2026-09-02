import React, { useState, useRef, useEffect } from 'react';
import { LayoutMode } from '../types';
import { 
  Eye, 
  Code, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Sparkles, 
  Download, 
  RotateCw, 
  ChevronDown, 
  Check,
  FileText,
  List
} from 'lucide-react';

interface ResultsToolbarProps {
  viewMode: 'preview' | 'source';
  setViewMode: (mode: 'preview' | 'source') => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  activeTab: number;
  setActiveTab: (index: number) => void;
  setEditingMathPageIndex: (index: number | null) => void;
  setIsReadingMode?: (val: boolean) => void;
  resultsLength: number;
  currentPageNumber: number;
  onReprocessPage: (pageIndex: number) => void;
  isProcessing: boolean;
  onDownloadHtml: () => void;
  onReset: () => void;
  onToggleToc?: () => void;
  onOpenMetadataModal?: () => void;
}

export const ResultsToolbar: React.FC<ResultsToolbarProps> = ({
  viewMode,
  setViewMode,
  layoutMode,
  setLayoutMode,
  activeTab,
  setActiveTab,
  setEditingMathPageIndex,
  setIsReadingMode,
  resultsLength,
  currentPageNumber,
  onReprocessPage,
  isProcessing,
  onDownloadHtml,
  onReset,
  onToggleToc,
  onOpenMetadataModal
}) => {
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    };
    if (pageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pageDropdownOpen]);

  // Keyboard navigation for paginated mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input, textarea, or editor
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (layoutMode === 'paginated' && resultsLength > 1) {
        if (e.key === 'ArrowLeft' && activeTab > 0) {
          e.preventDefault();
          setActiveTab(activeTab - 1);
        } else if (e.key === 'ArrowRight' && activeTab < resultsLength - 1) {
          e.preventDefault();
          setActiveTab(activeTab + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layoutMode, resultsLength, activeTab, setActiveTab]);

  return (
    <div className="sticky top-16 z-30 mb-6 bg-white/95 backdrop-blur-md border border-zinc-200/80 rounded-2xl px-3 py-2 shadow-xs transition-all overflow-visible">
      <div className="flex items-center justify-between gap-2 py-0.5 relative overflow-visible">
        
        {/* ================= ZONE 1: DOCUMENT TOOLS & VIEWS (LEFT) ================= */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Segmented View Mode: Preview vs Source */}
          <div className="flex items-center bg-zinc-100/90 p-0.5 rounded-xl border border-zinc-200/60" role="group" aria-label="View Mode">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
              title="Rendered Math Preview"
            >
              <Eye size={13} className={viewMode === 'preview' ? 'text-indigo-600' : 'text-zinc-400'} />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('source')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'source'
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
              title="Inspect HTML Source"
            >
              <Code size={13} className={viewMode === 'source' ? 'text-indigo-600' : 'text-zinc-400'} />
              <span>Source</span>
            </button>
          </div>

          <div className="w-px h-4 bg-zinc-200 mx-0.5 hidden sm:block" />

          {/* Math Editor Trigger */}
          <button
            onClick={() => setEditingMathPageIndex(activeTab)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-indigo-900 bg-zinc-50 hover:bg-indigo-50/70 border border-zinc-200/80 hover:border-indigo-200 rounded-xl transition-all shadow-2xs"
            title="Open visual Math & LaTeX editor"
          >
            <Sparkles size={13} className="text-indigo-600" />
            <span className="hidden md:inline">Math Editor</span>
            <span className="md:hidden">Math</span>
          </button>

          {/* Reading View Trigger */}
          {setIsReadingMode && (
            <button
              onClick={() => setIsReadingMode(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-indigo-900 bg-zinc-50 hover:bg-indigo-50/70 border border-zinc-200/80 hover:border-indigo-200 rounded-xl transition-all shadow-2xs"
              title="Enter distraction-free Reading View"
            >
              <BookOpen size={13} className="text-zinc-600" />
              <span className="hidden md:inline">Reading View</span>
              <span className="md:hidden">Read</span>
            </button>
          )}

          {/* Table of Contents Trigger */}
          {onToggleToc && (
            <button
              onClick={onToggleToc}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-indigo-900 bg-zinc-50 hover:bg-indigo-50/70 border border-zinc-200/80 hover:border-indigo-200 rounded-xl transition-all shadow-2xs"
              title="Toggle Table of Contents"
            >
              <List size={13} className="text-zinc-600" />
              <span className="hidden md:inline">Contents</span>
              <span className="md:hidden">ToC</span>
            </button>
          )}

          {/* Document Properties & Metadata Trigger */}
          {onOpenMetadataModal && (
            <button
              onClick={onOpenMetadataModal}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-indigo-900 bg-zinc-50 hover:bg-indigo-50/70 border border-zinc-200/80 hover:border-indigo-200 rounded-xl transition-all shadow-2xs"
              title="Edit document properties & metadata (Author, Title, Subject)"
            >
              <FileText size={13} className="text-indigo-600" />
              <span className="hidden lg:inline">Properties</span>
              <span className="lg:hidden">Info</span>
            </button>
          )}
        </div>

        {/* ================= ZONE 2: CENTER PAGINATION & FLOW (CENTER) ================= */}
        <div className="flex items-center gap-1.5 shrink-0 justify-center">
          {/* Segmented Flow: Pages vs Scroll */}
          <div className="flex items-center bg-zinc-100/90 p-0.5 rounded-xl border border-zinc-200/60" role="group" aria-label="Layout Flow Mode">
            <button
              onClick={() => setLayoutMode('paginated')}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                layoutMode === 'paginated'
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
              title="Paginated Mode"
            >
              Pages
            </button>
            <button
              onClick={() => setLayoutMode('continuous')}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                layoutMode === 'continuous'
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
              title="Continuous Scroll Mode"
            >
              Scroll
            </button>
          </div>

          {/* Pagination Controls */}
          {layoutMode === 'paginated' && (
            <div className="flex items-center bg-white border border-zinc-200/80 rounded-xl p-0.5 shadow-2xs relative" ref={dropdownRef}>
              <button
                onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
                disabled={activeTab === 0}
                className="p-1 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                title="Previous Page (Left Arrow)"
                aria-label="Previous Page"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Jump-to-page trigger button */}
              {resultsLength > 1 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPageDropdownOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-1 px-1.5 py-1 text-xs font-bold text-zinc-800 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                  title="Click to jump to any page"
                  aria-expanded={pageDropdownOpen}
                  aria-haspopup="listbox"
                >
                  <span>{activeTab + 1} / {resultsLength}</span>
                  <ChevronDown size={11} className={`text-zinc-400 transition-transform duration-150 ${pageDropdownOpen ? 'rotate-180 text-zinc-700' : ''}`} />
                </button>
              ) : (
                <span className="px-1.5 py-1 text-xs font-bold text-zinc-800 whitespace-nowrap">
                  1 / 1
                </span>
              )}

              <button
                onClick={() => setActiveTab(Math.min(resultsLength - 1, activeTab + 1))}
                disabled={activeTab === resultsLength - 1}
                className="p-1 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                title="Next Page (Right Arrow)"
                aria-label="Next Page"
              >
                <ChevronRight size={15} />
              </button>

              {/* Reprocess Icon Pill attached right to page nav */}
              <div className="w-px h-3.5 bg-zinc-200 mx-0.5" />
              <button
                onClick={() => onReprocessPage(currentPageNumber - 1)}
                disabled={isProcessing}
                className="p-1 rounded-lg text-amber-700 hover:bg-amber-50 disabled:opacity-40 transition-all"
                title="Reprocess this page with AI"
                aria-label="Reprocess page"
              >
                <RotateCw size={13} className={isProcessing ? "animate-spin text-amber-600" : ""} />
              </button>

              {/* Jump-to-page Popover Menu */}
              {pageDropdownOpen && resultsLength > 1 && (
                <div 
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-white rounded-xl shadow-2xl border border-zinc-200/90 p-1.5 z-50 ring-1 ring-black/5"
                  style={{ minWidth: '180px' }}
                >
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2.5 py-1 mb-1 border-b border-zinc-100 flex items-center justify-between">
                    <span>Jump to Page</span>
                    <span className="text-[10px] text-zinc-400 font-normal">{resultsLength} total</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {Array.from({ length: resultsLength }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActiveTab(idx);
                          setPageDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          activeTab === idx 
                            ? 'bg-zinc-900 text-white font-bold shadow-xs' 
                            : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FileText size={13} className={activeTab === idx ? 'text-white' : 'text-zinc-400'} />
                          Page {idx + 1}
                        </span>
                        {activeTab === idx && <Check size={13} className="text-white shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= ZONE 3: PRIMARY ACTION (RIGHT) ================= */}
        <div className="flex items-center gap-1.5 shrink-0 justify-end">
          <button
            onClick={onDownloadHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs whitespace-nowrap cursor-pointer"
            title="Download accessible standalone HTML"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Download HTML</span>
            <span className="sm:hidden">Download</span>
          </button>
        </div>

      </div>
    </div>
  );
};
