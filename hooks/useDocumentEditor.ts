import React, { useCallback } from 'react';
import { AppState } from '../types';
import { runAccessibilityAudit, enrichHtmlAccessibility, computeSemanticAccessibilityTags } from '../utils/accessibility';
import { cleanAltText, formatMathInText, formatFigureTitle, formatFigureCaption } from '../utils/dom';

export const useDocumentEditor = (
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  const saveEditedFigure = useCallback((update: { figureId: string, pageIndex: number, newSrc: string, newAlt?: string, newCaption?: string }) => {
    setState(prev => {
      const newResults = [...prev.results];
      const { figureId, pageIndex, newSrc, newAlt, newCaption } = update;
      
      const page = { ...newResults[pageIndex] };
      const figureIndex = page.figures.findIndex(f => f.id === figureId);
      
      if (figureIndex !== -1) {
        const newFigures = [...page.figures];
        const updatedFig = { ...newFigures[figureIndex], currentSrc: newSrc };
        if (newAlt !== undefined) updatedFig.alt = newAlt;
        if (newCaption !== undefined) updatedFig.caption = newCaption;
        newFigures[figureIndex] = updatedFig;
        page.figures = newFigures;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(page.html, 'text/html');
        const img = doc.querySelector(`img[data-figure-id="${figureId}"]`);
        const figure = img?.closest('figure');
        
        if (img && figure) {
          const cleanAlt = cleanAltText(newAlt || updatedFig.alt);
          img.setAttribute('src', newSrc);
          img.setAttribute('alt', cleanAlt);
          img.setAttribute('class', 'max-w-full h-auto object-contain block mx-auto max-h-[350px] p-2');
          figure.setAttribute('aria-label', `Visual figure: ${cleanAlt}`);
          
          let figcaption = figure.querySelector('figcaption');
          if (!figcaption) {
            figcaption = doc.createElement('figcaption');
            figure.appendChild(figcaption);
          }
          const rawCaption = newCaption || updatedFig.caption || "Figure";
          const formattedCaption = formatMathInText(rawCaption);
          const formattedTitle = formatMathInText(newAlt || updatedFig.alt || "Figure");
          const displayTitle = formatFigureTitle(formattedTitle);
          const displayCaption = formatFigureCaption(formattedCaption);

          if (rawCaption.length > 80) {
            figcaption.className = "p-3.5 sm:p-4 w-full bg-zinc-50 border-t border-zinc-100 text-sm text-zinc-700 font-sans leading-relaxed";
            figcaption.innerHTML = `
              <details class="group/details cursor-pointer">
                <summary class="flex items-center justify-between gap-3 font-semibold text-xs text-zinc-700 select-none outline-none cursor-pointer hover:text-indigo-900 transition-colors list-style-none [&::-webkit-details-marker]:hidden">
                  <span class="flex-1 min-w-0 pr-1 text-left leading-normal font-bold text-zinc-700">${displayTitle}</span>
                  <span class="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-zinc-200/80 hover:bg-indigo-50 hover:text-indigo-600 border border-zinc-300/70 hover:border-indigo-300 text-zinc-600 transition-all shadow-2xs" title="Toggle extra figure details" aria-label="Toggle extra figure details">
                    <svg class="w-3.5 h-3.5 transition-transform duration-200 figure-details-chevron group-open/details:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </summary>
                <div class="mt-3 pt-3 border-t border-zinc-200/60 italic text-center text-zinc-600">
                  ${displayCaption}
                </div>
              </details>
            `;
          } else {
            figcaption.className = "p-3.5 sm:p-4 w-full bg-zinc-50 border-t border-zinc-100 text-sm text-zinc-700 font-sans text-center italic leading-relaxed";
            figcaption.innerHTML = `${displayCaption}`;
          }
          
          page.html = doc.body.innerHTML;
          page.semanticTags = computeSemanticAccessibilityTags(page.html, page.title);
          page.audit = runAccessibilityAudit(page.html, pageIndex === 0);
        }
        newResults[pageIndex] = page;
      }
      
      return { ...prev, results: newResults };
    });
  }, [setState]);

  const updatePageHtml = useCallback((pageIndex: number, rawHtml: string) => {
    setState(prev => {
      const newResults = [...prev.results];
      if (newResults[pageIndex]) {
        const enrichedHtml = enrichHtmlAccessibility(rawHtml);
        const audit = runAccessibilityAudit(enrichedHtml, pageIndex === 0);
        const semanticTags = computeSemanticAccessibilityTags(enrichedHtml, newResults[pageIndex].title);
        
        newResults[pageIndex] = {
          ...newResults[pageIndex],
          html: enrichedHtml,
          audit,
          semanticTags
        };
      }
      return { ...prev, results: newResults };
    });
  }, [setState]);

  return { saveEditedFigure, updatePageHtml };
};
