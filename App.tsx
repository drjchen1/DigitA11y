import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ProcessingOverlay from './components/ProcessingOverlay';
const ImageEditor = React.lazy(() => import('./components/ImageEditor'));
import Dashboard from './components/Dashboard';
const ResultsView = React.lazy(() => import('./components/ResultsView'));
const AccessibilityAuditReport = React.lazy(() => import('./components/AccessibilityAuditReport'));
const HelpModal = React.lazy(() => import('./components/HelpModal'));
const ResetWarningModal = React.lazy(() => import('./components/ResetWarningModal'));
import ErrorBanner from './components/ErrorBanner';
import Footer from './components/Footer';
import ReadingToolbar from './components/ReadingToolbar';
import { TableOfContents } from './components/TableOfContents';
import { useReadingMode } from './hooks/useReadingMode';
import { useUsageTracking } from "./hooks/useUsageTracking";
import { useProcessingTimer } from "./hooks/useProcessingTimer";
import { useDigitization } from './hooks/useDigitization';
import { ModelType, LayoutMode, MultiFileMode, DocumentMetadata } from './types';
import { generateHtmlDocument } from './utils/exportHtml';
import { generateSimplifiedHtmlDocument } from './utils/exportSimplifiedHtml';
import { stripFileExtension } from './utils/fileName';
const ExportFormatModal = React.lazy(() => import('./components/ExportFormatModal'));
const DocumentMetadataModal = React.lazy(() => import('./components/DocumentMetadataModal'));

