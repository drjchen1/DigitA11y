import { useDocumentState } from './useDocumentState';
import { useDocumentProcessing } from './useDocumentProcessing';
import { useDocumentEditor } from './useDocumentEditor';

export const useDigitization = (onApiCall?: () => void) => {
  const {
    state,
    setState,
    originalFiles,
    setOriginalFiles,
    pageMapping,
    setPageMapping,
    setModel,
    setThinkingLevel,
    setMathAnnotationStyle,
    setPageProcessingMode,
    reset
  } = useDocumentState();

  const { handleFileUpload, reprocessPage } = useDocumentProcessing(
    state,
    setState,
    originalFiles,
    setOriginalFiles,
    pageMapping,
    setPageMapping,
    onApiCall
  );

  const { saveEditedFigure, updatePageHtml } = useDocumentEditor(setState);

  return {
    state,
    originalFiles,
    pageMapping,
    handleFileUpload,
    reprocessPage,
    saveEditedFigure,
    updatePageHtml,
    setModel,
    setThinkingLevel,
    setMathAnnotationStyle,
    setPageProcessingMode,
    reset
  };
};
