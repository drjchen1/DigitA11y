import React from 'react';

interface ResetWarningModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const ResetWarningModal: React.FC<ResetWarningModalProps> = ({ onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-zinc-100">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 text-amber-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <h3 className="text-xl font-black text-zinc-900 mb-2">Unsaved Changes</h3>
        <p className="text-zinc-600 mb-8 leading-relaxed">
          You haven't downloaded your digitized notes yet. Starting a new document will permanently discard your current work.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
          >
            Go Back
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
          >
            Discard & Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetWarningModal;
