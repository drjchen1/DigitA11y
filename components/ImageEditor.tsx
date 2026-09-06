import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Pencil, Save, RotateCcw, RotateCw, Download, Sparkles, Loader2, 
  CheckCircle2, Eraser, Sigma, Wand2, Sliders, Eye, RefreshCw, Palette, 
  Layers, Check, FileCode, Copy, ZoomIn, ZoomOut, Maximize2,
  FlipHorizontal, FlipVertical, Undo2, Compass, Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { describeFigure, generateSvgDiagramFromImage } from '../services/geminiService';
import { refineDiagramWithGemini, RefinementPreset } from '../services/imageService';
import { formatMathInText } from '../utils/dom';
import { rotateImageDataUrl, flipImageDataUrl } from '../utils/image';

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
  const [mode, setMode] = useState<'view' | 'draw' | 'erase' | 'accessibility' | 'ai-refine' | 'vector-svg' | 'rotate'>('view');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);

  // Rotation & Transformation states
  const [fineAngle, setFineAngle] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  
  // AI Refinement states
  const [selectedPreset, setSelectedPreset] = useState<RefinementPreset>('vector');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinedImage, setRefinedImage] = useState<string | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [comparisonPos, setComparisonPos] = useState<number>(50);

  // Vector SVG states (Gemini 3.8 Flash)
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgDataUri, setSvgDataUri] = useState<string | null>(null);
  const [isGeneratingSvg, setIsGeneratingSvg] = useState<boolean>(false);
  const [svgError, setSvgError] = useState<string | null>(null);
  const [svgCopied, setSvgCopied] = useState<boolean>(false);
  const [svgViewMode, setSvgViewMode] = useState<'svg' | 'original'>('svg');
  const [svgZoom, setSvgZoom] = useState<number>(100);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const altPreviewRef = useRef<HTMLDivElement>(null);
  const captionTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [altText, setAltText] = useState<string>(figure.alt);
  const [captionText, setCaptionText] = useState<string>(figure.caption || "Figure");
  const [editedSrc, setEditedSrc] = useState<string | null>(null);

  const pushUndo = (src: string) => {
    setUndoStack((prev) => [src, ...prev.slice(0, 9)]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [previous, ...rest] = undoStack;
    setUndoStack(rest);
    setEditedSrc(previous);
    setFineAngle(0);
  };

  const handleRotate = async (angleDeg: number) => {
    const currentSrc = editedSrc || figure.src;
    pushUndo(currentSrc);
    setIsRotating(true);
    try {
      const rotated = await rotateImageDataUrl(currentSrc, angleDeg);
      setEditedSrc(rotated);
      setFineAngle(0);
      if (svgContent) {
        setSvgContent(null);
        setSvgDataUri(null);
      }
      if (refinedImage) {
        setRefinedImage(null);
        setShowComparison(false);
      }
    } catch (err) {
      console.error('Failed to rotate image:', err);
    } finally {
      setIsRotating(false);
    }
  };

  const handleFlip = async (horizontal: boolean) => {
    const currentSrc = editedSrc || figure.src;
    pushUndo(currentSrc);
    setIsRotating(true);
    try {
      const flipped = await flipImageDataUrl(currentSrc, horizontal);
      setEditedSrc(flipped);
      if (svgContent) {
        setSvgContent(null);
        setSvgDataUri(null);
      }
      if (refinedImage) {
        setRefinedImage(null);
        setShowComparison(false);
      }
    } catch (err) {
      console.error('Failed to flip image:', err);
    } finally {
      setIsRotating(false);
    }
  };

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
      let w = img.width;
      let h = img.height;
      
      // If the image is an SVG, it might lack absolute pixel dimensions.
      // Ensure the canvas is high-res (at least 1200px) so if the user draws, it doesn't get pixelated.
      if (img.src.includes('image/svg+xml') && w > 0 && h > 0 && Math.max(w, h) < 1200) {
        const scale = 1200 / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      } else if (w === 0 || h === 0) {
        w = 1200;
        h = 900;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

  const handleGenerateSvg = async () => {
    setIsGeneratingSvg(true);
    setSvgError(null);
    try {
      const inputSrc = editedSrc || figure.src;
      const result = await generateSvgDiagramFromImage(
        inputSrc,
        captionText,
        altText,
        'gemini-3.8-flash'
      );
      if (result.tokenCount && onApiCall) {
        onApiCall(result.tokenCount);
      }
      setSvgContent(result.svg);
      setSvgDataUri(result.dataUri);
      setSvgViewMode('svg');
    } catch (err: any) {
      console.error('Vector SVG generation error:', err);
      setSvgError(err.message || 'Failed to reconstruct diagram as vector SVG. Please try again.');
    } finally {
      setIsGeneratingSvg(false);
    }
  };

  const handleApplySvg = () => {
    if (!svgDataUri) return;
    setEditedSrc(svgDataUri);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        let w = img.width || 1200;
        let h = img.height || 900;
        if (Math.max(w, h) < 1200) {
          const scale = 1200 / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      }
    };
    img.src = svgDataUri;
    setMode('view');
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-diagram-${figure.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySvg = async () => {
    if (!svgContent) return;
    try {
      await navigator.clipboard.writeText(svgContent);
      setSvgCopied(true);
      setTimeout(() => setSvgCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SVG:', err);
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
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          const current = editedSrc || figure.src;
          pushUndo(current);
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
    if (editedSrc) {
      pushUndo(editedSrc);
    }
    setEditedSrc(null);
    setRefinedImage(null);
    setShowComparison(false);
    setSvgContent(null);
    setSvgDataUri(null);
    setFineAngle(0);
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
                Touch up, rotate, annotate, reconstruct vector SVG, and AI-refine diagrams
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors cursor-pointer">
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
                  onClick={() => setMode('rotate')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${mode === 'rotate' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-400'}`}
                  title="Rotate, flip, or straighten diagram"
                >
                  <RotateCw className={`w-4 h-4 ${mode === 'rotate' ? 'text-white' : 'text-indigo-600'}`} />
                  <span className="text-[9px] font-bold">Rotate & Orient</span>
                </button>
                <button 
                  onClick={() => setMode('draw')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${mode === 'draw' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                >
                  <Pencil className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Draw</span>
                </button>
                <button 
                  onClick={() => setMode('erase')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${mode === 'erase' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                >
                  <Eraser className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Erase</span>
                </button>
                <button 
                  onClick={() => setMode('accessibility')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${mode === 'accessibility' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[9px] font-bold">Alt Text</span>
                </button>
                <button 
                  onClick={() => setMode('vector-svg')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all relative cursor-pointer ${mode === 'vector-svg' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-indigo-900 border border-indigo-200 hover:border-indigo-400 font-bold'}`}
                >
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span className="text-[9px] font-bold">Vector SVG</span>
                  <span className="absolute -top-1.5 -right-1 bg-amber-400 text-zinc-900 text-[8px] font-black px-1 rounded-full">3.8</span>
                </button>
                <button 
                  onClick={() => setMode('ai-refine')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all relative cursor-pointer ${mode === 'ai-refine' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                >
                  <Wand2 className="w-4 h-4 text-amber-500" />
                  <span className="text-[9px] font-bold">AI Refine</span>
                </button>
                {undoStack.length > 0 ? (
                  <button 
                    onClick={handleUndo}
                    className="p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 cursor-pointer"
                    title="Undo last edit or rotation"
                  >
                    <Undo2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-[9px] font-bold">Undo ({undoStack.length})</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => setMode('view')}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${mode === 'view' ? 'bg-indigo-700 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'}`}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-[9px] font-bold">View</span>
                  </button>
                )}
                <button 
                  onClick={() => { setMode('view'); handleResetFigure(); }}
                  className="p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400 cursor-pointer"
                  title="Reset all modifications back to original scan"
                >
                  <RefreshCw className="w-4 h-4 text-zinc-400" />
                  <span className="text-[9px] font-bold">Reset All</span>
                </button>
              </div>
            </section>

            {/* Rotate & Orient Controls */}
            {mode === 'rotate' && (
              <section className="space-y-5">
                <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-900 font-black text-xs mb-1">
                    <RotateCw className="w-4 h-4 text-indigo-600" />
                    <span>Rotation & Orientation</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-relaxed">
                    Rotate 90° increments to correct scanned orientation, mirror horizontally/vertically, or finely adjust skew with precision angle controls.
                  </p>
                </div>

                {/* 90-Degree Quick Turns */}
                <div>
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                    <span>90° Quick Turns</span>
                    <span className="text-[9px] font-mono font-bold text-zinc-500">Step: 90°</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleRotate(-90)}
                      disabled={isRotating}
                      className="p-3 bg-white border border-zinc-200 hover:border-indigo-400 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Rotate 90° Counter-Clockwise (Left)"
                    >
                      <RotateCcw className="w-4 h-4 text-indigo-700" />
                      <span className="text-[9px] font-bold text-zinc-800">90° Left</span>
                    </button>
                    <button
                      onClick={() => handleRotate(90)}
                      disabled={isRotating}
                      className="p-3 bg-white border border-zinc-200 hover:border-indigo-400 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Rotate 90° Clockwise (Right)"
                    >
                      <RotateCw className="w-4 h-4 text-indigo-700" />
                      <span className="text-[9px] font-bold text-zinc-800">90° Right</span>
                    </button>
                    <button
                      onClick={() => handleRotate(180)}
                      disabled={isRotating}
                      className="p-3 bg-white border border-zinc-200 hover:border-indigo-400 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Rotate 180° (Upside Down)"
                    >
                      <RefreshCw className="w-4 h-4 text-indigo-700" />
                      <span className="text-[9px] font-bold text-zinc-800">180° Turn</span>
                    </button>
                  </div>
                </div>

                {/* Flip & Mirror */}
                <div>
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    Mirror & Invert
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleFlip(true)}
                      disabled={isRotating}
                      className="p-2.5 bg-white border border-zinc-200 hover:border-indigo-400 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-xs font-bold text-zinc-800"
                      title="Flip Horizontally (Mirror)"
                    >
                      <FlipHorizontal className="w-4 h-4 text-zinc-600" />
                      <span className="text-[10px]">Flip Horiz</span>
                    </button>
                    <button
                      onClick={() => handleFlip(false)}
                      disabled={isRotating}
                      className="p-2.5 bg-white border border-zinc-200 hover:border-indigo-400 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-xs font-bold text-zinc-800"
                      title="Flip Vertically"
                    >
                      <FlipVertical className="w-4 h-4 text-zinc-600" />
                      <span className="text-[10px]">Flip Vert</span>
                    </button>
                  </div>
                </div>

                {/* Fine Angle Straighten */}
                <div className="space-y-3 pt-2 border-t border-zinc-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-indigo-600" />
                      <h4 className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                        Fine Straighten
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {fineAngle > 0 ? `+${fineAngle.toFixed(1)}°` : `${fineAngle.toFixed(1)}°`}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="0.5"
                    value={fineAngle}
                    onChange={(e) => setFineAngle(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />

                  {/* Quick Nudge Buttons */}
                  <div className="grid grid-cols-5 gap-1">
                    {[-5, -1, 0, 1, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setFineAngle(val === 0 ? 0 : prev => Math.max(-45, Math.min(45, Math.round((prev + val) * 10) / 10)))}
                        className={`py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                          val === 0 
                            ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200' 
                            : 'bg-white border-zinc-200 hover:border-indigo-300 text-zinc-700'
                        }`}
                        title={val === 0 ? 'Reset angle to 0°' : `Nudge ${val > 0 ? `+${val}°` : `${val}°`}`}
                      >
                        {val === 0 ? '0°' : (val > 0 ? `+${val}°` : `${val}°`)}
                      </button>
                    ))}
                  </div>

                  {fineAngle !== 0 && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRotate(fineAngle)}
                        disabled={isRotating}
                        className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
                      >
                        {isRotating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Apply Angle</span>
                      </button>
                      <button
                        onClick={() => setFineAngle(0)}
                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>

                {/* Alignment Grid Toggle */}
                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 select-none">
                    <Grid className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Alignment Grid</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGrid(!showGrid)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      showGrid ? 'bg-indigo-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        showGrid ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </section>
            )}

            {/* Vector SVG Panel (Gemini 3.8 Flash) */}
            {mode === 'vector-svg' && (
              <section className="space-y-4">
                <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-900 font-black text-xs mb-1">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    <span>Gemini 3.8 Flash Vector SVG</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-relaxed">
                    Reconstruct scanned plots, geometric diagrams, or handwritten charts into scalable vector SVG markup with accessible tags and sharp mathematical curves.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleGenerateSvg}
                    disabled={isGeneratingSvg}
                    className="w-full py-3.5 bg-indigo-700 text-white font-bold text-xs rounded-xl hover:bg-indigo-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingSvg ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Vector SVG (3.8)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>{svgContent ? "Regenerate Vector SVG" : "Reconstruct as Vector SVG"}</span>
                      </>
                    )}
                  </button>

                  {svgError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-700 font-semibold">
                      {svgError}
                    </div>
                  )}

                  {svgContent && (
                    <div className="space-y-2.5 pt-2">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[11px] font-bold">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Vector SVG Ready & Responsive</span>
                      </div>

                      <button
                        onClick={handleApplySvg}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply SVG to Figure</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleDownloadSvg}
                          className="py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Download .SVG</span>
                        </button>
                        <button
                          onClick={handleCopySvg}
                          className="py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {svgCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Copy SVG</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

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
            {/* Quick Rotation & Transformation Toolbar */}
            <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md border border-zinc-200/80 px-4 py-2.5 rounded-2xl shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-1 hidden sm:inline">
                  Rotate:
                </span>
                <button
                  onClick={() => handleRotate(-90)}
                  disabled={isRotating}
                  title="Rotate 90° Left (Counter-Clockwise)"
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-700" />
                  <span>90° Left</span>
                </button>
                <button
                  onClick={() => handleRotate(90)}
                  disabled={isRotating}
                  title="Rotate 90° Right (Clockwise)"
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-700" />
                  <span>90° Right</span>
                </button>
                <button
                  onClick={() => handleRotate(180)}
                  disabled={isRotating}
                  title="Rotate 180° (Upside-down)"
                  className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 rounded-xl text-xs font-bold transition-all items-center gap-1.5 cursor-pointer disabled:opacity-50 hidden md:flex"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-600" />
                  <span>180°</span>
                </button>
                <button
                  onClick={() => setMode(mode === 'rotate' ? 'view' : 'rotate')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    mode === 'rotate'
                      ? 'bg-indigo-700 text-white shadow-sm'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
                  }`}
                  title="Toggle fine angle straighten controls"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{mode === 'rotate' ? 'Straighten Active' : 'Straighten Angle'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {undoStack.length > 0 && (
                  <button
                    onClick={handleUndo}
                    title="Undo last rotation or drawing edit"
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Undo</span>
                  </button>
                )}
                {editedSrc && (
                  <button
                    onClick={handleResetFigure}
                    title="Revert all changes back to original scan"
                    className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Revert
                  </button>
                )}
              </div>
            </div>

            {/* Vector SVG Controls Bar when SVG exists */}
            {mode === 'vector-svg' && svgContent && (
              <div className="w-full max-w-2xl bg-white/90 backdrop-blur border border-zinc-200 p-3 rounded-2xl shadow-lg mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                  <FileCode className="w-4 h-4 text-indigo-700" />
                  <span>Gemini 3.8 Vector Graphic</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
                    <button
                      onClick={() => setSvgZoom(prev => Math.max(50, prev - 25))}
                      title="Zoom Out"
                      className="p-1 text-zinc-600 hover:text-zinc-900 rounded hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      <ZoomOut size={13} />
                    </button>
                    <span className="text-[11px] font-mono font-bold px-1.5 min-w-[42px] text-center text-zinc-700">
                      {svgZoom}%
                    </span>
                    <button
                      onClick={() => setSvgZoom(prev => Math.min(250, prev + 25))}
                      title="Zoom In"
                      className="p-1 text-zinc-600 hover:text-zinc-900 rounded hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      <ZoomIn size={13} />
                    </button>
                    {svgZoom !== 100 && (
                      <button
                        onClick={() => setSvgZoom(100)}
                        title="Reset Zoom"
                        className="px-1 text-[10px] text-indigo-600 hover:underline font-bold border-l border-zinc-200 ml-0.5"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setSvgViewMode(svgViewMode === 'svg' ? 'original' : 'svg')}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>{svgViewMode === 'svg' ? "Original" : "Vector SVG"}</span>
                  </button>
                  <button
                    onClick={handleApplySvg}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Check size={12} />
                    <span>Apply</span>
                  </button>
                </div>
              </div>
            )}

            {/* Comparison Controls Bar when refined image exists */}
            {mode !== 'vector-svg' && refinedImage && (
              <div className="w-full max-w-2xl bg-white/90 backdrop-blur border border-zinc-200 p-3 rounded-2xl shadow-lg mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                  <Sparkles className="w-4 h-4 text-indigo-700" />
                  <span>AI Refinement Result Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>{showComparison ? "Show Refined Only" : "Compare Before/After"}</span>
                  </button>
                  <button
                    onClick={handleApplyRefinedImage}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Check size={12} />
                    <span>Apply to Canvas</span>
                  </button>
                </div>
              </div>
            )}

            {/* Comparison, Vector SVG, or Canvas Display */}
            <div className="relative shadow-2xl rounded-2xl overflow-hidden bg-white mx-auto max-w-4xl w-full">
              {mode === 'vector-svg' && svgContent ? (
                <div className="p-6 flex flex-col items-center justify-center min-h-[420px] max-h-[70vh] overflow-auto">
                  {svgViewMode === 'svg' ? (
                    <div 
                      className="w-full flex items-center justify-center transition-transform duration-150 ease-out origin-center [&>svg]:w-full [&>svg]:max-w-3xl [&>svg]:h-auto [&>svg]:max-h-[60vh] [&>svg]:mx-auto" 
                      style={{ transform: `scale(${svgZoom / 100})` }}
                      dangerouslySetInnerHTML={{ __html: svgContent }} 
                    />
                  ) : (
                    <img
                      src={editedSrc || figure.src}
                      alt="Original diagram scan"
                      className="w-full h-auto object-contain max-h-[60vh] block mx-auto"
                    />
                  )}
                  <div className="mt-4 text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {svgViewMode === 'svg' ? `Scalable Vector Graphic (SVG) • ${svgZoom}% Zoom • Infinite Crisp Resolution` : 'Original Scanned Raster Image'}
                  </div>
                </div>
              ) : showComparison && refinedImage ? (
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
                <div className="relative overflow-hidden w-full flex items-center justify-center min-h-[300px]">
                  {/* Live rotation container */}
                  <div 
                    className="transition-transform duration-150 ease-out origin-center flex items-center justify-center relative max-w-full"
                    style={{ transform: mode === 'rotate' && fineAngle !== 0 ? `rotate(${fineAngle}deg)` : undefined }}
                  >
                    <canvas 
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className={`w-full h-auto object-contain max-h-[65vh] ${
                        mode === 'draw' ? 'cursor-crosshair' : mode === 'erase' ? 'cursor-cell' : 'cursor-default'
                      }`}
                    />

                    {/* Alignment Grid Overlay */}
                    {mode === 'rotate' && showGrid && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-30"
                        style={{
                          backgroundImage: 'linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)',
                          backgroundSize: '36px 36px'
                        }}
                      />
                    )}
                  </div>

                  {/* Rotation spinner overlay */}
                  {isRotating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-30">
                      <Loader2 className="w-8 h-8 text-indigo-700 animate-spin" />
                      <span className="text-xs font-bold text-zinc-800">Applying rotation...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fine angle preview floating pill */}
            {mode === 'rotate' && fineAngle !== 0 && (
              <div className="mt-3 flex items-center gap-3 bg-zinc-900/90 text-white px-4 py-2 rounded-full shadow-lg border border-white/10 text-xs font-medium z-10">
                <span className="font-mono text-amber-300 font-bold">
                  Preview: {fineAngle > 0 ? `+${fineAngle.toFixed(1)}°` : `${fineAngle.toFixed(1)}°`}
                </span>
                <button
                  onClick={() => handleRotate(fineAngle)}
                  disabled={isRotating}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3 h-3" />
                  <span>Apply Angle</span>
                </button>
                <button
                  onClick={() => setFineAngle(0)}
                  className="text-zinc-400 hover:text-white transition-colors text-xs underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            {(mode === 'draw' || mode === 'erase') && (
              <div className="mt-4 px-6 py-2.5 bg-zinc-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/10">
                {mode === 'draw' ? 'Drawing Mode Active' : 'Eraser Mode Active'} • Touch or drag mouse to annotate
              </div>
            )}

            {mode === 'rotate' && fineAngle === 0 && (
              <div className="mt-4 px-6 py-2 bg-zinc-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/10 flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rotation Mode • Click 90° Left/Right or use fine angle slider to straighten skewed scans</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageEditor;
