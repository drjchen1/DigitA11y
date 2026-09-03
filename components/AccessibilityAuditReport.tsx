
import React, { useState } from 'react';
import { ConversionResult, AppState } from '../types';
import { autoFixAccessibilityIssue, autoFixAllAccessibilityIssues } from '../services/geminiService';
import { Sparkles, Loader2 } from 'lucide-react';

interface AccessibilityAuditReportProps {
  results: ConversionResult[];
  activeTab: number;
  state: AppState;
  onClose: () => void;
  onUpdateHtml: (pageIndex: number, newHtml: string) => void;
  onApiCall: () => void;
  sessionRequestCount: number;
  dailyRequestCount: number;
}

const AccessibilityAuditReport: React.FC<AccessibilityAuditReportProps> = ({ results, activeTab, state, onClose, onUpdateHtml, onApiCall, sessionRequestCount, dailyRequestCount }) => {
  const activeAudit = results[activeTab]?.audit;
  const failingChecks = activeAudit?.checks.filter(check => !check.passed) || [];
  
  const [fixingIndex, setFixingIndex] = useState<number | null>(null);
  const [isFixingAll, setIsFixingAll] = useState<boolean>(false);

  const handleAutoFix = async (check: any, idx: number) => {
    setFixingIndex(idx);
    try {
      const currentHtml = results[activeTab].html;
      const newHtml = await autoFixAccessibilityIssue(
        currentHtml,
        check.title,
        check.description,
        check.suggestion || "",
        state.selectedModel
      );
      onApiCall();
      onUpdateHtml(activeTab, newHtml);
    } catch (error) {
      console.error("Failed to auto-fix:", error);
      alert("Failed to apply auto-fix. Please try again.");
    } finally {
      setFixingIndex(null);
    }
  };

  const handleAutoFixAll = async () => {
    if (failingChecks.length === 0) return;
    setIsFixingAll(true);
    try {
      const currentHtml = results[activeTab].html;
      const newHtml = await autoFixAllAccessibilityIssues(
        currentHtml,
        failingChecks.map(c => ({ title: c.title, description: c.description, suggestion: c.suggestion })),
        state.selectedModel
      );
      onApiCall();
      onUpdateHtml(activeTab, newHtml);
    } catch (error) {
      console.error("Failed to auto-fix all issues:", error);
      alert("Failed to apply comprehensive auto-fix. Please try again.");
    } finally {
      setIsFixingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-600 transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-10 border-b border-zinc-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-700 text-white rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Accessibility Audit</h2>
              <p className="text-zinc-500 font-medium">WCAG 2.2 AA Compliance Report for Page {activeTab + 1}</p>
              {state.totalTime && (
                <div className="mt-2 space-y-1">
                  <p className="text-indigo-700 font-bold text-xs uppercase tracking-widest">Total Processing Time: {state.totalTime}s</p>
                  <div className="flex gap-4">
                    <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
                      {sessionRequestCount} Requests ({Math.round((sessionRequestCount / (state.totalTime / 60)) * 10) / 10} RPM)
                    </p>
                    <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
                      {dailyRequestCount} Daily Requests
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-8">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-black text-zinc-900 uppercase tracking-widest">Compliance Score</span>
                <span className={`text-sm font-black ${activeAudit?.score === 100 ? 'text-zinc-600' : 'text-amber-600'}`}>{activeAudit?.score}%</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${activeAudit?.score === 100 ? 'bg-zinc-500' : 'bg-amber-500'}`}
                  style={{ width: `${activeAudit?.score || 0}%` }}
                ></div>
              </div>
            </div>
            <div className={`px-6 py-3 rounded-2xl font-black text-lg ${activeAudit?.score === 100 ? 'bg-zinc-100 text-zinc-700' : 'bg-amber-50 text-amber-700'}`}>
              {activeAudit?.score === 100 ? 'EXCELLENT' : 'IMPROVEMENT NEEDED'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8">
          {results[activeTab]?.semanticTags && (
            <section className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Semantic Accessibility Tags & Structural Metadata
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-semibold text-zinc-500 block">LaTeX Math Formulas</span>
                  <span className="text-base font-black text-indigo-950 mt-0.5 block">{results[activeTab].semanticTags?.mathExpressionsCount}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-semibold text-zinc-500 block">Accessible Tables</span>
                  <span className="text-base font-black text-indigo-950 mt-0.5 block">{results[activeTab].semanticTags?.tablesCount}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-semibold text-zinc-500 block">Visual Figures</span>
                  <span className="text-base font-black text-indigo-950 mt-0.5 block">{results[activeTab].semanticTags?.figuresCount}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-semibold text-zinc-500 block">Heading Hierarchy</span>
                  <span className="text-base font-black text-indigo-950 mt-0.5 block">{results[activeTab].semanticTags?.headingsCount} levels</span>
                </div>
              </div>
            </section>
          )}

          {failingChecks.length > 0 && (
            <section className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Top Fixes Needed ({failingChecks.length})</span>
                </h3>
                <button
                  onClick={handleAutoFixAll}
                  disabled={isFixingAll || fixingIndex !== null}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isFixingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Resolving All Issues with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Fix All {failingChecks.length} Issues with AI</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid gap-4">
                {failingChecks.map((check, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-white/50 p-4 rounded-2xl border border-amber-200/50">
                    <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 text-[10px] font-black">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{check.title}</h4>
                      <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
                        <span className="font-black uppercase text-[9px] mr-1 opacity-70">Quick Fix:</span> 
                        {check.suggestion || "Review and update the content structure."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Detailed Checks</h3>
              {failingChecks.length > 0 && (
                <button
                  onClick={handleAutoFixAll}
                  disabled={isFixingAll || fixingIndex !== null}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-Fix All Remaining</span>
                </button>
              )}
            </div>
            <div className="grid gap-4">
              {activeAudit?.checks.map((check, idx) => (
                <div key={idx} className={`p-6 rounded-3xl border ${check.passed ? 'bg-zinc-50/50 border-zinc-200' : 'bg-amber-50/30 border-amber-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 w-full">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${check.passed ? 'bg-zinc-200 text-zinc-600' : 'bg-amber-100 text-amber-600'}`}>
                        {check.passed ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-zinc-900 mb-1">{check.title}</h4>
                        <p className="text-sm text-zinc-500 leading-relaxed">{check.description}</p>
                        {!check.passed && check.suggestion && (
                          <div className="mt-4 p-4 bg-white border border-amber-200 rounded-2xl">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-black text-amber-700 uppercase tracking-widest">How to fix</p>
                              <button
                                onClick={() => handleAutoFix(check, idx)}
                                disabled={fixingIndex !== null}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                  fixingIndex === idx 
                                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-not-allowed' 
                                    : 'bg-indigo-700 hover:bg-indigo-800 text-white'
                                }`}
                              >
                                {fixingIndex === idx ? (
                                  <>
                                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Fixing...
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
                                    Auto-Fix with AI
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-sm text-zinc-700 font-medium">{check.suggestion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${check.passed ? 'bg-zinc-200 text-zinc-700' : 'bg-amber-100 text-amber-700'}`}>
                      {check.passed ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">About WCAG 2.2 AA</h3>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              Web Content Accessibility Guidelines (WCAG) 2.2 defines how to make Web content more accessible to people with disabilities. AA compliance is the standard level of accessibility for most commercial and government websites.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-zinc-100">
                <h5 className="text-xs font-bold text-zinc-900 mb-1">Perceivable</h5>
                <p className="text-[11px] text-zinc-400">Information and UI components must be presentable to users in ways they can perceive.</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-zinc-100">
                <h5 className="text-xs font-bold text-zinc-900 mb-1">Operable</h5>
                <p className="text-[11px] text-zinc-400">UI components and navigation must be operable by all users.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityAuditReport;