const App: React.FC = () => {
  const { sessionRequestCount, dailyRequestCount, incrementUsage } = useUsageTracking();

  const {
    state,
    originalFiles,
    pageMapping,
    handleFileUpload,
    reprocessPage,
    saveEditedFigure,
    updatePageHtml,
    setModel,
    setThinkingLevel,
    setMathAnnotationStyle,
    reset
  } = useDigitization(incrementUsage);

  const { elapsedTime } = useProcessingTimer(state.isProcessing);

  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('paginated');
  const [multiFileMode, setMultiFileMode] = useState<MultiFileMode>('combine');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [customMetadata, setCustomMetadata] = useState<DocumentMetadata | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [editingFigure, setEditingFigure] = useState<{ id: string, src: string, originalSrc: string, alt: string, caption: string, pageIndex: number } | null>(null);

  const {
    isReadingMode,
    setIsReadingMode,
    highContrastTheme,
    setHighContrastTheme,
    textSize,
    setTextSize,
    fontPreference,
    setFontPreference,
    lineHeight,
    setLineHeight
  } = useReadingMode();

  // Compute detected metadata from document content
  const getDetectedMetadata = (): DocumentMetadata => {
    let detectedTitle = 'Mathematics Notes';
    if (state.results.length > 0 && state.results[0]?.html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(state.results[0].html, 'text/html');
      const heading = doc.querySelector('h1, h2, h3');
      if (heading && heading.textContent?.trim()) {
        detectedTitle = heading.textContent.trim();
      }
    }
    if (detectedTitle === 'Mathematics Notes' && originalFiles && originalFiles.length > 0) {
      detectedTitle = stripFileExtension(originalFiles[0].name).replace(/[_-]/g, ' ');
    }

    return {
      title: detectedTitle,
      author: '',
      subject: 'Mathematics & STEM Notes',
      description: `Accessible digitized mathematical notes on ${detectedTitle}.`,
      keywords: 'mathematics, STEM, lecture notes, LaTeX, accessible math',
      institution: '',
      language: 'en',
      copyright: `© ${new Date().getFullYear()} All Rights Reserved`,
      creationDate: new Date().toISOString().split('T')[0]
    };
  };

  const defaultDetectedMetadata = getDetectedMetadata();
  const effectiveMetadata: DocumentMetadata = customMetadata || defaultDetectedMetadata;

  const handleReset = () => {
    if (state.results.length > 0 && !hasDownloaded) {
      setShowResetWarning(true);
    } else {
      performReset();
    }
  };

  const performReset = () => {
    reset();
    setActiveTab(0);
    setViewMode('preview');
    setLayoutMode('paginated');
    setShowAuditReport(false);
    setEditingFigure(null);
    setHasDownloaded(false);
    setShowResetWarning(false);
    setShowExportModal(false);
    setShowMetadataModal(false);
    setCustomMetadata(null);
  };

  const handleEditFigure = (pageIndex: number, figureId: string) => {
    const page = state.results[pageIndex];
    const figure = page.figures.find(f => f.id === figureId);
    if (figure) {
      setEditingFigure({ 
        id: figureId,
        pageIndex, 
        src: figure.currentSrc,
        originalSrc: figure.originalSrc,
        alt: figure.alt,
        caption: figure.caption
      });
    }
  };

  const executeDownload = (
    combine: boolean, 
    flavor: 'full' | 'simplified' = 'full', 
    stripAnnotations: boolean = false, 
    customDocTitle?: string
  ) => {
    if (!originalFiles || originalFiles.length === 0) return;

    if (combine || originalFiles.length === 1) {
      // Clean base file name: strip any trailing extensions (.pdf, .png, .jpg, .html, etc.) safely
      const rawDocName = customDocTitle?.trim() || originalFiles[0].name;
      const baseFileName = stripFileExtension(rawDocName);
      const finalBaseName = baseFileName || `math_notes_${Date.now()}`;
      // Use the actual uploaded file's complete name (with extension) for the relative link
      const exactOriginalFileName = originalFiles[0]?.name || '';
      
      const template = flavor === 'simplified'
        ? generateSimplifiedHtmlDocument(state.results, layoutMode, stripAnnotations, effectiveMetadata)
        : generateHtmlDocument(
            state.results, 
            exactOriginalFileName, 
            layoutMode,
            isReadingMode,
            highContrastTheme,
            textSize,
            fontPreference,
            lineHeight,
            effectiveMetadata
          );
      const blob = new Blob([template], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = flavor === 'simplified' 
        ? `${finalBaseName}-clean.html`
        : `${finalBaseName}-acc.html`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Group results by their original file index for separate downloads
      for (let i = 0; i < originalFiles.length; i++) {
        const fileResults = state.results
          .filter((_, idx) => pageMapping[idx]?.fileIndex === i)
          .map((r, idx) => ({
            ...r,
            pageNumber: idx + 1
          }));
        if (fileResults.length === 0) continue;

        const originalFileName = originalFiles[i].name;
        const baseFileName = stripFileExtension(originalFileName) || `math_notes_${Date.now()}_${i + 1}`;
        const fileMetadata: DocumentMetadata = {
          ...effectiveMetadata,
          title: effectiveMetadata.title !== 'Mathematics Notes' ? `${effectiveMetadata.title} (Part ${i + 1})` : baseFileName
        };
        const template = flavor === 'simplified'
          ? generateSimplifiedHtmlDocument(fileResults, layoutMode, stripAnnotations, fileMetadata)
          : generateHtmlDocument(
              fileResults, 
              originalFileName, 
              layoutMode,
              isReadingMode,
              highContrastTheme,
              textSize,
              fontPreference,
              lineHeight,
              fileMetadata
            );
        const blob = new Blob([template], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = flavor === 'simplified'
          ? `${baseFileName}-clean.html`
          : `${baseFileName}-acc.html`;
        
        // Stagger the downloads slightly to help the browser process multiple files
        setTimeout(() => {
          link.click();
          URL.revokeObjectURL(url);
        }, i * 300);
      }
    }
    setHasDownloaded(true);
  };

  const handleDownloadHtml = () => {
    if (!originalFiles || originalFiles.length === 0) return;
    // Always open the export modal so user can choose between Full Interactive and Simplified HTML
    setShowExportModal(true);
  };

  const themeBgClass = {
    default: 'bg-white text-zinc-900',
    'hc-light': 'bg-white text-black',
    'hc-dark': 'bg-black text-white',
    'hc-yellow': 'bg-black text-[#ffff00]',
    'hc-blue': 'bg-[#ffff00] text-[#000080]',
    'hc-green': 'bg-black text-[#00ff00]'
  }[highContrastTheme] || 'bg-white text-zinc-900';

  const fontClass = `reading-font-${fontPreference}`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isReadingMode ? `${themeBgClass} ${fontClass}` : 'bg-white'}`}>
      {isReadingMode && (
        <ReadingToolbar 
          highContrastTheme={highContrastTheme}
          setHighContrastTheme={setHighContrastTheme}
          textSize={textSize}
          setTextSize={setTextSize}
          fontPreference={fontPreference}
          setFontPreference={setFontPreference}
          lineHeight={lineHeight}
          setLineHeight={setLineHeight}
          onExit={() => setIsReadingMode(false)}
          currentPage={activeTab}
          totalPages={state.results.length}
          onPageChange={setActiveTab}
          layoutMode={layoutMode}
          onDownloadHtml={handleDownloadHtml}
          onToggleToc={() => setIsTocOpen(!isTocOpen)}
        />
      )}

      {(state.results.length > 0 || state.isProcessing) && !isReadingMode && (
        <Header onShowDocs={() => setShowHelp(true)} />
      )}
      
      {state.isProcessing && (
        <ProcessingOverlay 
          progress={state.progress} 
          currentImages={state.currentProcessingImages}
          selectedModel={state.selectedModel}
          actualModelUsed={state.actualModelUsed}
          selectedThinkingLevel={state.selectedThinkingLevel}
          statusMessage={state.statusMessage}
        />
      )}

      {showAuditReport && (
        <Suspense fallback={null}>
          <AccessibilityAuditReport 
          results={state.results}
          activeTab={activeTab}
          state={state}
          onClose={() => setShowAuditReport(false)}
          onUpdateHtml={updatePageHtml}
          onApiCall={incrementUsage}
          sessionRequestCount={sessionRequestCount}
          dailyRequestCount={dailyRequestCount}
        />
        </Suspense>
      )}

      {showHelp && (
        <Suspense fallback={null}>
          <HelpModal onClose={() => setShowHelp(false)} />
        </Suspense>
      )}

      {showResetWarning && (
        <Suspense fallback={null}>
          <ResetWarningModal 
          onCancel={() => setShowResetWarning(false)}
          onConfirm={performReset}
        />
        </Suspense>
      )}

      {showExportModal && originalFiles && originalFiles.length > 0 && (
        <Suspense fallback={null}>
          <ExportFormatModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            onConfirm={(combine, flavor, stripNotes, customTitle) => executeDownload(combine, flavor, stripNotes, customTitle)}
            defaultTitle={stripFileExtension(originalFiles[0].name)}
            totalFiles={originalFiles.length}
            totalPages={state.results.length}
            initialCombineMode={multiFileMode === 'combine'}
            metadata={effectiveMetadata}
            onOpenMetadataModal={() => setShowMetadataModal(true)}
          />
        </Suspense>
      )}

      {showMetadataModal && (
        <Suspense fallback={null}>
          <DocumentMetadataModal
            isOpen={showMetadataModal}
            onClose={() => setShowMetadataModal(false)}
            metadata={effectiveMetadata}
            defaultDetectedMetadata={defaultDetectedMetadata}
            onSave={(updated) => setCustomMetadata(updated)}
          />
        </Suspense>
      )}

      <AnimatePresence>
        {editingFigure && (
          <Suspense fallback={null}>
            <ImageEditor 
            figure={editingFigure}
            onSave={(update) => {
              saveEditedFigure(update);
              setEditingFigure(null);
            }}
            onClose={() => setEditingFigure(null)}
            onApiCall={incrementUsage}
          />
          </Suspense>
        )}
      </AnimatePresence>

      <main className={`flex-1 max-w-[1800px] mx-auto w-full py-8 transition-all duration-200 ${isReadingMode ? 'pt-36 sm:pt-40 md:pt-44 px-4 sm:px-6 lg:px-24' : 'px-4 sm:px-6 lg:px-12'}`} role="main">
        {state.error && (
          <ErrorBanner 
            error={state.error} 
            onClear={() => reset()} 
          />
        )}

        {!state.results.length && !state.isProcessing ? (
          <Dashboard 
            onFileUpload={(files) => handleFileUpload(files, state.selectedModel, state.selectedThinkingLevel, state.mathAnnotationStyle)} 
            isProcessing={state.isProcessing} 
            onShowDocs={() => setShowHelp(true)}
            selectedModel={state.selectedModel}
            onModelChange={setModel}
            selectedThinkingLevel={state.selectedThinkingLevel}
            onThinkingLevelChange={setThinkingLevel}
            mathAnnotationStyle={state.mathAnnotationStyle}
            onMathAnnotationStyleChange={setMathAnnotationStyle}
            multiFileMode={multiFileMode}
            onMultiFileModeChange={setMultiFileMode}
          />
        ) : (
          <Suspense fallback={<div className="flex items-center justify-center p-12 text-zinc-500 text-sm animate-pulse">Loading Results View...</div>}>
          <ResultsView 
            results={state.results}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onEditFigure={handleEditFigure}
            onDownloadHtml={handleDownloadHtml}
            onShowAudit={() => setShowAuditReport(true)}
            onReset={handleReset}
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            onReprocessPage={(index) => reprocessPage(index, state.selectedModel, state.selectedThinkingLevel, state.mathAnnotationStyle)}
            onReprocessAll={() => originalFiles && originalFiles.length > 0 && handleFileUpload(originalFiles, state.selectedModel, state.selectedThinkingLevel, state.mathAnnotationStyle)}
            isProcessing={state.isProcessing}
            onUpdateHtml={updatePageHtml}
            isReadingMode={isReadingMode}
            highContrastTheme={highContrastTheme}
            textSize={textSize}
            fontPreference={fontPreference}
            lineHeight={lineHeight}
            setIsReadingMode={setIsReadingMode}
            onToggleToc={() => setIsTocOpen(!isTocOpen)}
            onOpenMetadataModal={() => setShowMetadataModal(true)}
            mathAnnotationStyle={state.mathAnnotationStyle}
            onMathAnnotationStyleChange={setMathAnnotationStyle}
          />
        </Suspense>
        )}
      </main>

      {state.results.length > 0 && (
        <TableOfContents 
          results={state.results}
          isOpen={isTocOpen}
          onClose={() => setIsTocOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          layoutMode={layoutMode}
        />
      )}

      <Footer isReadingMode={isReadingMode} />
    </div>
  );
};

export default App;

