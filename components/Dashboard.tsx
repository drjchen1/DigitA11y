import React, { useState, useRef, useEffect } from 'react';
import { ModelType, ThinkingLevelType, MultiFileMode, MathAnnotationStyle, PageProcessingMode } from '../types';
import CapybaraLogo from './CapybaraLogo';
import { 
  Sparkles, 
  Brain, 
  Cpu, 
  Zap, 
  UploadCloud, 
  FileText, 
  HelpCircle, 
  ShieldCheck, 
  Wand2, 
  Camera, 
  ChevronDown, 
  SlidersHorizontal,
  Check,
  Layers,
  List,
  Braces
} from 'lucide-react';
import { createSampleMathNoteFile } from '../utils/sampleData';

interface DashboardProps {
  onFileUpload: (files: File[]) => void;
  isProcessing: boolean;
  onShowDocs: () => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  selectedThinkingLevel: ThinkingLevelType;
  onThinkingLevelChange: (level: ThinkingLevelType) => void;
  mathAnnotationStyle: MathAnnotationStyle;
  onMathAnnotationStyleChange: (style: MathAnnotationStyle) => void;
  pageProcessingMode: PageProcessingMode;
  onPageProcessingModeChange: (mode: PageProcessingMode) => void;
  multiFileMode: MultiFileMode;
  onMultiFileModeChange: (mode: MultiFileMode) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onFileUpload, 
  isProcessing, 
  onShowDocs,
  selectedModel,
  onModelChange,
  selectedThinkingLevel,
  onThinkingLevelChange,
  mathAnnotationStyle,
  onMathAnnotationStyleChange,
  pageProcessingMode,
  onPageProcessingModeChange,
  multiFileMode,
  onMultiFileModeChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [pasteShortcut, setPasteShortcut] = useState('⌘V');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const configPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      setPasteShortcut(isMac ? '⌘V' : 'Ctrl+V');
    }
  }, []);

  // Close settings popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configPopoverRef.current && !configPopoverRef.current.contains(event.target as Node)) {
        setIsConfigOpen(false);
      }
    };
    if (isConfigOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isConfigOpen]);

  // Global paste handler for instant screenshot/image paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const renamedFile = new File([file], `clipboard_snippet_${Date.now()}.png`, { type: file.type });
            pastedFiles.push(renamedFile);
          }
        }
      }

      if (pastedFiles.length > 0) {
        onFileUpload(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isProcessing, onFileUpload]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
    // Reset so selecting the same file again triggers change
    if (event.target) event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing) return;

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const triggerSampleNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    const sampleFile = createSampleMathNoteFile();
    onFileUpload([sampleFile]);
  };

  // Human readable label for the model & thinking pill
  const modelShortName = selectedModel === 'gemini-3.8-flash' ? '3.8 Flash' : selectedModel === 'gemini-3.7-flash' ? '3.7 Flash' : '3.1 Pro';
  const thinkingShortName = {
    'AUTO': 'Auto Reasoning',
    'LOW': 'Fast Thinking',
    'HIGH': 'Deep Reasoning'
  }[selectedThinkingLevel] || 'Auto Reasoning';

  return (
    <div className="flex flex-col items-center justify-center min-h-[78vh] w-full px-3 sm:px-4 py-4 sm:py-6">
      {/* Hidden File Inputs */}
      <input 
        ref={fileInputRef}
        type="file" 
        multiple 
        className="sr-only" 
        accept="application/pdf,image/*,.heic,.heif,.txt" 
        onChange={handleFileChange} 
        disabled={isProcessing} 
        id="file-upload-input"
      />
      <input 
        ref={cameraInputRef}
        type="file" 
        accept="image/*"
        capture="environment"
        className="sr-only" 
        onChange={handleFileChange} 
        disabled={isProcessing} 
        id="camera-upload-input"
      />

      <div className="w-full max-w-xl mx-auto flex flex-col items-center">
        
        {/* 1. Header & Capybara Branding */}
        <div className="flex flex-col items-center mb-5 sm:mb-6 text-center">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-2.5">
            <div className="bg-zinc-950 text-white w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl shadow-md ring-1 ring-zinc-800/10 overflow-hidden shrink-0">
              <CapybaraLogo size={32} className="text-white sm:w-9 sm:h-9" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-950 flex items-center">
              Digit<span className="text-indigo-700 font-bold">A11y</span>
            </h1>
          </div>
          <p className="text-zinc-600 text-xs sm:text-sm md:text-base font-normal max-w-sm px-2 leading-relaxed">
            Convert math notes and handwritten documents into accessible HTML instantly
          </p>
        </div>

        {/* 2. Compact, Mobile-Optimized Model & Reasoning Config Pill */}
        <div className="relative mb-5 z-20" ref={configPopoverRef}>
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-100/90 hover:bg-zinc-200/80 active:bg-zinc-200 border border-zinc-200/80 rounded-full text-xs font-semibold text-zinc-800 shadow-2xs transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
            aria-expanded={isConfigOpen}
            aria-haspopup="dialog"
            id="model-settings-toggle-btn"
          >
            <div className="flex items-center gap-1.5">
              {selectedModel === 'gemini-3.8-flash' || selectedModel === 'gemini-3.7-flash' ? (
                <Zap size={13} className="text-amber-500 fill-amber-500" />
              ) : (
                <Sparkles size={13} className="text-indigo-600 fill-indigo-600" />
              )}
              <span>{modelShortName}</span>
            </div>
            <span className="text-zinc-400 font-normal">·</span>
            <span className="text-zinc-600">{thinkingShortName}</span>
            <span className="text-zinc-400 font-normal">·</span>
            <span className="text-zinc-600">{mathAnnotationStyle === 'visual-underbraces' ? 'Underbraces' : 'Clean Math'}</span>
            <span className="text-zinc-400 font-normal">·</span>
            <span className="text-zinc-600">{pageProcessingMode === 'page-by-page' ? 'Page by page' : 'Bundle 2'}</span>
            <ChevronDown size={13} className={`text-zinc-500 transition-transform duration-200 ${isConfigOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Settings Dropdown Popover / Modal (Touch friendly on mobile) */}
          {isConfigOpen && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[340px] sm:w-[390px] bg-white border border-zinc-200/90 rounded-2xl shadow-xl p-4 text-left z-50 animate-in fade-in zoom-in-95 duration-150"
              role="dialog"
              aria-label="AI Model and Reasoning Settings"
            >
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  <SlidersHorizontal size={13} className="text-indigo-600" />
                  <span>Digitization Engine</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="text-xs text-zinc-600 hover:text-zinc-700 font-medium px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Done
                </button>
              </div>

              {/* Model Choice */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  Gemini Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onModelChange('gemini-3.8-flash')}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedModel === 'gemini-3.8-flash'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600/30'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Zap size={13} className="text-amber-500 fill-amber-500" />
                        <span>3.8 Flash</span>
                      </div>
                      {selectedModel === 'gemini-3.8-flash' && <Check size={13} className="text-indigo-700" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 leading-tight">Recommended · Next-gen speed & vision</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onModelChange('gemini-3.1-pro-preview')}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedModel === 'gemini-3.1-pro-preview'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600/30'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Sparkles size={13} className="text-indigo-600" />
                        <span>3.1 Pro</span>
                      </div>
                      {selectedModel === 'gemini-3.1-pro-preview' && <Check size={13} className="text-indigo-700" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 leading-tight">Max Reasoning · Deep proofs</span>
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-[10px] text-zinc-500">Other models:</span>
                  <button
                    type="button"
                    onClick={() => onModelChange('gemini-3.7-flash')}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all cursor-pointer ${
                      selectedModel === 'gemini-3.7-flash'
                        ? 'bg-indigo-100 text-indigo-800 font-bold'
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                    }`}
                  >
                    {selectedModel === 'gemini-3.7-flash' ? '✓ Using 3.7 Flash' : 'Switch to 3.7 Flash'}
                  </button>
                </div>
              </div>

              {/* Thinking Level Choice */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  Reasoning Budget
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-zinc-100/80 p-1 rounded-xl border border-zinc-200/60">
                  <button
                    type="button"
                    onClick={() => onThinkingLevelChange('AUTO')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      selectedThinkingLevel === 'AUTO'
                        ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/80'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Wand2 size={12} className={selectedThinkingLevel === 'AUTO' ? "text-indigo-600" : "text-zinc-400"} />
                    <span>Auto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onThinkingLevelChange('LOW')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      selectedThinkingLevel === 'LOW'
                        ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/80'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Cpu size={12} className={selectedThinkingLevel === 'LOW' ? "text-indigo-600" : "text-zinc-400"} />
                    <span>Fast</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onThinkingLevelChange('HIGH')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      selectedThinkingLevel === 'HIGH'
                        ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/80'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Brain size={12} className={selectedThinkingLevel === 'HIGH' ? "text-indigo-600" : "text-zinc-400"} />
                    <span>Deep</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5">
                  {selectedThinkingLevel === 'AUTO' && 'Adaptive: Scales reasoning tokens automatically based on note complexity.'}
                  {selectedThinkingLevel === 'LOW' && 'Fast: Minimal reasoning latency for standard notes and lectures.'}
                  {selectedThinkingLevel === 'HIGH' && 'Deep: Extended mathematical verification for complex proofs and diagrams.'}
                </p>
              </div>

              {/* Math Annotation Style Choice */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                    Math Annotation Style
                  </label>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    {mathAnnotationStyle === 'clean-breakdown' ? 'Clean "where:" list' : 'Underbraces'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onMathAnnotationStyleChange('clean-breakdown')}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      mathAnnotationStyle === 'clean-breakdown'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600/30'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <List size={13} className="text-indigo-600" />
                        <span>Clean Breakdown</span>
                      </div>
                      {mathAnnotationStyle === 'clean-breakdown' && <Check size={13} className="text-indigo-700" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 leading-tight">
                      Formulas stay natural & compact; definitions formatted in clean "where:" list below.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onMathAnnotationStyleChange('visual-underbraces')}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      mathAnnotationStyle === 'visual-underbraces'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600/30'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Braces size={13} className="text-indigo-600" />
                        <span>Visual Underbraces</span>
                      </div>
                      {mathAnnotationStyle === 'visual-underbraces' && <Check size={13} className="text-indigo-700" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 leading-tight">
                      Direct LaTeX \underbrace curly brackets positioned under symbols.
                    </span>
                  </button>
                </div>
              </div>

              {/* Page Processing Mode */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                    Page Processing
                  </label>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    {pageProcessingMode === 'page-by-page' ? 'Page by page' : 'Bundle two pages'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onPageProcessingModeChange('page-by-page')}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      pageProcessingMode === 'page-by-page'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600/30'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <FileText size={13} className="text-indigo-600" />
                        <span>Page by page</span>
                      </div>
                      {pageProcessingMode === 'page-by-page' && <Check size={13} className="text-indigo-700" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 leading-tight">
                      Processes 1 page at a time sequentially.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPageProcessingModeChange('bundle-two')}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      pageProcessingMode === 'bundle-two'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600/30'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Layers size={13} className="text-indigo-600" />
                        <span>Bundle two pages</span>
                      </div>
                      {pageProcessingMode === 'bundle-two' && <Check size={13} className="text-indigo-700" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 leading-tight">
                      Bundles two pages at the same time in each call.
                    </span>
                  </button>
                </div>
              </div>

              {/* Multi-File Mode */}
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                    <Layers size={12} className="text-zinc-500" />
                    <span>Multi-File Export</span>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => onMultiFileModeChange('combine')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        multiFileMode === 'combine' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
                      }`}
                    >
                      Single Doc
                    </button>
                    <button
                      type="button"
                      onClick={() => onMultiFileModeChange('separate')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        multiFileMode === 'separate' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
                      }`}
                    >
                      Separate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Streamlined, Tap-Anywhere Main Dropzone */}
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`w-full text-center p-6 sm:p-10 border-2 border-dashed rounded-3xl bg-white transition-all duration-200 shadow-2xs cursor-pointer select-none group focus:outline-none focus:ring-4 focus:ring-indigo-600/20 ${
            isDragging 
              ? 'border-indigo-700 bg-indigo-50/70 scale-[1.01] shadow-xl shadow-indigo-500/10' 
              : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/40 hover:shadow-md'
          }`}
          id="main-dropzone-card"
        >
          <div className="flex flex-col items-center pointer-events-none">
            {/* Upload Icon */}
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 ${
              isDragging 
                ? 'bg-indigo-700 text-white scale-110' 
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 group-hover:scale-105'
            }`}>
              <UploadCloud size={30} className="sm:w-8 sm:h-8" />
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 tracking-tight mb-1.5">
              Drop notes or tap to upload
            </h2>
            
            <p className="text-zinc-600 text-xs sm:text-sm mb-5 max-w-sm px-2 leading-relaxed">
              Upload PDF, handwritten images, or paste screenshots (<kbd className="font-mono text-[10px] bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200 text-zinc-700">{pasteShortcut}</kbd>)
            </p>

            {/* Mobile-Friendly Dual Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-xs pointer-events-auto">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isProcessing}
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
                id="select-files-button"
              >
                <FileText size={16} />
                <span>Browse Files</span>
              </button>

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                disabled={isProcessing}
                className="inline-flex sm:hidden items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-800 font-semibold text-xs rounded-xl border border-zinc-200 transition-all cursor-pointer"
                id="camera-capture-button"
                title="Take a photo with camera"
              >
                <Camera size={16} className="text-zinc-600" />
                <span>Camera</span>
              </button>
            </div>

            {/* Clean, Non-Busy Supported Formats */}
            <div className="mt-5 text-[11px] font-medium text-zinc-600">
              Supports PDF · PNG · JPG · HEIC · TXT
            </div>
          </div>
        </div>

        {/* 4. One-Click "Try Sample" Note */}
        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            onClick={triggerSampleNote}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200/80 border border-indigo-200/60 transition-all duration-150 cursor-pointer shadow-2xs"
            id="try-sample-note-btn"
          >
            <Sparkles size={12} className="text-indigo-600" />
            <span>Try sample math note</span>
          </button>
        </div>

        {/* 5. Clean Footer Links */}
        <div className="mt-6 flex items-center justify-center gap-4 sm:gap-6 text-xs font-semibold text-zinc-600">
          <button 
            type="button"
            onClick={onShowDocs} 
            className="flex items-center gap-1.5 hover:text-indigo-700 transition-colors cursor-pointer bg-transparent border-none p-0"
            id="footer-how-to-use-btn"
          >
            <HelpCircle size={14} />
            <span>How to use</span>
          </button>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <a 
            href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 hover:text-indigo-700 transition-colors"
            id="footer-wcag-link"
          >
            <ShieldCheck size={14} />
            <span>WCAG 2.2 AA Standard</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
