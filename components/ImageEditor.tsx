import React, { useState, useRef, useEffect } from 'react';
import { X, Pencil, Save, RotateCcw, Download, Sparkles, Loader2, CheckCircle2, Eraser, Sigma, Wand2, Sliders, Eye, RefreshCw, Palette, Layers, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { describeFigure } from '../services/geminiService';
import { refineDiagramWithGemini, RefinementPreset } from '../services/imageService';
import { formatMathInText } from '../utils/dom';

interface FigureToEdit {
  id: string;
  src: string;
  originalSrc: string;
  alt: string;
  caption: string;
  pageIndex: number;
}

interface ImageEditorProps {
  figure: FigureToEdit;
  onSave: (update: { figureId: string, pageIndex: number, newSrc: string, newAlt?: string, newCaption?: string }) => void;
  onClose: () => void;
  onApiCall?: (tokens?: number) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ figure, onSave, onClose, onApiCall }) => {
  const [color, setColor] = useState('#CEB888');
  const [mode, setMode] = useState<'view' | 'draw' | 'erase' | 'accessibility' | 'ai-refine'>('view');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);
  
  // AI Refinement states
  const [selectedPreset, setSelectedPreset] = useState<RefinementPreset>('vector');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinedImage, setRefinedImage] = useState<string | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [comparisonPos, setComparisonPos] = useState<number>(50);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const altPreviewRef = useRef<HTMLDivElement>(null);
  const captionTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [altText, setAltText] = useState<string>(figure.alt);
  const [captionText, setCaptionText] = useState<string>(figure.caption || "Figure");
  const [editedSrc, setEditedSrc] = useState<string | null>(null);

  useEffect(() => {
    setAltText(figure.alt);
    setCaptionText(figure.caption || "Figure");
  }, [figure]);

  useEffect(() => {
    renderCanvas();
  }, [editedSrc, figure]);

  useEffect(() => {
    if (mode === 'accessibility' && altPreviewRef.current) {
      const element = altPreviewRef.current;
      const timer = setTimeout(() => {
        if (window.MathJax) {
          try {
            window.MathJax.typesetClear([element]);
            window.MathJax.typesetPromise([element]).catch(err => {
              console.error('MathJax typesetPromise error:', err);
            });
          } catch (err) {
            console.error('MathJax error:', err);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mode, captionText]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = editedSrc || figure.src;
  };

  const handleRefineDiagram = async () => {
    setIsRefining(true);
    setRefineError(null);
    try {
      const base64Input = editedSrc || figure.src;
      const result = await refineDiagramWithGemini(base64Input, {
        preset: selectedPreset,
        customPrompt: customPrompt,
        model: 'gemini-3.1-flash-lite-image'
      });
      
      if (result.tokenCount && onApiCall) {
        onApiCall(result.tokenCount);
      }
      
      setRefinedImage(result.imageUrl);
      setShowComparison(true);
    } catch (err: any) {
      console.error('AI refinement error:', err);
      setRefineError(err.message || 'Failed to refine diagram with Gemini. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleApplyRefinedImage = () => {
    if (refinedImage) {
      setEditedSrc(refinedImage);
      setRefinedImage(null);
      setShowComparison(false);
      setMode('view');
    }
  };

  const handleRegenerateDescription = async () => {
    setIsDescribing(true);
    try {
      const srcToUse = editedSrc || figure.src;
      const { alt: newDescription, caption: newCaption, tokenCount } = await describeFigure(srcToUse);
      onApiCall?.(tokenCount);
      setAltText(newDescription);
      setCaptionText(newCaption);
    } catch (error) {
      console.error('Description regeneration failed:', error);
      alert('Failed to regenerate description. Please try again.');
    } finally {
      setIsDescribing(false);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'draw' && mode !== 'erase') return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          setEditedSrc(canvas.toDataURL('image/png'));
        }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || (mode !== 'draw' && mode !== 'erase')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = mode === 'erase' ? 20 : 3;
    ctx.lineCap = 'round';
    
    if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = async () => {
    const src = editedSrc || figure.src;
    onSave({
      figureId: figure.id,
      pageIndex: figure.pageIndex,
      newSrc: src,
      newAlt: altText,
      newCaption: captionText
    });
    onClose();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `edited-figure-${figure.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleResetFigure = () => {
    setEditedSrc(null);
    setRefinedImage(null);
    setShowComparison(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-md p-0 lg:p-8"
    >
      <div className="bg-white w-full max-w-7xl h-full lg:h-[95vh] lg:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-700 text-white p-2 rounded-xl">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                Figure & Diagram Studio
              </h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                Touch up, annotate, and AI-refine vector diagrams
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Sidebar Controls */}
          <div className="w-full lg:w-80 bg-zinc-50 border-r border-zinc-100 p-6 space-y-6 overflow-y-auto">
            <section>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Modes & Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { setMode('view'); handleResetFigure(); }}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all ${mode === 'view' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Reset</span>
                </button>
                <button 
                  onClick={() => setMode('ai-refine')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all relative ${mode === 'ai-refine' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-indigo-900 border border-indigo-200 hover:border-indigo-400 font-bold'}`}
                >
                  <Wand2 className="w-4 h-4 text-amber-500" />
                  <span className="text-[9px] font-bold">AI Refine</span>
                </button>
                <button 
                  onClick={() => setMode('draw')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all ${mode === 'draw' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                >
                  <Pencil className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Draw</span>
                </button>
                <button 
                  onClick={() => setMode('erase')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all ${mode === 'erase' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                >
                  <Eraser className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Erase</span>
                </button>
                <button 
                  onClick={() => setMode('accessibility')}
                  className={`col-span-2 p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'accessibility' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Alt Text & Captions</span>
                </button>
              </div>
            </section>

            {/* AI Refine Panel */}
            {mode === 'ai-refine' && (
              <section className="space-y-4">
                <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-900 font-black text-xs mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Gemini 3.1 Flash Lite Image</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-relaxed">
                    Clean up blurred or handwritten scans into crisp, high-contrast, accessible diagrams.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Style Preset</label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'vector', title: '🎨 Vector Line-Art', desc: 'Crisp vector lines on clean white canvas' },
                      { id: 'high-contrast', title: '⚡ High-Contrast Clean', desc: 'Removes background smudges & texture' },
                      { id: 'accessible-color', title: '🎯 Color-Blind Friendly', desc: 'Distinct high-contrast palette & dash patterns' },
                      { id: 'dark-mode', title: '🌙 Dark Mode Diagram', desc: 'Inverted glowing vectors on dark canvas' },
                      { id: 'custom', title: '💬 Custom Prompt', desc: 'Specify custom instructions for Gemini' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPreset(p.id as RefinementPreset)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${selectedPreset === p.id ? 'bg-indigo-700 text-white border-indigo-700 shadow-md' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'}`}
                      >
                        <div className="font-bold text-[11px]">{p.title}</div>
                        <div className={`text-[9px] mt-0.5 ${selectedPreset === p.id ? 'text-indigo-100' : 'text-zinc-500'}`}>{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPreset === 'custom' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-700">Custom Enhancement Prompt</label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g. Make all axes thicker, label the origin (0,0), and use bright blue for the parabola..."
                      className="w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 transition-all font-sans text-zinc-900 min-h-[70px]"
                    />
                  </div>
                )}

                {refineError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-700 font-semibold">
                    {refineError}
                  </div>
                )}

                <button
                  onClick={handleRefineDiagram}
                  disabled={isRefining}
                  className="w-full py-3.5 bg-indigo-700 text-white font-bold text-xs rounded-xl hover:bg-indigo-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Refining Diagram...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-amber-300" />
                      <span>Generate Refined Diagram</span>
                    </>
                  )}
                </button>
              </section>
            )}

            {mode === 'draw' && (
              <section>
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Colors</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['#CEB888', '#ef4444', '#78716c', '#f59e0b', '#000000', '#ffffff', '#ec4899', '#8b5cf6'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${color === c ? 'border-zinc-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </section>
            )}

            {mode === 'accessibility' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Accessibility (Alt Text)</h3>
                  <button 
                    onClick={handleRegenerateDescription}
                    disabled={isDescribing}
                    className="text-[9px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1 hover:brightness-95 disabled:opacity-50"
                  >
                    {isDescribing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Regenerate
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-700">Alt Text (Screen Readers)</label>
                  </div>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 transition-all font-sans text-zinc-900"
                    placeholder="Concise summary for screen readers..."
                  />
                  <div className="flex items-center justify-between mt-4">
                    <label className="text-[10px] font-bold text-zinc-700">Caption (Visible Description)</label>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          const textarea = captionTextareaRef.current;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + '\\(' + text.substring(start, end) + '\\)' + text.substring(end);
                            setCaptionText(newText);
                          }
                        }}
                        className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-[9px] font-black rounded-md text-zinc-700 transition-colors border border-zinc-200"
                        title="Insert inline math"
                      >
                        \( ... \)
                      </button>
                      <button 
                        onClick={() => {
                          const textarea = captionTextareaRef.current;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + '\\[' + text.substring(start, end) + '\\]' + text.substring(end);
                            setCaptionText(newText);
                          }
                        }}
                        className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-[9px] font-black rounded-md text-zinc-700 transition-colors border border-zinc-200"
                        title="Insert block math"
                      >
                        \[ ... \]
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={captionTextareaRef}
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs min-h-[120px] focus:ring-2 focus:ring-indigo-700 focus:border-indigo-700 transition-all font-sans text-zinc-900"
                    placeholder="Provide a detailed, step-by-step description of the curves, values, and math..."
                  />
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                    <h4 className="text-[9px] font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Sigma size={10} /> Math Preview
                    </h4>
                    <div ref={altPreviewRef} className="text-[11px] text-zinc-900 leading-relaxed min-h-[1.5rem]">
                      {formatMathInText(captionText)}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="pt-6 border-t border-zinc-200 space-y-2.5">
              <button 
                onClick={handleSave}
                className="w-full py-3.5 bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-800 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Save className="w-4 h-4" /> Save All Changes
              </button>
              <button 
                onClick={handleDownload}
                className="w-full py-3.5 bg-white border border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Download className="w-4 h-4" /> Download PNG
              </button>
            </div>
          </div>

          {/* Canvas & Refined Preview Area */}
          <div className="flex-1 bg-zinc-200 p-8 lg:p-12 overflow-y-auto relative flex flex-col items-center justify-center" ref={containerRef}>
            {/* Comparison Controls Bar when refined image exists */}
            {refinedImage && (
              <div className="w-full max-w-2xl bg-white/90 backdrop-blur border border-zinc-200 p-3 rounded-2xl shadow-lg mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                  <Sparkles className="w-4 h-4 text-indigo-700" />
                  <span>AI Refinement Result Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Eye size={12} />
                    <span>{showComparison ? "Show Refined Only" : "Compare Before/After"}</span>
                  </button>
                  <button
                    onClick={handleApplyRefinedImage}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Check size={12} />
                    <span>Apply to Canvas</span>
                  </button>
                </div>
              </div>
            )}

            {/* Comparison or Canvas Display */}
            <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white mx-auto max-w-full">
              {showComparison && refinedImage ? (
                <div className="relative overflow-hidden select-none" style={{ maxHeight: '65vh' }}>
                  {/* Refined Image (Underneath) */}
                  <img
                    src={refinedImage}
                    alt="Refined diagram"
                    className="w-full h-auto object-contain max-h-[65vh] block"
                  />
                  {/* Original Image (Clipped on top) */}
                  <div 
                    className="absolute inset-0 overflow-hidden border-r-2 border-indigo-600 shadow-2xl"
                    style={{ width: `${comparisonPos}%` }}
                  >
                    <img
                      src={editedSrc || figure.src}
                      alt="Original diagram scan"
                      className="w-full h-auto object-contain max-h-[65vh] block min-w-full"
                    />
                    <span className="absolute top-3 left-3 bg-zinc-900/80 text-white text-[9px] font-black uppercase px-2 py-1 rounded">
                      Original Scan
                    </span>
                  </div>
                  <span className="absolute top-3 right-3 bg-indigo-700 text-white text-[9px] font-black uppercase px-2 py-1 rounded">
                    AI Vector Refined
                  </span>
                  
                  {/* Slider Control */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={comparisonPos}
                    onChange={(e) => setComparisonPos(Number(e.target.value))}
                    className="absolute inset-x-0 bottom-4 mx-auto w-1/2 accent-indigo-600 cursor-pointer z-20"
                  />
                </div>
              ) : (
                <canvas 
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className={`w-full h-auto object-contain max-h-[65vh] ${mode === 'draw' ? 'cursor-crosshair' : mode === 'erase' ? 'cursor-cell' : 'cursor-default'}`}
                />
              )}
            </div>

            {(mode === 'draw' || mode === 'erase') && (
              <div className="mt-4 px-6 py-2.5 bg-zinc-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/10">
                {mode === 'draw' ? 'Drawing Mode Active' : 'Eraser Mode Active'} • Touch or drag mouse to annotate
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageEditor;
