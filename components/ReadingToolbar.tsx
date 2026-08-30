import React from 'react';
import { LayoutMode } from '../types';

interface ReadingToolbarProps {
  highContrastTheme: string;
  setHighContrastTheme: (theme: string) => void;
  textSize: number;
  setTextSize: (size: number) => void;
  fontPreference: string;
  setFontPreference: (font: string) => void;
  lineHeight: string;
  setLineHeight: (lineHeight: string) => void;
  onExit: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  layoutMode: LayoutMode;
  onDownloadHtml?: () => void;
  onToggleToc?: () => void;
}

const ReadingToolbar: React.FC<ReadingToolbarProps> = ({
  highContrastTheme,
  setHighContrastTheme,
  textSize,
  setTextSize,
  fontPreference,
  setFontPreference,
  lineHeight,
  setLineHeight,
  onExit,
  currentPage = 0,
  totalPages = 1,
  onPageChange,
  layoutMode,
  onDownloadHtml,
  onToggleToc
}) => {
  const handleIncreaseText = () => {
    setTextSize(Math.min(200, textSize + 25));
  };

  const handleDecreaseText = () => {
    setTextSize(Math.max(100, textSize - 25));
  };

  const handleResetText = () => {
    setTextSize(100);
  };

  const themes = [
    { id: 'default', label: 'Default', bg: 'bg-[#FDFBF7]', text: 'text-[#1E293B]', border: 'border-zinc-300' },
    { id: 'hc-light', label: 'Light (B/W)', bg: 'bg-white', text: 'text-black', border: 'border-black' },
    { id: 'hc-dark', label: 'Dark (W/B)', bg: 'bg-black', text: 'text-white', border: 'border-white' },
    { id: 'hc-yellow', label: 'Yellow', bg: 'bg-black', text: 'text-[#ffff00]', border: 'border-[#ffff00]' },
    { id: 'hc-blue', label: 'Blue/Yellow', bg: 'bg-[#ffff00]', text: 'text-[#000080]', border: 'border-[#000080]' },
    { id: 'hc-green', label: 'Green', bg: 'bg-black', text: 'text-[#00ff00]', border: 'border-[#00ff00]' },
  ];

  const fonts = [
    { id: 'inter', label: 'Inter', desc: 'Clean, versatile, high-legibility geometric sans-serif' },
    { id: 'atkinson', label: 'Atkinson', desc: 'Braille Institute low-vision distinction' },
    { id: 'lexend', label: 'Lexend', desc: 'Engineered for reading fluency' },
    { id: 'opendyslexic', label: 'Dyslexic', desc: 'Weighted bottoms for dyslexia' },
    { id: 'lora', label: 'Lora', desc: 'High-contrast literary serif' },
    { id: 'mono', label: 'Fira Mono', desc: 'Symmetric code monospace' },
  ];

  const themeStyles: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
    default: {
      bg: 'bg-[#FDFBF7]',
      border: 'border-zinc-300',
      text: 'text-zinc-900',
      shadow: 'shadow-md'
    },
    'hc-light': {
      bg: 'bg-white',
      border: 'border-black',
      text: 'text-black',
      shadow: 'shadow-md'
    },
    'hc-dark': {
      bg: 'bg-black',
      border: 'border-zinc-800',
      text: 'text-white',
      shadow: 'shadow-2xl shadow-black/80'
    },
    'hc-yellow': {
      bg: 'bg-black',
      border: 'border-[#ffff00]/60',
      text: 'text-[#ffff00]',
      shadow: 'shadow-2xl shadow-black/80'
    },
    'hc-blue': {
      bg: 'bg-[#ffff00]',
      border: 'border-[#000080]/60',
      text: 'text-[#000080]',
      shadow: 'shadow-md shadow-[#000080]/20'
    },
    'hc-green': {
      bg: 'bg-black',
      border: 'border-[#00ff00]/60',
      text: 'text-[#00ff00]',
      shadow: 'shadow-2xl shadow-black/80'
    }
  };

  const currentStyle = themeStyles[highContrastTheme] || themeStyles.default;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 border-b-2 py-3 px-4 sm:px-6 md:px-8 transition-colors duration-200 ${currentStyle.bg} ${currentStyle.border} ${currentStyle.text} ${currentStyle.shadow}`}
      style={{ opacity: 1 }}
      role="toolbar" 
      aria-label="Reading accessibility settings"
    >
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Section: Reading Mode Badge */}
        <div className="flex items-center justify-between lg:justify-start gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-xs font-black tracking-widest uppercase">Reading View</span>
          </div>
          <span className="text-[10px] uppercase font-bold border px-1.5 py-0.5 rounded opacity-70 no-print" aria-hidden="true">
            ESC to exit
          </span>
        </div>

        {/* Middle Section: All Accessibility Controls */}
        <div className="flex flex-wrap items-center gap-y-4 gap-x-6 text-[11px] sm:text-xs">
          {/* Contrast Toggles */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold uppercase tracking-wider text-[10px] opacity-75">Contrast Theme</span>
            <div className="flex flex-wrap gap-1.5">
              {themes.map((t) => {
                const isActive = highContrastTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setHighContrastTheme(t.id)}
                    className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 transition-all ${t.bg} ${t.text} ${t.border} ${
                      isActive ? 'ring-2 ring-offset-2 ring-indigo-700 scale-105 border-b-4' : 'opacity-80 hover:opacity-100'
                    }`}
                    aria-pressed={isActive}
                    title={`Switch to ${t.label} theme`}
                  >
                    <span className="w-2 h-2 rounded-full border border-zinc-400 bg-current" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-8 w-px bg-current opacity-20 hidden md:block" />

          {/* Text Size Controls */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold uppercase tracking-wider text-[10px] opacity-75">Text Size</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDecreaseText}
                disabled={textSize <= 100}
                className="px-2.5 py-1 rounded border font-black hover:opacity-85 disabled:opacity-40"
                aria-label="Decrease text size"
                title="Decrease text size"
              >
                A-
              </button>
              <button
                onClick={handleResetText}
                className="px-2 py-1 rounded border text-[10px] font-bold hover:opacity-85"
                aria-label="Reset text size"
              >
                {textSize}%
              </button>
              <button
                onClick={handleIncreaseText}
                disabled={textSize >= 200}
                className="px-2.5 py-1 rounded border font-black hover:opacity-85 disabled:opacity-40"
                aria-label="Increase text size"
                title="Increase text size"
              >
                A+
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-current opacity-20 hidden md:block" />

          {/* Font Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold uppercase tracking-wider text-[10px] opacity-75">Dyslexia/Font</span>
            <div className="flex gap-1">
              {fonts.map((f) => {
                const isActive = fontPreference === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      localStorage.setItem('readingFont_user_selected', 'true');
                      setFontPreference(f.id);
                    }}
                    className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${
                      isActive ? 'ring-2 ring-indigo-500 border-b-4 font-black' : 'opacity-80 hover:opacity-100'
                    }`}
                    aria-pressed={isActive}
                    title={f.desc}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-8 w-px bg-current opacity-20 hidden md:block" />

          {/* Spacing Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold uppercase tracking-wider text-[10px] opacity-75">Line Spacing</span>
            <div className="flex gap-1">
              <button
                onClick={() => setLineHeight('normal')}
                className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${
                  lineHeight === 'normal' ? 'ring-2 ring-indigo-500 border-b-4' : 'opacity-85'
                }`}
                aria-pressed={lineHeight === 'normal'}
              >
                Standard
              </button>
              <button
                onClick={() => setLineHeight('extra')}
                className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${
                  lineHeight === 'extra' ? 'ring-2 ring-indigo-500 border-b-4' : 'opacity-85'
                }`}
                aria-pressed={lineHeight === 'extra'}
                title="Double line-height and padded spacing for cognitive ease"
              >
                Extra Space
              </button>
            </div>
          </div>

          {/* Paginated Page Controls (Inline) */}
          {layoutMode === 'paginated' && totalPages > 1 && onPageChange && (
            <>
              <div className="h-8 w-px bg-current opacity-20 hidden md:block" />
              <div className="flex flex-col gap-1.5">
                <span className="font-bold uppercase tracking-wider text-[10px] opacity-75">Document Navigation</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="p-1 px-2 rounded border hover:opacity-85 disabled:opacity-30 transition-opacity"
                    aria-label="Go to previous page"
                  >
                    ← Prev
                  </button>
                  <span className="text-[10px] font-bold px-2">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="p-1 px-2 rounded border hover:opacity-85 disabled:opacity-30 transition-opacity"
                    aria-label="Go to next page"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Section: Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-end">
          {onToggleToc && (
            <button
              onClick={onToggleToc}
              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border-none cursor-pointer shadow-sm transition-all focus:ring-2 focus:ring-indigo-700 focus:outline-none"
              aria-label="Toggle Table of Contents"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              ToC
            </button>
          )}
          {onDownloadHtml && (
            <button
              onClick={onDownloadHtml}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border-none cursor-pointer shadow-sm transition-all focus:ring-2 focus:ring-indigo-700 focus:outline-none"
              aria-label="Download accessible HTML"
              title="Download this document with reading view styles applied"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          )}
          <button
            onClick={onExit}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border-none cursor-pointer shadow-sm transition-all focus:ring-2 focus:ring-rose-500 focus:outline-none"
            aria-label="Exit Reading View and restore full editing interface"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadingToolbar;
