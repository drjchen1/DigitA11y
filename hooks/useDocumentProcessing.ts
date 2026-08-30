import React, { useCallback } from 'react';
import { AppState, ConversionResult, ModelType, ThinkingLevelType } from '../types';
import { pdfToImageData } from '../services/pdfService';
import { convertBatchToHtml } from '../services/geminiService';
import { runAccessibilityAudit, enrichHtmlAccessibility, computeSemanticAccessibilityTags } from '../utils/accessibility';
import { cropImage } from '../utils/image';
import { cleanAltText, fixHeadingOrder, replaceFigureInHtml, formatMathInText } from '../utils/dom';
import { optimizeImageForGemini } from '../utils/imageOptimizer';

export const useDocumentProcessing = (
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  originalFiles: File[],
  setOriginalFiles: React.Dispatch<React.SetStateAction<File[]>>,
  pageMapping: {fileIndex: number, localPageIndex: number}[],
  setPageMapping: React.Dispatch<React.SetStateAction<{fileIndex: number, localPageIndex: number}[]>>,
  onApiCall?: () => void
) => {

  const handleFileUpload = async (files: File[], model: ModelType = 'gemini-3.7-flash', thinkingLevel: ThinkingLevelType = 'AUTO') => {
    if (!files || files.length === 0) return;

    setOriginalFiles(files);
    const startTime = Date.now();

    setState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      results: [],
      error: null,
      statusMessage: 'Reading files...',
      actualModelUsed: model
    }));

    try {
      let pageData: any[] = [];
      const mapping: {fileIndex: number, localPageIndex: number}[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const data = await pdfToImageData(files[i], true);
        pageData = pageData.concat(data);
        for (let j = 0; j < data.length; j++) {
          mapping.push({ fileIndex: i, localPageIndex: j });
        }
      }

      setPageMapping(mapping);
      
      const totalPages = pageData.length;
      
      setState(prev => ({ ...prev, progress: 10, statusMessage: 'Analyzing document structure...' }));
      
      const BATCH_SIZE = 2;
      const CONCURRENCY_LIMIT = 2;
      const results: ConversionResult[] = new Array(totalPages);
      let completedPages = 0;
      
      const progressPerPage = 90 / totalPages;
      const OPTIMIZATION_WEIGHT = 0.2;
      const AI_WEIGHT = 0.6;
      const FIGURE_WEIGHT = 0.2;

      const processBatch = async (batchIndices: number[]) => {
        try {
          setState(prev => {
            const current = prev.currentProcessingImages || [];
            const newImages = batchIndices.map(idx => pageData[idx].base64);
            return {
              ...prev, 
              statusMessage: `Optimizing images for Pages ${batchIndices.map(i => i + 1).join(', ')}...`,
              currentProcessingImages: [...current, ...newImages]
            };
          });

          const batchImages = await Promise.all(batchIndices.map(async idx => {
            const optimized = await optimizeImageForGemini(pageData[idx].base64);
            return {
              base64: optimized,
              pageNumber: idx + 1
            };
          }));

          setState(prev => {
            return {
              ...prev, 
              progress: Math.min(99, prev.progress + (batchIndices.length * progressPerPage * OPTIMIZATION_WEIGHT)),
              statusMessage: `Digitizing Pages ${batchIndices.map(i => i + 1).join(', ')}...`
            };
          });

          const batchResponses = await convertBatchToHtml(batchImages, model, thinkingLevel, (fallbackModel) => {
            setState(prev => ({ ...prev, actualModelUsed: fallbackModel }));
          });

          onApiCall?.();

          setState(prev => ({ 
            ...prev, 
            progress: Math.min(99, prev.progress + (batchIndices.length * progressPerPage * AI_WEIGHT)),
            statusMessage: `Processing mathematical figures for Pages ${batchIndices.map(i => i + 1).join(', ')}...`,
            actualModelUsed: batchResponses.actualModelUsed
          }));

          for (let k = 0; k < batchIndices.length; k++) {
            const i = batchIndices[k];
            const geminiResponse = batchResponses.pages[k];
            
            if (!geminiResponse) continue;

            let finalHtml = geminiResponse.html;
            
            const figureResults = geminiResponse.figures.map((fig) => {
              const screenshotBase64 = cropImage(pageData[i].canvas, fig);
              return {
                id: fig.id,
                originalSrc: screenshotBase64,
                currentSrc: screenshotBase64,
                alt: fig.alt,
                caption: fig.caption || "Figure"
              };
            });
            
            figureResults.forEach(figResult => {
              const cleanAlt = cleanAltText(figResult.alt);
              const rawCaption = figResult.caption || "Figure";
              const formattedCaption = formatMathInText(rawCaption);
              const formattedTitle = formatMathInText(figResult.alt || "Figure");

              const figcaptionContent = rawCaption.length > 80 
                ? `<figcaption class="p-4 w-full bg-zinc-50 border-t border-zinc-100 text-sm text-zinc-700 font-sans leading-relaxed">
                    <details class="group/details cursor-pointer">
                      <summary class="flex items-center justify-between font-bold text-xs tracking-wider text-zinc-600 select-none outline-none focus:text-indigo-900 focus:underline list-style-none [&::-webkit-details-marker]:hidden">
                        <span>Figure: ${formattedTitle}</span>
                        <span class="flex items-center gap-1.5 text-indigo-900 text-[10px] font-black uppercase tracking-widest bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md">
                          Show Details
                          <svg class="w-3.5 h-3.5 transition-transform duration-200 group-open/details:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </span>
                      </summary>
                      <div class="mt-3 pt-3 border-t border-zinc-200/60 italic text-center text-zinc-600">
                        ${formattedCaption}
                      </div>
                    </details>
                  </figcaption>`
                : `<figcaption class="p-4 w-full bg-zinc-50 border-t border-zinc-100 text-sm text-zinc-700 font-sans text-center italic leading-relaxed">
                    Figure: ${formattedCaption}
                  </figcaption>`;

              const figureHtml = `
                <figure class="my-8 relative overflow-x-auto rounded-2xl shadow-sm border border-zinc-200 bg-white flex flex-col items-center group/fig min-w-0 box-border max-w-full" role="group" aria-label="Visual figure: ${cleanAlt}">
                  <img src="${figResult.currentSrc}" alt="${cleanAlt}" class="max-w-full h-auto" data-figure-id="${figResult.id}">
                  <button class="edit-figure-btn absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg opacity-0 group-hover/fig:opacity-100 transition-all hover:bg-indigo-700 hover:text-white" data-figure-id="${figResult.id}" title="Edit Figure">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  ${figcaptionContent}
                </figure>
              `;

              finalHtml = replaceFigureInHtml(finalHtml, figResult.id, figureHtml);
            });

            finalHtml = fixHeadingOrder(finalHtml);
            finalHtml = enrichHtmlAccessibility(finalHtml);
            const audit = runAccessibilityAudit(finalHtml, i === 0);
            const semanticTags = geminiResponse.semanticTags || computeSemanticAccessibilityTags(finalHtml, geminiResponse.title);

            results[i] = { 
              html: finalHtml, 
              pageNumber: i + 1,
              title: geminiResponse.title || semanticTags.pageTitle,
              width: pageData[i].width,
              height: pageData[i].height,
              audit,
              figures: figureResults,
              semanticTags
            };

            completedPages++;

            setState(prev => {
              const current = prev.currentProcessingImages || [];
              const imgToRemove = pageData[i].base64;
              return {
                ...prev,
                progress: Math.min(99, prev.progress + (progressPerPage * FIGURE_WEIGHT)),
                statusMessage: `Completed ${completedPages} of ${totalPages} pages...`,
                results: results.filter(r => r !== undefined).sort((a, b) => a.pageNumber - b.pageNumber),
                currentProcessingImages: current.filter(img => img !== imgToRemove)
              };
            });
          }
        } catch (err: any) {
          console.error(`Error processing batch ${batchIndices}:`, err);
          throw err;
        }
      };

      const batches = [];
      for (let i = 0; i < totalPages; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && i + j < totalPages; j++) {
          batch.push(i + j);
        }
        batches.push(batch);
      }

      for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
        const chunk = batches.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(chunk.map(processBatch));
      }

      const totalTime = Math.floor((Date.now() - startTime) / 1000);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        statusMessage: 'Conversion Complete!',
        totalTime,
        currentProcessingImages: null
      }));

    } catch (err: any) {
      console.error("Error processing documents:", err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        statusMessage: 'Error processing files',
        error: err.message || 'An unknown error occurred during processing.',
        currentProcessingImages: null
      }));
    }
  };

  const reprocessPage = async (pageIndex: number, model: ModelType = 'gemini-3.7-flash', thinkingLevel: ThinkingLevelType = 'AUTO') => {
    if (!originalFiles || originalFiles.length === 0) return;
    
    setState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      statusMessage: `Reprocessing Page ${pageIndex + 1}...`,
      actualModelUsed: model
    }));

    try {
      let fileIndex = 0;
      let localPageIndex = pageIndex;
      
      const mapping = pageMapping[pageIndex];
      if (mapping) {
        fileIndex = mapping.fileIndex;
        localPageIndex = mapping.localPageIndex;
      }

      const file = originalFiles[fileIndex];
      if (!file) throw new Error("Original file not found");

      const pageData = await pdfToImageData(file, false, [localPageIndex + 1]);
      
      if (!pageData || pageData.length === 0) {
        throw new Error("Failed to extract image for reprocessing");
      }

      setState(prev => ({
        ...prev,
        progress: 30,
        statusMessage: `Optimizing image for Page ${pageIndex + 1}...`,
        currentProcessingImages: [pageData[0].base64]
      }));

      const optimizedImage = await optimizeImageForGemini(pageData[0].base64);

      setState(prev => ({
        ...prev,
        progress: 50,
        statusMessage: `Digitizing Page ${pageIndex + 1}...`
      }));

      const batchImages = [{ base64: optimizedImage, pageNumber: pageIndex + 1 }];
      const batchResponses = await convertBatchToHtml(batchImages, model, thinkingLevel, (fallbackModel) => {
        setState(prev => ({ ...prev, actualModelUsed: fallbackModel }));
      });
      
      onApiCall?.();

      const geminiResponse = batchResponses.pages[0];
      if (!geminiResponse) throw new Error("No response received from AI model");

      setState(prev => ({
        ...prev,
        progress: 80,
        statusMessage: `Processing mathematical figures for Page ${pageIndex + 1}...`,
        actualModelUsed: batchResponses.actualModelUsed
      }));

      let finalHtml = geminiResponse.html;
      
      const figureResults = geminiResponse.figures.map((fig) => {
        const screenshotBase64 = cropImage(pageData[0].canvas, fig);
        return {
          id: fig.id,
          originalSrc: screenshotBase64,
          currentSrc: screenshotBase64,
          alt: fig.alt,
          caption: fig.caption || "Figure"
        };
      });
      
      figureResults.forEach(figResult => {
        const cleanAlt = cleanAltText(figResult.alt);
        const rawCaption = figResult.caption || "Figure";
        const formattedCaption = formatMathInText(rawCaption);
        const formattedTitle = formatMathInText(figResult.alt || "Figure");

        const figcaptionContent = rawCaption.length > 80 
          ? `<figcaption class="p-4 w-full bg-zinc-50 border-t border-zinc-100 text-sm text-zinc-700 font-sans leading-relaxed">
              <details class="group/details cursor-pointer">
                <summary class="flex items-center justify-between font-bold text-xs tracking-wider text-zinc-600 select-none outline-none focus:text-indigo-900 focus:underline list-style-none [&::-webkit-details-marker]:hidden">
                  <span>Figure: ${formattedTitle}</span>
                  <span class="flex items-center gap-1.5 text-indigo-900 text-[10px] font-black uppercase tracking-widest bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md">
                    Show Details
                    <svg class="w-3.5 h-3.5 transition-transform duration-200 group-open/details:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </summary>
                <div class="mt-3 pt-3 border-t border-zinc-200/60 italic text-center text-zinc-600">
                  ${formattedCaption}
                </div>
              </details>
            </figcaption>`
          : `<figcaption class="p-4 w-full bg-zinc-50 border-t border-zinc-100 text-sm text-zinc-700 font-sans text-center italic leading-relaxed">
              Figure: ${formattedCaption}
            </figcaption>`;

        const figureHtml = `
          <figure class="my-8 relative overflow-x-auto rounded-2xl shadow-sm border border-zinc-200 bg-white flex flex-col items-center group/fig min-w-0 box-border max-w-full" role="group" aria-label="Visual figure: ${cleanAlt}">
            <img src="${figResult.currentSrc}" alt="${cleanAlt}" class="max-w-full h-auto" data-figure-id="${figResult.id}">
            <button class="edit-figure-btn absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg opacity-0 group-hover/fig:opacity-100 transition-all hover:bg-indigo-700 hover:text-white" data-figure-id="${figResult.id}" title="Edit Figure">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            ${figcaptionContent}
          </figure>
        `;

        finalHtml = replaceFigureInHtml(finalHtml, figResult.id, figureHtml);
      });

      finalHtml = fixHeadingOrder(finalHtml);
      finalHtml = enrichHtmlAccessibility(finalHtml);
      const audit = runAccessibilityAudit(finalHtml, pageIndex === 0);
      const semanticTags = geminiResponse.semanticTags || computeSemanticAccessibilityTags(finalHtml, geminiResponse.title);

      setState(prev => {
        const newResults = [...prev.results];
        const existingIndex = newResults.findIndex(r => r.pageNumber === pageIndex + 1);
        
        const newPageResult = { 
          html: finalHtml, 
          pageNumber: pageIndex + 1,
          title: geminiResponse.title || semanticTags.pageTitle,
          width: pageData[0].width,
          height: pageData[0].height,
          audit,
          figures: figureResults,
          semanticTags
        };

        if (existingIndex >= 0) {
          newResults[existingIndex] = newPageResult;
        } else {
          newResults.push(newPageResult);
          newResults.sort((a, b) => a.pageNumber - b.pageNumber);
        }

        return {
          ...prev,
          isProcessing: false,
          progress: 100,
          statusMessage: 'Reprocessing Complete!',
          results: newResults,
          currentProcessingImages: null
        };
      });

    } catch (err: any) {
      console.error("Error reprocessing page:", err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        statusMessage: 'Error reprocessing page',
        error: `Failed to reprocess page ${pageIndex + 1}.|Please try again.`,
        currentProcessingImages: null
      }));
    }
  };

  return { handleFileUpload, reprocessPage };
};
