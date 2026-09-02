import { ConversionResult, LayoutMode, DocumentMetadata } from '../types';

/**
 * Generates a clean, simplified, standalone HTML document:
 * - Pure converted HTML content with MathJax 3 LaTeX rendering
 * - No toolbars, no sidebar/notetaking drawer, no font pickers, no margin note toggles, no page selector
 * - Preserves responsive styling, clean typography, tables, diagrams, and full accessibility (ARIA, semantic tags)
 */
export const generateSimplifiedHtmlDocument = (
  results: ConversionResult[],
  layoutMode: LayoutMode = 'paginated',
  stripAnnotations: boolean = false,
  metadata?: DocumentMetadata
): string => {
  const firstPageHtml = results[0]?.html || '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(firstPageHtml, 'text/html');
  const firstHeading = doc.querySelector('h1, h2, h3');
  const extractedTitle = firstHeading ? firstHeading.textContent?.trim() : 'Mathematics Document';

  const escapeXml = (str: string = '') => str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m] || m));

  const effectiveTitle = metadata?.title?.trim() || extractedTitle;
  const effectiveAuthor = metadata?.author?.trim() || '';
  const effectiveSubject = metadata?.subject?.trim() || 'Mathematics & STEM Notes';
  const effectiveDescription = metadata?.description?.trim() || `Accessible digitized mathematical notes on ${effectiveTitle}`;
  const effectiveKeywords = metadata?.keywords?.trim() || 'mathematics, STEM, lecture notes, LaTeX, MathJax, accessible math';
  const effectiveInstitution = metadata?.institution?.trim() || '';
  const effectiveCopyright = metadata?.copyright?.trim() || '';
  const effectiveDate = metadata?.creationDate?.trim() || new Date().toISOString().split('T')[0];

  const cleanResults = results.map((r, pageIndex) => {
    let processedHtml = r.html.replace(/data-figure-id="([^"]+)"/g, `data-figure-id="$1" data-page-index="${pageIndex}"`);
    const pageDoc = parser.parseFromString(processedHtml, 'text/html');
    
    // Remove editor-only UI buttons
    pageDoc.querySelectorAll('.edit-figure-btn').forEach(btn => btn.remove());
    
    // If stripAnnotations requested, hide or strip note callouts
    if (stripAnnotations) {
      pageDoc.querySelectorAll('.auto-annotation, .note-box, .callout, .annotated-note, .margin-note, aside[role="note"]').forEach(el => el.remove());
    }

    return {
      ...r,
      html: pageDoc.body.innerHTML,
      pageIndex
    };
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeXml(effectiveTitle)} - Clean HTML</title>
    ${effectiveAuthor ? `<meta name="author" content="${escapeXml(effectiveAuthor)}">` : ''}
    ${effectiveSubject ? `<meta name="subject" content="${escapeXml(effectiveSubject)}">` : ''}
    ${effectiveDescription ? `<meta name="description" content="${escapeXml(effectiveDescription)}">` : ''}
    ${effectiveKeywords ? `<meta name="keywords" content="${escapeXml(effectiveKeywords)}">` : ''}
    ${effectiveInstitution ? `<meta name="institution" content="${escapeXml(effectiveInstitution)}">` : ''}
    <meta name="dcterms.title" content="${escapeXml(effectiveTitle)}">
    ${effectiveAuthor ? `<meta name="dcterms.creator" content="${escapeXml(effectiveAuthor)}">` : ''}
    ${effectiveSubject ? `<meta name="dcterms.subject" content="${escapeXml(effectiveSubject)}">` : ''}
    ${effectiveDescription ? `<meta name="dcterms.description" content="${escapeXml(effectiveDescription)}">` : ''}
    <meta name="dcterms.created" content="${escapeXml(effectiveDate)}">
    ${effectiveCopyright ? `<meta name="dcterms.rights" content="${escapeXml(effectiveCopyright)}">` : ''}
    <meta property="og:title" content="${escapeXml(effectiveTitle)}">
    <meta property="og:description" content="${escapeXml(effectiveDescription || effectiveSubject)}">
    <meta property="og:type" content="article">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      "headline": ${JSON.stringify(effectiveTitle)},
      ${effectiveAuthor ? `"author": { "@type": "Person", "name": ${JSON.stringify(effectiveAuthor)} },` : ''}
      "about": ${JSON.stringify(effectiveSubject)},
      "description": ${JSON.stringify(effectiveDescription)},
      ${effectiveKeywords ? `"keywords": ${JSON.stringify(effectiveKeywords)},` : ''}
      ${effectiveInstitution ? `"publisher": { "@type": "Organization", "name": ${JSON.stringify(effectiveInstitution)} },` : ''}
      "datePublished": ${JSON.stringify(effectiveDate)},
      "inLanguage": "en"
    }
    </script>
    <!-- Tailwind CSS CDN for full fidelity styling of grids, cards, and diagrams -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        window.MathJax = {
            loader: { load: ['[tex]/mathtools'] },
            tex: {
                packages: { '[+]': ['mathtools'] },
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true,
                processEnvironments: true
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
            },
            startup: {
                pageReady: () => {
                    return MathJax.startup.defaultPageReady().then(() => {
                        document.querySelectorAll('mjx-container[display="true"]').forEach(el => {
                            el.setAttribute('tabindex', '0');
                            el.setAttribute('role', 'group');
                            el.setAttribute('aria-label', 'Mathematical formula');
                        });
                    });
                }
            }
        };
    </script>
    <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" id="MathJax-script"></script>
    <style>
        :root {
            --bg: #ffffff;
            --ink: #0f172a;
            --muted: #475569;
            --border: #e2e8f0;
            --accent-bg: #f8fafc;
        }
        
        * {
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--ink);
            margin: 0;
            padding: 2.5rem 1.25rem;
            line-height: 1.7;
            font-size: 1.125rem;
            -webkit-font-smoothing: antialiased;
        }

        .document-wrapper {
            max-width: 56rem;
            margin: 0 auto;
        }

        .page-block {
            margin-bottom: 3.5rem;
            padding-bottom: 2.5rem;
            border-bottom: 1px solid var(--border);
        }

        .page-block:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }

        .page-number-badge {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--muted);
            background: var(--accent-bg);
            border: 1px solid var(--border);
            padding: 0.2rem 0.6rem;
            border-radius: 9999px;
            margin-bottom: 1.5rem;
        }

        /* Figures, Details, and Summaries */
        details summary::-webkit-details-marker {
            display: none !important;
        }
        details summary {
            list-style: none !important;
            cursor: pointer !important;
        }
        details[open] summary svg {
            transform: rotate(180deg);
        }

        /* Responsive horizontal scroll for wide math equations */
        mjx-container[display="true"] {
            overflow-x: auto;
            overflow-y: hidden;
            max-width: 100%;
            padding: 0.75rem 0;
            margin: 1.25rem 0 !important;
            outline: none;
        }

        /* Accessible Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            font-size: 1rem;
        }

        th, td {
            border: 1px solid var(--border);
            padding: 0.75rem 1rem;
            text-align: left;
        }

        th {
            background-color: var(--accent-bg);
            font-weight: 700;
        }

        /* Figures & SVGs */
        figure {
            margin: 2rem 0;
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 1rem;
            overflow: hidden;
            text-align: center;
        }

        figure img, figure svg {
            max-width: 100%;
            height: auto;
            display: inline-block;
        }

        figcaption {
            background: var(--accent-bg);
            border-top: 1px solid var(--border);
            padding: 1rem;
            text-align: left;
        }

        /* Notes & Callouts */
        .auto-annotation, .note-box, .callout, .annotated-note, .margin-note, aside[role="note"] {
            background-color: #f8fafc;
            border-left: 4px solid #6366f1;
            padding: 1rem 1.25rem;
            margin: 1.5rem 0;
            border-radius: 0 0.5rem 0.5rem 0;
            font-size: 0.95rem;
        }

        /* Print optimizations */
        @media print {
            body {
                padding: 0;
            }
            .page-block {
                page-break-after: always;
                border-bottom: none;
            }
            .page-number-badge {
                display: none;
            }
        }
    </style>
</head>
<body>
    <main class="document-wrapper">
        ${cleanResults.map((r, idx) => `
        <article class="page-block" id="page-${r.pageNumber}">
            ${results.length > 1 ? `<div class="page-number-badge">Page ${r.pageNumber}</div>` : ''}
            <div class="math-content">
                ${r.html}
            </div>
        </article>
        `).join('\n')}
    </main>

    <script>
        // Collapsible Details Interactive Typesetting
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('details').forEach(function(details) {
                details.addEventListener('toggle', function() {
                    if (this.open && window.MathJax && window.MathJax.typesetPromise) {
                        try {
                            window.MathJax.typesetClear([this]);
                            window.MathJax.typesetPromise([this]).catch(function(err) {
                                console.error('MathJax details typeset error:', err);
                            });
                        } catch (e) {
                            console.error('MathJax error:', e);
                        }
                    }
                });
            });
        });
    </script>
</body>
</html>`;
};
