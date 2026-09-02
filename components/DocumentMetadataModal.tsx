import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User, 
  BookOpen, 
  GraduationCap, 
  Tag, 
  AlignLeft, 
  Copyright, 
  Calendar, 
  X, 
  Check, 
  RotateCcw, 
  Sparkles,
  Info
} from 'lucide-react';
import { DocumentMetadata } from '../types';

interface DocumentMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: DocumentMetadata;
  onSave: (updatedMetadata: DocumentMetadata) => void;
  defaultDetectedMetadata: DocumentMetadata;
}

export const DocumentMetadataModal: React.FC<DocumentMetadataModalProps> = ({
  isOpen,
  onClose,
  metadata,
  onSave,
  defaultDetectedMetadata
}) => {
  const [formData, setFormData] = useState<DocumentMetadata>(metadata);
  const [activeTab, setActiveTab] = useState<'core' | 'additional'>('core');

  // Update form data when props change
  useEffect(() => {
    if (isOpen) {
      setFormData(metadata);
    }
  }, [isOpen, metadata]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof DocumentMetadata, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetToDefault = () => {
    setFormData(defaultDetectedMetadata);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave({
      ...formData,
      title: formData.title.trim() || defaultDetectedMetadata.title || 'Mathematics Document',
      author: formData.author.trim(),
      subject: formData.subject.trim(),
      description: formData.description?.trim() || '',
      keywords: formData.keywords?.trim() || '',
      institution: formData.institution?.trim() || '',
      copyright: formData.copyright?.trim() || '',
      creationDate: formData.creationDate?.trim() || new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-metadata-title"
    >
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
              <FileText size={20} />
            </div>
            <div>
              <h3 id="document-metadata-title" className="text-base font-bold text-zinc-900 leading-tight">
                Document Properties & Metadata
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Embedded directly into the exported HTML &lt;head&gt; tags and Dublin Core properties
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition-all cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 pt-3 pb-1 border-b border-zinc-100 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('core')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'core'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
          >
            Core Information (Title, Author, Subject)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('additional')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'additional'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
          >
            Keywords & Institutional Details
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {activeTab === 'core' ? (
            <>
              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="meta-title" className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                  <FileText size={13} className="text-indigo-600" />
                  <span>Document Title <span className="text-red-500">*</span></span>
                </label>
                <input
                  id="meta-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Linear Systems: Saddle Point Analysis"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                <p className="text-[10px] text-zinc-400">Used as the primary document title, browser tab name, and OpenGraph heading.</p>
              </div>

              {/* Author and Subject Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Author */}
                <div className="space-y-1.5">
                  <label htmlFor="meta-author" className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                    <User size={13} className="text-indigo-600" />
                    <span>Author / Instructor</span>
                  </label>
                  <input
                    id="meta-author"
                    type="text"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    placeholder="e.g. Prof. K. Chen"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                {/* Subject / Course */}
                <div className="space-y-1.5">
                  <label htmlFor="meta-subject" className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                    <BookOpen size={13} className="text-indigo-600" />
                    <span>Subject / Course</span>
                  </label>
                  <input
                    id="meta-subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="e.g. Differential Equations & Dynamical Systems"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Description / Abstract */}
              <div className="space-y-1.5">
                <label htmlFor="meta-description" className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                  <AlignLeft size={13} className="text-indigo-600" />
                  <span>Description / Abstract Summary</span>
                </label>
                <textarea
                  id="meta-description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="e.g. Detailed analysis of 2D linear systems, equilibrium point stability, eigenvalues, and phase portraits."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium resize-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* Keywords */}
              <div className="space-y-1.5">
                <label htmlFor="meta-keywords" className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                  <Tag size={13} className="text-indigo-600" />
                  <span>Keywords & Topic Tags (comma-separated)</span>
                </label>
                <input
                  id="meta-keywords"
                  type="text"
                  value={formData.keywords || ''}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                  placeholder="e.g. mathematics, eigenvalues, saddle point, phase portrait, differential equations"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              {/* Institution and Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Institution */}
                <div className="space-y-1.5">
                  <label htmlFor="meta-institution" className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                    <GraduationCap size={13} className="text-indigo-600" />
                    <span>Institution / Department</span>
                  </label>
                  <input
                    id="meta-institution"
                    type="text"
                    value={formData.institution || ''}
                    onChange={(e) => handleInputChange('institution', e.target.value)}
                    placeholder="e.g. Department of Mathematics"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                {/* Creation Date */}
                <div className="space-y-1.5">
                  <label htmlFor="meta-date" className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                    <Calendar size={13} className="text-indigo-600" />
                    <span>Creation Date</span>
                  </label>
                  <input
                    id="meta-date"
                    type="date"
                    value={formData.creationDate || ''}
                    onChange={(e) => handleInputChange('creationDate', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Copyright / License */}
              <div className="space-y-1.5">
                <label htmlFor="meta-copyright" className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                  <Copyright size={13} className="text-indigo-600" />
                  <span>Copyright & Rights Statement</span>
                </label>
                <input
                  id="meta-copyright"
                  type="text"
                  value={formData.copyright || ''}
                  onChange={(e) => handleInputChange('copyright', e.target.value)}
                  placeholder="e.g. © 2026 K. Chen - All Rights Reserved (or CC BY 4.0)"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </>
          )}

          {/* Live Preview Box */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2 mt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-600" />
                <span>Document Properties Preview</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                Embedded in HTML &lt;head&gt;
              </span>
            </div>
            
            <div className="text-xs space-y-1 text-zinc-700 bg-white p-3 rounded-xl border border-zinc-200/60 font-mono text-[11px]">
              <div><strong className="text-zinc-900 font-sans">Title:</strong> {formData.title || '(Untitled Document)'}</div>
              {formData.author && <div><strong className="text-zinc-900 font-sans">Author:</strong> {formData.author}</div>}
              {formData.subject && <div><strong className="text-zinc-900 font-sans">Subject:</strong> {formData.subject}</div>}
              {formData.institution && <div><strong className="text-zinc-900 font-sans">Institution:</strong> {formData.institution}</div>}
              {formData.keywords && <div><strong className="text-zinc-900 font-sans">Keywords:</strong> {formData.keywords}</div>}
              {formData.creationDate && <div><strong className="text-zinc-900 font-sans">Date:</strong> {formData.creationDate}</div>}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset to automatically extracted values"
          >
            <RotateCcw size={13} />
            <span>Reset to Auto-detected</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Save Properties</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentMetadataModal;
