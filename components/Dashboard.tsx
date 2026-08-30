
import React, { useState } from 'react';
import { ModelType, ThinkingLevelType, MultiFileMode } from '../types';
import CapybaraLogo from './CapybaraLogo';
import { Sparkles, Brain, Cpu, Zap, UploadCloud, FileText, HelpCircle, ShieldCheck, Wand2 } from 'lucide-react';

interface DashboardProps {
  onFileUpload: (files: File[]) => void;
  isProcessing: boolean;
  onShowDocs: () => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  selectedThinkingLevel: ThinkingLevelType;
  onThinkingLevelChange: (level: ThinkingLevelType) => void;
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
  multiFileMode,
  onMultiFileModeChange
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[82vh] w-full px-4 py-6">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        
        {/* 1. Header & Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-zinc-950 text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg ring-1 ring-zinc-800/10 overflow-hidden">
              <CapybaraLogo size={36} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-950 flex items-center">
              Digit<span className="text-indigo-700 font-bold">A11y</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-sm md:text-base font-medium max-w-sm">
            Convert math notes & handwritten documents into accessible HTML instantly
          </p>
        </div>

        {/* 2. Model & Thinking Controls (Clean, Minimalist Single Bar) */}
        <div className="w-full bg-zinc-100/70 p-1.5 rounded-2xl border border-zinc-200/70 mb-6 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
          {/* Model Switcher */}
          <div className="flex items-center w-full sm:w-auto bg-white/90 p-0.5 rounded-xl border border-zinc-200/60 shadow-xs">
            <button
              onClick={() => onModelChange('gemini-3.7-flash')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedModel === 'gemini-3.7-flash' 
                  ? 'bg-zinc-900 text-white shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
              }`}
            >
              <Zap size={13} className={selectedModel === 'gemini-3.7-flash' ? "text-amber-400 fill-amber-400" : "text-zinc-400"} />
              <span>3.7 Flash</span>
            </button>
            <button
              onClick={() => onModelChange('gemini-3.1-pro-preview')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedModel === 'gemini-3.1-pro-preview' 
                  ? 'bg-zinc-900 text-white shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
              }`}
            >
              <Sparkles size={13} className={selectedModel === 'gemini-3.1-pro-preview' ? "text-zinc-200 fill-zinc-200" : "text-zinc-400"} />
              <span>3.1 Pro</span>
            </button>
          </div>

          {/* Thinking Level Switcher (Slate/Zinc Monochromatic Palette) */}
          <div className="flex items-center w-full sm:w-auto bg-white/90 p-0.5 rounded-xl border border-zinc-200/60 shadow-xs" role="group" aria-label="Thinking Depth Mode">
            <button
              onClick={() => onThinkingLevelChange('AUTO')}
              title="Adaptive Mode: Dynamically scales reasoning tokens up when dense math or complex tables are detected, staying fast for simple notes."
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedThinkingLevel === 'AUTO' 
                  ? 'bg-zinc-900 text-white shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
              }`}
            >
              <Wand2 size={12} className={selectedThinkingLevel === 'AUTO' ? "text-zinc-200" : "text-zinc-400"} />
              <span>Auto (Adaptive)</span>
            </button>
            <button
              onClick={() => onThinkingLevelChange('LOW')}
              title="Fast Thinking: Fixed low thinking budget (~1k tokens) for rapid, standard notes transcription."
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedThinkingLevel === 'LOW' 
                  ? 'bg-zinc-900 text-white shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
              }`}
            >
              <Cpu size={12} className={selectedThinkingLevel === 'LOW' ? "text-zinc-200" : "text-zinc-400"} />
              <span>Fast</span>
            </button>
            <button
              onClick={() => onThinkingLevelChange('HIGH')}
              title="Deep Thinking: High reasoning budget for multi-step proofs, complex systems, and intensive mathematical verification."
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedThinkingLevel === 'HIGH' 
                  ? 'bg-zinc-900 text-white shadow-xs' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
              }`}
            >
              <Brain size={12} className={selectedThinkingLevel === 'HIGH' ? "text-zinc-200" : "text-zinc-400"} />
              <span>Deep</span>
            </button>
          </div>
        </div>

        {/* 3. Zen Focal Dropzone Card */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full text-center p-8 sm:p-12 border-2 border-dashed rounded-3xl bg-white transition-all duration-200 shadow-sm ${
            isDragging 
              ? 'border-indigo-700 bg-indigo-50/70 scale-[1.01] shadow-xl shadow-indigo-500/10' 
              : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
          }`}
        >
          <div className="flex flex-col items-center">
            {/* Upload Icon Circle */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200 ${
              isDragging ? 'bg-indigo-700 text-white scale-110' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              <UploadCloud size={32} />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mb-2">
              Drop notes or documents here
            </h2>
            <p className="text-zinc-500 text-sm mb-6 max-w-sm">
              Upload images or PDFs to convert math formulas, diagrams, and text into accessible MathML & HTML.
            </p>

            {/* Upload Button */}
            <label className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer group">
              <FileText size={18} className="group-hover:scale-110 transition-transform" />
              <span>Select Files</span>
              <input 
                type="file" 
                multiple 
                className="sr-only" 
                accept="application/pdf,image/*,.heic,.heif,.txt" 
                onChange={handleFileChange} 
                disabled={isProcessing} 
              />
            </label>

            {/* Supported Format Badges */}
            <div className="flex items-center justify-center gap-2 mt-6 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
              <span className="px-2 py-0.5 bg-zinc-100 rounded-md">PDF</span>
              <span className="px-2 py-0.5 bg-zinc-100 rounded-md">PNG / JPG</span>
              <span className="px-2 py-0.5 bg-zinc-100 rounded-md">HEIC</span>
              <span className="px-2 py-0.5 bg-zinc-100 rounded-md">TXT</span>
            </div>
          </div>
        </div>

        {/* 4. Bottom Footer Bar */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs font-semibold text-zinc-600">
          <button 
            onClick={onShowDocs} 
            className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <HelpCircle size={14} />
            <span>How to use</span>
          </button>
          <span className="text-zinc-300">•</span>
          <a 
            href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
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
