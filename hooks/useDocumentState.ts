import { useState, useCallback } from 'react';
import { AppState, ModelType, ThinkingLevelType } from '../types';

export const useDocumentState = () => {
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    progress: 0,
    results: [],
    error: null,
    statusMessage: 'Waiting for upload...',
    selectedModel: 'gemini-3.7-flash',
    selectedThinkingLevel: 'AUTO'
  });
  
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [pageMapping, setPageMapping] = useState<{fileIndex: number, localPageIndex: number}[]>([]);

  const setModel = useCallback((model: ModelType) => {
    setState(prev => ({ ...prev, selectedModel: model }));
  }, []);

  const setThinkingLevel = useCallback((level: ThinkingLevelType) => {
    setState(prev => ({ ...prev, selectedThinkingLevel: level }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      isProcessing: false,
      progress: 0,
      results: [],
      error: null,
      statusMessage: 'Waiting for upload...',
      selectedModel: prev.selectedModel,
      selectedThinkingLevel: prev.selectedThinkingLevel,
      currentProcessingImages: null
    }));
    setOriginalFiles([]);
    setPageMapping([]);
  }, []);

  return {
    state,
    setState,
    originalFiles,
    setOriginalFiles,
    pageMapping,
    setPageMapping,
    setModel,
    setThinkingLevel,
    reset
  };
};
