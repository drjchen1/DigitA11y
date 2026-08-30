import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronRight, List } from 'lucide-react';
import { ConversionResult, LayoutMode } from '../types';

export interface TocItem {
  id: string;
  text: string;
  level: number;
  pageIndex: number;
}

interface TableOfContentsProps {
  results: ConversionResult[];
  isOpen: boolean;
  onClose: () => void;
  activeTab: number;
  setActiveTab: (index: number) => void;
  layoutMode: LayoutMode;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  results,
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  layoutMode
}) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const tocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items: TocItem[] = [];
    results.forEach((r, pageIndex) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(r.html, 'text/html');
      const headings = doc.querySelectorAll('h1, h2, h3');
      let hIdx = 0;
      headings.forEach((h) => {
        let id = h.getAttribute('id');
        if (!id) {
          id = `heading-p${pageIndex}-${hIdx}`;
          hIdx++;
        }
        items.push({
          id,
          text: h.textContent || 'Untitled',
          level: parseInt(h.tagName.substring(1)),
          pageIndex
        });
      });
    });
    setTocItems(items);
  }, [results]);

  useEffect(() => {
    if (isOpen && tocItems.length > 0 && tocRef.current && (window as any).MathJax) {
      // Use setTimeout to ensure DOM is updated before MathJax runs
      setTimeout(() => {
        if (tocRef.current && (window as any).MathJax) {
          try {
            (window as any).MathJax.typesetClear([tocRef.current]);
            (window as any).MathJax.typesetPromise([tocRef.current]).catch((err: any) => {
              console.error('MathJax typesetPromise error in TOC:', err);
            });
          } catch (err) {
            console.error('MathJax error in TOC:', err);
          }
        }
      }, 50);
    }
  }, [isOpen, tocItems]);

  const handleLinkClick = (item: TocItem) => {
    if (layoutMode === 'paginated' && activeTab !== item.pageIndex) {
      setActiveTab(item.pageIndex);
      // Need a small delay to allow React to render the new page
      setTimeout(() => {
        const el = document.getElementById(item.id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const el = document.getElementById(item.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-zinc-200 z-50 flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-zinc-100">
        <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
          <List size={16} className="text-indigo-600" />
          Table of Contents
        </h2>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar" ref={tocRef}>
        {tocItems.length === 0 ? (
          <div className="text-xs text-zinc-500 text-center mt-10">
            No headings found in document.
          </div>
        ) : (
          tocItems.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => handleLinkClick(item)}
              className={`w-full text-left py-1.5 px-2 rounded hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-start gap-2
                ${item.level === 1 ? 'text-sm font-bold text-zinc-800 mt-2' : ''}
                ${item.level === 2 ? 'text-xs font-semibold text-zinc-700 ml-3' : ''}
                ${item.level === 3 ? 'text-[11px] font-medium text-zinc-500 ml-6' : ''}
              `}
            >
              <span className="shrink-0 mt-0.5">
                {item.level === 1 && <ChevronRight size={14} />}
              </span>
              <span className="line-clamp-2">{item.text}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
