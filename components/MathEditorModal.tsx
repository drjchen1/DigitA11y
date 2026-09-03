import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

interface MathEditorModalProps {
  initialHtml: string;
  onSave: (html: string) => void;
  onClose: () => void;
}

type TokenType = 'text' | 'inline-math' | 'display-math';
interface Token {
  type: TokenType;
  content: string;
  id: string;
}

export const MathEditorModal: React.FC<MathEditorModalProps> = ({ initialHtml, onSave, onClose }) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const regex = /(\\\([\s\S]*?\\\))|(\\\[[\s\S]*?\\\])/g;
    let lastIndex = 0;
    let match;
    const newTokens: Token[] = [];
    let idCounter = 0;

    while ((match = regex.exec(initialHtml)) !== null) {
      if (match.index > lastIndex) {
        newTokens.push({ type: 'text', content: initialHtml.slice(lastIndex, match.index), id: `text-${idCounter++}` });
      }
      if (match[1]) {
        newTokens.push({ type: 'inline-math', content: match[1], id: `math-${idCounter++}` });
      } else if (match[2]) {
        newTokens.push({ type: 'display-math', content: match[2], id: `math-${idCounter++}` });
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < initialHtml.length) {
      newTokens.push({ type: 'text', content: initialHtml.slice(lastIndex), id: `text-${idCounter++}` });
    }
    setTokens(newTokens);
    
    const firstMath = newTokens.findIndex(t => t.type !== 'text');
    if (firstMath !== -1) {
      setSelectedTokenIndex(firstMath);
    }
  }, [initialHtml]);

  const updateToken = (index: number, newContent: string) => {
    const newTokens = [...tokens];
    newTokens[index] = { ...newTokens[index], content: newContent };
    setTokens(newTokens);
  };

  useEffect(() => {
    if (previewRef.current && (window as any).MathJax) {
      const mathJax = (window as any).MathJax;
      mathJax.typesetClear([previewRef.current]);
      mathJax.typesetPromise([previewRef.current]).catch((err: any) => {
        console.error('MathJax typeset error in modal:', err);
      });
    }
  }, [tokens, selectedTokenIndex]);

  const mathTokensOnly = tokens.map((t, idx) => ({ ...t, originalIndex: idx })).filter(t => t.type !== 'text');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-100">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50 flex-shrink-0">
          <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">Live LaTeX Editor</h2>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(tokens.map(t => t.content).join(''))}
              className="px-4 py-2 text-sm font-bold bg-indigo-700 text-white rounded-xl hover:bg-indigo-800 transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              Save Changes
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-100 bg-zinc-50/30 flex flex-col max-h-48 md:max-h-none md:h-full shrink-0">
            <div className="p-4 border-b border-zinc-100 bg-white flex-shrink-0">
              <h3 className="text-xs font-black text-zinc-400 tracking-widest uppercase">Equations Found ({mathTokensOnly.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {mathTokensOnly.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTokenIndex(t.originalIndex)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all ${selectedTokenIndex === t.originalIndex ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
                >
                  <div className="line-clamp-3">{t.content}</div>
                  <div className="mt-2 text-[9px] font-bold uppercase tracking-widest opacity-50">
                    {t.type === 'display-math' ? 'Block Equation' : 'Inline Math'}
                  </div>
                </button>
              ))}
              {mathTokensOnly.length === 0 && (
                <div className="p-8 text-center text-zinc-400 text-sm font-medium">
                  No math equations found on this page.
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-2/3 flex flex-col bg-white h-full min-h-0">
            <div className="h-1/2 border-b border-zinc-100 flex flex-col">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex-shrink-0">
                <h3 className="text-xs font-black text-zinc-400 tracking-widest uppercase">Edit LaTeX</h3>
              </div>
              <div className="flex-1 p-4 min-h-0">
                {selectedTokenIndex !== null && tokens[selectedTokenIndex] ? (
                  <textarea
                    value={tokens[selectedTokenIndex].content}
                    onChange={(e) => updateToken(selectedTokenIndex, e.target.value)}
                    className="w-full h-full resize-none font-mono text-sm p-4 bg-zinc-50 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    spellCheck={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-sm font-medium">
                    Select an equation from the sidebar to edit
                  </div>
                )}
              </div>
            </div>
            <div className="h-1/2 flex flex-col bg-[#FDFBF7]">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex-shrink-0">
                <h3 className="text-xs font-black text-zinc-400 tracking-widest uppercase">Live Preview</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-8 math-content flex items-center justify-center min-h-0">
                {selectedTokenIndex !== null && tokens[selectedTokenIndex] ? (
                  <div ref={previewRef} dangerouslySetInnerHTML={{ __html: tokens[selectedTokenIndex].content }} className="text-2xl w-full flex justify-center" />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
