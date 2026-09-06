
import React, { useRef, useEffect, useState } from 'react';
import { ConversionResult, LayoutMode, MathAnnotationStyle } from '../types';
import { generateHtmlDocument } from '../utils/exportHtml';
import { MathEditorModal } from "./MathEditorModal";
import { ResultsSidebar } from "./ResultsSidebar";
import { ResultsToolbar } from "./ResultsToolbar";
import { ExportPdfModal } from "./ExportPdfModal";
import { ResultsContent } from "./ResultsContent";

interface ResultsViewProps {
  results: ConversionResult[];
  activeTab: number;
  setActiveTab: (index: number) => void;
  viewMode: 'preview' | 'source';
  setViewMode: (mode: 'preview' | 'source') => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  onEditFigure: (pageIndex: number, figureId: string) => void;
  onDownloadHtml: () => void;
  onShowAudit: () => void;
  onReset: () => void;
  onReprocessPage: (pageIndex: number) => void;
  onReprocessAll: () => void;
  isProcessing: boolean;
  onUpdateHtml: (pageIndex: number, html: string) => void;
  isReadingMode?: boolean;
  highContrastTheme?: string;
  textSize?: number;
  fontPreference?: string;
  lineHeight?: string;
  setIsReadingMode?: (val: boolean) => void;
  onToggleToc?: () => void;
  onOpenMetadataModal?: () => void;
  mathAnnotationStyle?: MathAnnotationStyle;
  onMathAnnotationStyleChange?: (style: MathAnnotationStyle) => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  layoutMode,
  setLayoutMode,
  onEditFigure,
  onDownloadHtml,
  onShowAudit,
  onReset,
  onReprocessPage,
  onReprocessAll,
  isProcessing,
  onUpdateHtml,
  isReadingMode = false,
  highContrastTheme = 'default',
  textSize = 100,
  fontPreference = 'inter',
  lineHeight = 'normal',
  setIsReadingMode,
  onToggleToc,
  onOpenMetadataModal,
  mathAnnotationStyle = 'clean-breakdown',
  onMathAnnotationStyleChange
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);
  const [editingMathPageIndex, setEditingMathPageIndex] = useState<number | null>(null);
  const activeAudit = results[activeTab]?.audit;

  const openPrintableTab = () => {
    const htmlContent = generateHtmlDocument(
      results,
      '',
      layoutMode,
      isReadingMode,
      highContrastTheme,
      textSize,
      fontPreference,
      lineHeight
    );
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  };

  const handlePrint = () => {
    openPrintableTab();
    setShowExportPdfModal(true);
  };

  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;

    if (results.length > 0 && contentRef.current) {
      const element = contentRef.current;

      const triggerTypeset = (target?: HTMLElement) => {
        const el = target || element;
        if (window.MathJax) {
          try {
            window.MathJax.typesetClear([el]);
            window.MathJax.typesetPromise([el]).catch(err => {
              console.error('MathJax typesetPromise error:', err);
            });
          } catch (err) {
            console.error('MathJax error:', err);
          }
        }
      };

      if (window.MathJax) {
        triggerTypeset();
      } else {
        checkInterval = setInterval(() => {
          if (window.MathJax && contentRef.current) {
            triggerTypeset();
            if (checkInterval) clearInterval(checkInterval);
          }
        }, 100);

        setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval);
        }, 3000);
      }

      const editButtons = element.querySelectorAll('.edit-figure-btn');
      const handleEditClick = (e: Event) => {
        const figureId = (e.currentTarget as HTMLElement).getAttribute('data-figure-id');
        const pageIdx = (e.currentTarget as HTMLElement).getAttribute('data-page-index');
        if (figureId) {
          onEditFigure(pageIdx ? parseInt(pageIdx) : activeTab, figureId);
        }
      };
      editButtons.forEach(btn => {
        btn.addEventListener('click', handleEditClick);
      });

      // Re-typeset math when details/summary (e.g. Show Details) is expanded
      const detailsList = element.querySelectorAll('details');
      const handleDetailsToggle = (e: Event) => {
        const detailsEl = e.currentTarget as HTMLDetailsElement;
        if (detailsEl && detailsEl.open) {
          triggerTypeset(detailsEl);
        }
      };
      detailsList.forEach(details => {
        details.addEventListener('toggle', handleDetailsToggle);
      });

      return () => {
        if (checkInterval) clearInterval(checkInterval);
        editButtons.forEach(btn => {
          btn.removeEventListener('click', handleEditClick);
        });
        detailsList.forEach(details => {
          details.removeEventListener('toggle', handleDetailsToggle);
        });
      };
    }
  }, [results, activeTab, viewMode, layoutMode, showAnnotations, onEditFigure]);

  // Determine if the current document is landscape
  const isLandscape = results.length > 0 && results[0].width > results[0].height;
  const containerMaxWidthClass = isLandscape ? "max-w-6xl" : "max-w-4xl";

  const articleClass = isReadingMode
    ? `math-content overflow-x-auto p-4 md:p-8 lg:p-12 rounded-2xl transition-all ${
        highContrastTheme === 'default' 
          ? 'bg-white shadow-md border border-zinc-100' 
          : 'bg-transparent border-none'
      }`
    : 'math-content overflow-x-auto bg-white p-4 md:p-8 lg:p-12 rounded-2xl shadow-md border border-zinc-100';

  const getReadingFontFamily = (font: string) => {
    switch (font) {
      case 'atkinson': return "'Atkinson Hyperlegible', sans-serif";
      case 'lexend': return "'Lexend', sans-serif";
      case 'opendyslexic': return "'OpenDyslexic', sans-serif";
      case 'lora': return "'Lora', serif";
      case 'mono': return "'Fira Code', monospace";
      case 'inter':
      case 'sans':
      default: return "'Inter', sans-serif";
    }
  };

  const accessibilityStyle = isReadingMode ? {
    fontSize: `${textSize}%`,
    lineHeight: lineHeight === 'extra' ? '2.2' : '1.7',
    letterSpacing: lineHeight === 'extra' ? '0.05em' : 'normal',
    fontFamily: getReadingFontFamily(fontPreference)
  } : {};

  return (
    <div className={`flex flex-col-reverse xl:flex-row gap-8 items-start ${isReadingMode ? 'justify-center w-full' : ''}`}>
      {!isReadingMode && (
        <ResultsSidebar
          results={results}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          layoutMode={layoutMode}
          activeAudit={activeAudit}
          onShowAudit={onShowAudit}
          onDownloadHtml={onDownloadHtml}
          handlePrint={handlePrint}
          showAnnotations={showAnnotations}
          setShowAnnotations={setShowAnnotations}
          onReprocessAll={onReprocessAll}
          isProcessing={isProcessing}
          onReset={onReset}
          onOpenMetadataModal={onOpenMetadataModal}
          mathAnnotationStyle={mathAnnotationStyle}
          onMathAnnotationStyleChange={onMathAnnotationStyleChange}
        />
      )}

      <div className={`flex-1 w-full flex flex-col ${isReadingMode ? 'max-w-4xl mx-auto' : ''}`}>
        <div className="w-full max-w-none">
          {!isReadingMode && (
            <ResultsToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              layoutMode={layoutMode}
              setLayoutMode={setLayoutMode}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setEditingMathPageIndex={setEditingMathPageIndex}
              setIsReadingMode={setIsReadingMode}
              resultsLength={results.length}
              currentPageNumber={results[activeTab]?.pageNumber || 1}
              onReprocessPage={onReprocessPage}
              isProcessing={isProcessing}
              onDownloadHtml={onDownloadHtml}
              onReset={onReset}
              onToggleToc={onToggleToc}
              onOpenMetadataModal={onOpenMetadataModal}
              mathAnnotationStyle={mathAnnotationStyle}
              onMathAnnotationStyleChange={onMathAnnotationStyleChange}
            />
          )}

          <div className={isReadingMode ? 'min-h-[600px] pb-16' : 'min-h-[800px] pb-32'}>
            <ResultsContent
              viewMode={viewMode}
              layoutMode={layoutMode}
              results={results}
              activeTab={activeTab}
              showAnnotations={showAnnotations}
              isReadingMode={isReadingMode}
              isProcessing={isProcessing}
              onReprocessPage={onReprocessPage}
              onUpdateHtml={onUpdateHtml}
              setEditingMathPageIndex={setEditingMathPageIndex}
              contentRef={contentRef}
              containerMaxWidthClass={containerMaxWidthClass}
              articleClass={articleClass}
              accessibilityStyle={accessibilityStyle}
            />
          </div>
        </div>
      </div>

      {editingMathPageIndex !== null && (
        <MathEditorModal 
          initialHtml={results[editingMathPageIndex]?.html || ""}
          onSave={(newHtml) => { onUpdateHtml(editingMathPageIndex, newHtml); setEditingMathPageIndex(null); }}
          onClose={() => setEditingMathPageIndex(null)}
        />
      )}
      {showExportPdfModal && (
        <ExportPdfModal 
          onClose={() => setShowExportPdfModal(false)}
          onOpenPrintable={openPrintableTab}
          onDownloadHtml={onDownloadHtml}
        />
      )}
    </div>
  );
};

export default ResultsView;
