
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Brain, Wand2 } from 'lucide-react';
import { ModelType, ThinkingLevelType } from '../types';

interface ProcessingOverlayProps {
  progress: number;
  currentImages?: string[] | null;
  selectedModel?: ModelType;
  actualModelUsed?: ModelType;
  selectedThinkingLevel?: ThinkingLevelType;
}

const FloatingMath = () => {
  const symbols = ['∑', '∫', 'π', '∞', '√', 'Δ', 'Ω', 'θ', 'λ', 'μ'];
  
  // Generate stable random positioning and animation parameters once on mount
  const items = React.useMemo(() => {
    return symbols.map((symbol, i) => ({
      symbol,
      style: {
        left: `${10 + (i * 8) + (Math.random() * 5)}%`, // Evenly distribute horizontally to avoid clumping
        top: `${15 + (Math.random() * 70)}%`,          // Distributed vertically
        fontSize: `${16 + Math.random() * 16}px`,
        opacity: 0.08,
      },
      duration: 8 + Math.random() * 12,
      delay: Math.random() * -10, // Negative delay starts the animation immediately in various phases
      yRange: [0, -40, 0] // Subtle floating movement up and down
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item, i) => (
        <motion.div
          key={i}
          style={item.style}
          animate={{ 
            y: item.yRange,
            rotate: [0, 360],
          }}
          transition={{ 
            duration: item.duration, 
            repeat: Infinity, 
            delay: item.delay,
            ease: "easeInOut"
          }}
          className="absolute text-indigo-500 font-serif"
        >
          {item.symbol}
        </motion.div>
      ))}
    </div>
  );
};

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ progress, currentImages, selectedModel, actualModelUsed, selectedThinkingLevel = 'LOW' }) => {
  const isDone = progress >= 100;
  
  const imgSrcs = currentImages 
    ? currentImages.map(img => img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`) 
    : [];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Immersive background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-950/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-white/40 backdrop-blur-3xl rounded-[3rem] p-12 max-w-2xl w-full border border-white/20 shadow-2xl overflow-hidden"
      >
        <FloatingMath />
        
        <div className="relative z-10 flex flex-col items-center">
          
          <AnimatePresence mode="wait">
            {imgSrcs.length > 0 && !isDone && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                key={imgSrcs.map(s => s.substring(0, 30)).join(',')}
                className="mb-8 flex gap-4 max-w-full overflow-x-auto justify-center pb-2 px-2"
              >
                {imgSrcs.map((imgSrc, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden border border-zinc-200/60 relative flex-shrink-0">
                    <img src={imgSrc} alt={`Processing page ${idx + 1}`} className="h-32 md:h-48 w-auto block opacity-70 grayscale-[20%]" />
                    
                    {/* Scanning laser effect */}
                    <motion.div
                      animate={{ top: ['-5%', '105%', '-5%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: idx * 0.2 }}
                      className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_12px_3px_rgba(99,102,241,0.6)] z-10"
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full max-w-[320px]">
            <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden border-2 border-zinc-200/50">
              <motion.div 
                className="h-full bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="relative h-10 w-full overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={isDone ? 'done' : 'processing'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute text-xs font-black text-zinc-500 uppercase tracking-[0.1em] text-center px-4"
                  >
                    {isDone ? 'Complete' : 'Processing...'}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-sm font-black text-indigo-500">{Math.round(progress)}%</span>
              
              {(actualModelUsed || selectedModel) && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-zinc-200 text-xs font-semibold text-zinc-700 shadow-sm mt-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Cpu size={13} className="text-indigo-500 animate-pulse" />
                    <span>
                      {(() => {
                        const modelToDisplay = actualModelUsed || selectedModel;
                        switch (modelToDisplay) {
                          case 'gemini-3.7-flash': return 'Gemini 3.7 Flash';
                          case 'gemini-3.5-flash': 
                            return (selectedModel === 'gemini-3.7-flash' || selectedModel === 'gemini-3.1-pro-preview')
                              ? 'Gemini 3.5 Flash (Fallback)' 
                              : 'Gemini 3.5 Flash';
                          case 'gemini-3.1-flash-lite': return 'Gemini 3.1 Flash Lite';
                          case 'gemini-3.1-pro-preview': return 'Gemini 3.1 Pro (Preview)';
                          default: return modelToDisplay;
                        }
                      })()}
                    </span>
                  </div>
                  <span className="text-zinc-300 font-normal">•</span>
                  <div className="flex items-center gap-1 text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] border border-indigo-100">
                    {selectedThinkingLevel === 'AUTO' ? (
                      <>
                        <Wand2 size={12} className="text-indigo-600 animate-pulse" />
                        <span>Adaptive Thinking</span>
                      </>
                    ) : selectedThinkingLevel === 'HIGH' ? (
                      <>
                        <Brain size={12} className="text-indigo-600" />
                        <span>Deep Thinking</span>
                      </>
                    ) : selectedThinkingLevel === 'LOW' ? (
                      <>
                        <Cpu size={12} className="text-indigo-600" />
                        <span>Fast Thinking</span>
                      </>
                    ) : (
                      <span>Standard</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <h2 className="text-4xl font-black tracking-tighter text-emerald-500">Done!</h2>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingOverlay;
