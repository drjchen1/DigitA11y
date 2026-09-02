import { ConversionResult, LayoutMode, DocumentMetadata } from '../types';

export const generateHtmlDocument = (
  results: ConversionResult[],
  originalFileName: string,
  layoutMode: LayoutMode,
  isReadingMode: boolean = false,
  highContrastTheme: string = 'default',
  textSize: number = 100,
  fontPreference: string = 'inter',
  lineHeight: string = 'normal',
  metadata?: DocumentMetadata
): string => {
  const firstPageHtml = results[0]?.html || '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(firstPageHtml, 'text/html');
  const firstHeading = doc.querySelector('h1, h2, h3');
  const extractedTitle = firstHeading ? firstHeading.textContent?.trim() : 'Mathematics Course Notes';

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
    let hIdx = 0;
    // Add figure IDs
    let processedHtml = r.html.replace(/data-figure-id="([^"]+)"/g, `data-figure-id="$1" data-page-index="${pageIndex}"`);
    // Add TOC ids to headings if missing
    processedHtml = processedHtml.replace(/<(h[1-3])([^>]*)>/gi, (match, tag, attrs) => {
      if (attrs.includes('id=')) return match;
      return `<${tag} id="heading-p${pageIndex}-${hIdx++}"${attrs}>`;
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(processedHtml, 'text/html');
    doc.querySelectorAll('.edit-figure-btn').forEach(btn => btn.remove());
    return { ...r, html: doc.body.innerHTML, pageIndex };
  });

  const tocItems: { id: string; text: string; level: number; pageNumber: number }[] = [];
  cleanResults.forEach(r => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(r.html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');
    headings.forEach(h => {
      const id = h.getAttribute('id');
      if (id) {
        tocItems.push({
          id,
          text: h.innerHTML, // Using innerHTML to preserve math formulas
          level: parseInt(h.tagName.substring(1)),
          pageNumber: r.pageNumber
        });
      }
    });
  });

  const tocHTML = tocItems.length > 0 ? `
    <ul class="nav-list toc-list">
      ${tocItems.map(item => `
        <li class="toc-level-${item.level}">
          <a href="#${item.id}" class="nav-link toc-link" onclick="if(window.MathJax) { setTimeout(() => window.MathJax.typesetPromise([document.getElementById('${item.id}')]), 100); }">
            ${item.level === 1 ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline; margin-right:4px;"><polyline points="9 18 15 12 9 6"></polyline></svg>` : ''}
            <span>${item.text}</span>
          </a>
        </li>
      `).join('')}
    </ul>
  ` : '<div style="font-size: 0.75rem; color: #64748b;">No headings found.</div>';


  const totalMarginNotes = cleanResults.reduce((acc, r) => {
    const matches = (r.html || '').match(/class=["'][^"']*(?:auto-annotation|note-box|callout|annotated-note|margin-note)[^"']*["']|<aside[^>]*role=["']note["']/gi);
    return acc + (matches ? matches.length : 0);
  }, 0);

  const getThemeColors = () => {
    if (!isReadingMode) return '';
    switch (highContrastTheme) {
      case 'hc-dark': return '--bg: #000000 !important; --ink: #ffffff !important; --heading-color: #ffffff !important; --accent: #333333 !important;';
      case 'hc-light': return '--bg: #ffffff !important; --ink: #000000 !important; --heading-color: #000000 !important; --accent: #f5f5f5 !important;';
      case 'hc-yellow': return '--bg: #000000 !important; --ink: #ffff00 !important; --heading-color: #ffff00 !important; --accent: #333333 !important;';
      case 'hc-blue': return '--bg: #ffff00 !important; --ink: #000080 !important; --heading-color: #000080 !important; --accent: #ffffcc !important;';
      case 'hc-green': return '--bg: #000000 !important; --ink: #00ff00 !important; --heading-color: #00ff00 !important; --accent: #333333 !important;';
      default: return '--bg: #ffffff !important; --ink: #0f172a !important; --heading-color: #0f172a !important; --accent: #C5A059 !important;';
    }
  };

  const getFontFamily = () => {
    if (!isReadingMode) return '';
    return "font-family: var(--math-font-family, 'Inter', sans-serif) !important;";
  };

  const articleStyles = isReadingMode ? `
    .math-content {
      font-size: ${textSize}% !important;
      line-height: ${lineHeight === 'extra' ? '2.2' : '1.7'} !important;
      letter-spacing: ${lineHeight === 'extra' ? '0.05em' : 'normal'} !important;
    }
    .page-article {
      background: var(--bg) !important;
      color: var(--ink) !important;
      border: 1px solid var(--ink) !important;
      box-shadow: none !important;
    }
    .math-content h1, .math-content h2, .math-content h3, .math-content p, .math-content li, .math-content a, .math-content span {
       color: var(--ink) !important;
       ${getFontFamily()}
    }
    .math-content .math-content {
       ${getFontFamily()}
    }
    mjx-container, mjx-container * {
      fill: var(--ink) !important;
      stroke: var(--ink) !important;
      color: var(--ink) !important;
    }
    .notebox {
      background-color: var(--accent) !important;
      color: var(--ink) !important;
      border-left: 4px solid var(--ink) !important;
      border-top: 1px solid var(--ink) !important;
      border-right: 1px solid var(--ink) !important;
      border-bottom: 1px solid var(--ink) !important;
    }
    figure {
      background-color: var(--bg) !important;
      border: 1px solid var(--ink) !important;
      border-radius: 1rem !important;
      overflow: hidden !important;
      padding: 0 !important;
      box-shadow: none !important;
    }
    figcaption {
      color: var(--ink) !important;
      background-color: var(--accent) !important;
      width: 100% !important;
    }
    table, th, td {
      border: 1px solid var(--ink) !important;
      color: var(--ink) !important;
      background-color: var(--bg) !important;
    }
    .math-content mjx-container[display="true"] {
      background: transparent !important;
    }
    .sidebar {
      background: var(--bg) !important;
      border: 1px solid var(--ink) !important;
    }
    .nav-link {
      color: var(--ink) !important;
    }
    .nav-link.active-nav-link {
      background-color: var(--accent) !important;
      color: var(--ink) !important;
      border-left-color: var(--ink) !important;
    }
    .nav-link:hover {
      background-color: var(--accent) !important;
      opacity: 0.8;
    }
    .header {
      border-bottom-color: var(--ink) !important;
    }
    .btn-outline {
      border-color: var(--ink) !important;
      color: var(--ink) !important;
    }
    .font-size-control {
      border-color: var(--ink) !important;
      color: var(--ink) !important;
    }
    .font-size-control span {
      color: var(--ink) !important;
    }
    .btn-font-menu {
      color: var(--ink) !important;
    }
    .btn-font-menu:hover, .btn-font-menu[aria-expanded="true"] {
      background-color: var(--accent) !important;
      color: var(--ink) !important;
    }
    .font-menu-dropdown {
      background: var(--bg) !important;
      border-color: var(--ink) !important;
      color: var(--ink) !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
    }
    .font-menu-header {
      color: var(--ink) !important;
      opacity: 0.8 !important;
    }
    .font-menu-option {
      color: var(--ink) !important;
    }
    .font-menu-option:hover {
      background-color: var(--accent) !important;
      color: var(--ink) !important;
    }
    .font-menu-option.active {
      background-color: var(--accent) !important;
      color: var(--ink) !important;
      font-weight: bold;
    }
    .font-opt-name {
      color: var(--ink) !important;
    }
    .font-opt-sub {
      color: var(--ink) !important;
      opacity: 0.85 !important;
    }
    .font-opt-check {
      color: var(--ink) !important;
    }
    .btn-font-size {
      color: var(--ink) !important;
    }
    .btn-font-size:hover {
      background-color: var(--accent) !important;
      opacity: 0.8;
    }
    .btn-primary {
      background-color: var(--accent) !important;
      color: var(--ink) !important;
      border: 1px solid var(--ink) !important;
    }
    .sidebar h2 {
      color: var(--ink) !important;
    }
    .page-badge {
      color: var(--ink) !important;
      background: var(--accent) !important;
      border: 1px solid var(--ink) !important;
    }
    .continuous-separator {
      border-color: var(--ink) !important;
    }
    .continuous-badge {
      color: var(--ink) !important;
      background: var(--bg) !important;
    }
  ` : '';

  const toolbarHTML = `
    <div id="annotation-toolbar" class="annotation-toolbar no-print">
        <button id="btn-draw" class="annotation-btn" title="Draw on the page">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
            Draw
        </button>
        <button id="btn-erase" class="annotation-btn" title="Erase drawings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20H20V20Z"></path><path d="M17 14L7 14"></path></svg>
            Erase
        </button>
        <button id="btn-highlight" class="annotation-btn" title="Highlight text">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Highlight
        </button>
        <button id="btn-add-note" class="annotation-btn" title="Add a sticky note at cursor">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Note
        </button>
        <div style="height: 1px; width: 100%; background: #e2e8f0; margin: 4px 0;"></div>
        
        <div class="toolbar-controls" title="Stroke Options" style="display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem 0; width: 100%;">
            <div style="display: flex; justify-content: space-between; width: 100%;" id="color-swatches">
                <button class="color-swatch active" data-color="#000000" style="background: #000000;" aria-label="Black"></button>
                <button class="color-swatch" data-color="#ef4444" style="background: #ef4444;" aria-label="Red"></button>
                <button class="color-swatch" data-color="#3b82f6" style="background: #3b82f6;" aria-label="Blue"></button>
                <button class="color-swatch" data-color="#22c55e" style="background: #22c55e;" aria-label="Green"></button>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; width: 100%; color: #64748b;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"></circle></svg>
                <input type="range" id="draw-thickness" min="1" max="10" value="3" aria-label="Thickness" style="flex: 1; min-width: 0; width: 100%; margin: 0; cursor: pointer;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>
            </div>
        </div>

        <button id="btn-undo" class="annotation-btn" title="Undo last action">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
            Undo
        </button>
        <button id="btn-clear-all" class="annotation-btn" title="Clear all annotations" style="color: #ef4444;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Clear All
        </button>
        <button id="btn-save-html" class="annotation-btn" title="Save your annotations to a new HTML file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            Save Edits
        </button>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeXml(effectiveTitle)} - Accessible Math Notes</title>
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
                            el.setAttribute('aria-label', 'Mathematical formula. Use arrow keys or swipe to scroll if cropped.');
                            el.addEventListener('scroll', () => {
                                if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
                                    el.classList.add('is-scrolled');
                                } else {
                                    el.classList.remove('is-scrolled');
                                }
                            });
                        });
                    });
                }
            }
        };
    </script>
    <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" id="MathJax-script"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Code:wght@400;600;700&family=Inter:wght@400;600;800;900&family=Lexend:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/open-dyslexic.min.css');
        
        :root {
            --bg: #FDFBF7;
            --ink: #1E293B;
            --heading-color: #0f172a;
            --accent: #C5A059;
            --link-color: #5c4e31;
            --math-font-family: ${
              fontPreference === 'atkinson' ? "'Atkinson Hyperlegible', sans-serif" :
              fontPreference === 'mono' ? "'Fira Code', monospace" :
              fontPreference === 'lexend' ? "'Lexend', sans-serif" :
              fontPreference === 'opendyslexic' ? "'OpenDyslexic', sans-serif" :
              fontPreference === 'lora' ? "'Lora', serif" :
              "'Inter', sans-serif"
            };
            --math-heading-font-family: ${
              fontPreference === 'lora' ? "'Inter', sans-serif" :
              fontPreference === 'atkinson' ? "'Atkinson Hyperlegible', sans-serif" :
              fontPreference === 'mono' ? "'Fira Code', monospace" :
              fontPreference === 'lexend' ? "'Lexend', sans-serif" :
              fontPreference === 'opendyslexic' ? "'OpenDyslexic', sans-serif" :
              "'Inter', sans-serif"
            };
            ${getThemeColors()}
        }

        ${articleStyles}

        body { 
            font-family: 'Inter', system-ui, sans-serif; 
            background-color: var(--bg); 
            color: var(--ink); 
            margin: 0; 
            padding: 0; 
            line-height: 1.7;
            font-size: 1.125rem;
        }

        *:focus-visible {
            outline: 3px solid #0f172a !important;
            outline-offset: 2px !important;
            border-radius: 2px;
        }

        mjx-container[display="true"]:focus-visible {
            outline: 3px solid #0f172a !important;
            outline-offset: 4px !important;
            background-color: rgba(206, 184, 136, 0.05) !important;
        }

        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--accent);
            color: #000;
            padding: 8px;
            z-index: 100;
            transition: top 0.2s;
            font-family: 'Inter', sans-serif;
            font-weight: bold;
            text-decoration: none;
        }
        .skip-link:focus {
            top: 0;
        }

        .container {
            width: 100%;
            margin: 0 auto;
            padding: 1rem;
            transition: all 0.3s ease;
        }

        @media (min-width: 1024px) {
            .container {
                padding: 2rem;
            }
            .layout {
                display: grid;
                grid-template-columns: 200px 1fr;
                gap: 2rem;
                align-items: start;
                padding-top: 4rem;
                transition: all 0.3s ease;
                max-width: 1600px;
                margin: 0 auto;
            }
            .sidebar-hidden.container {
                padding: 0;
                max-width: none;
            }
            .sidebar-hidden .layout.sidebar-hidden {
                grid-template-columns: 1fr;
                gap: 0;
                max-width: none;
                width: 100%;
                margin: 0;
            }
            .sidebar-hidden article {
                background: transparent !important;
                box-shadow: none !important;
                padding: 2rem 0 !important;
                position: relative;
                width: 100%;
            }
            .sidebar-hidden .download-btn-wrapper {
                position: fixed;
                right: 3rem !important;
                top: 2rem !important;
                z-index: 50;
            }
            .sidebar-hidden .page-badge {
                position: absolute;
                left: 3rem;
                top: 2rem;
                margin: 0;
                z-index: 10;
            }
            .sidebar-hidden .download-btn-wrapper a {
                background: var(--accent);
                color: #000;
                border: 2px solid #000;
                font-weight: 700;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
                transition: transform 0.2s ease, background-color 0.2s ease;
            }
            .sidebar-hidden .download-btn-wrapper a:hover {
                transform: translateY(-2px);
                background: #e2cf9f;
            }
            .sidebar-hidden .download-btn-wrapper span {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border-width: 0;
            }
        }

        .header {
            position: relative;
            z-index: 110;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid #f1f5f9;
        }

        .title {
            font-size: 1.875rem;
            font-weight: 800;
            color: var(--heading-color);
            letter-spacing: -0.025em;
            margin: 0;
        }

        .controls {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            text-decoration: none;
        }

        .btn-primary {
            background-color: var(--accent);
            color: #000000;
            border: 1.5px solid #000000;
            font-weight: 800;
        }

        .btn-primary:hover {
            background-color: #B19B69;
            color: #000000;
            transform: translateY(-1px);
        }

        .btn-outline {
            background-color: transparent;
            border: 2px solid #e2e8f0;
            color: #334155;
        }

        .btn-outline:hover {
            border-color: #cbd5e1;
            color: #0f172a;
        }

        .font-size-control {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.4rem 0.75rem;
            border-radius: 0.75rem;
            border: 2px solid #e2e8f0;
            background-color: transparent;
            color: var(--ink);
            height: 42px;
            box-sizing: border-box;
        }

        .font-size-control span {
            font-family: 'Inter', sans-serif;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            margin: 0 0.25rem;
            user-select: none;
        }

        .btn-font-menu {
            background: none;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 6px;
            border-radius: 6px;
            font-family: 'Inter', sans-serif;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            transition: all 0.15s ease;
            user-select: none;
        }

        .btn-font-menu:hover, .btn-font-menu[aria-expanded="true"] {
            background-color: rgba(0, 0, 0, 0.06);
            color: #0f172a;
        }

        .btn-font-menu .font-menu-arrow {
            transition: transform 0.2s ease;
        }

        .btn-font-menu[aria-expanded="true"] .font-menu-arrow {
            transform: rotate(180deg);
        }

        .font-menu-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            min-width: 270px;
            background: #ffffff;
            border-radius: 0.875rem;
            box-shadow: 0 12px 30px -4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.06);
            border: 1.5px solid #e2e8f0;
            padding: 0.5rem;
            z-index: 200;
            opacity: 0;
            transform: translateY(-6px) scale(0.97);
            pointer-events: none;
            transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .font-menu-dropdown.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        .font-menu-header {
            font-size: 0.6875rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
            padding: 0.375rem 0.625rem 0.25rem 0.625rem;
            font-family: 'Inter', sans-serif;
        }

        .font-menu-option {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 0.5rem 0.625rem;
            border: none;
            background: none;
            border-radius: 0.5rem;
            text-align: left;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .font-menu-option:hover {
            background-color: #f8fafc;
        }

        .font-menu-option.active {
            background-color: #f1f5f9;
        }

        .font-opt-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .font-opt-name {
            font-size: 0.875rem;
            font-weight: 600;
            color: #0f172a;
            line-height: 1.3;
        }

        .font-opt-sub {
            font-size: 0.6875rem;
            color: #64748b;
            font-family: 'Inter', sans-serif;
        }

        .font-opt-check {
            color: #4f46e5;
            font-weight: 800;
            font-size: 0.875rem;
            opacity: 0;
            margin-left: 0.5rem;
        }

        .font-menu-option.active .font-opt-check {
            opacity: 1;
        }

        .btn-font-size {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 0.375rem;
            color: var(--ink);
            transition: all 0.15s;
            padding: 0;
        }

        .btn-font-size:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }

        .sidebar {
            position: sticky;
            top: 2rem;
            z-index: 110;
            transition: all 0.3s ease;
            max-height: calc(100vh - 4rem);
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .sidebar.hidden {
            transform: translateX(-150%);
            opacity: 0;
            position: absolute;
            pointer-events: none;
        }
        
        .sidebar-box {
            background: white;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            border: 1px solid #f1f5f9;
        }

        .nav-list-container {
            overflow-y: auto;
            flex: 0 1 auto;
            max-height: 35vh;
        }

        .nav-list-container::-webkit-scrollbar,
        .annotation-toolbar::-webkit-scrollbar {
            width: 4px;
        }
        .nav-list-container::-webkit-scrollbar-track,
        .annotation-toolbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .nav-list-container::-webkit-scrollbar-thumb,
        .annotation-toolbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }

        .nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
        }

        .nav-link {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            color: #334155;
            background-color: #f8fafc;
            text-decoration: none;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 0.875rem;
            transition: all 0.2s;
            border: 2px solid transparent;
        }

        .nav-link:hover {
            background-color: #e2e8f0;
            color: #0f172a;
        }

        .nav-link.active-nav-link {
            background-color: var(--accent);
            color: #000;
            border-color: #000;
            font-weight: 800;
        }

        .page-article {
            background: white;
            border-radius: 1.5rem;
            padding: 3rem;
            margin-bottom: 3rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
            border: 1px solid #f1f5f9;
            position: relative;
            transition: all 0.3s ease;
        }

        .page-article.content-expanded {
            padding: 0;
            box-shadow: none;
            border: none;
            background: transparent;
            margin-bottom: 0;
        }

        .sidebar-hidden .math-content {
            max-width: 1368px;
            margin: 0 auto;
            display: block;
            padding: 1.5rem;
            background: #ffffff;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border-radius: 1.5rem;
        }

        @media (min-width: 768px) {
            .sidebar-hidden .math-content {
                padding: 3rem;
            }
        }

        @media (min-width: 1024px) {
            .sidebar-hidden .math-content {
                padding: 5rem;
            }
        }

        .page-badge {
            position: absolute;
            top: -1rem;
            left: 2rem;
            background: var(--accent);
            color: #000000;
            border: 1.5px solid #000000;
            padding: 0.25rem 1rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .auto-annotation {
            display: none;
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0 0.5rem 0.5rem 0;
            color: #1e3a8a;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        .show-annotations .auto-annotation {
            display: block;
        }

        @media (max-width: 1023px) {
            .download-btn-wrapper a {
                padding: 0.5rem 1rem;
                font-size: 10px;
            }
            .sidebar-hidden .math-content {
                padding: 1.5rem;
                border-radius: 0;
                grid-template-columns: 1fr;
            }
            .sidebar-hidden .download-btn-wrapper,
            .sidebar-hidden .page-badge {
                position: relative !important;
                left: auto !important;
                right: auto !important;
                top: auto !important;
                margin-bottom: 1rem;
            }
            .sidebar-hidden .download-btn-wrapper {
                display: flex;
                justify-content: flex-end;
            }
        }

        .math-content { 
            color: var(--ink); 
            font-family: var(--math-font-family, 'Inter', sans-serif);
            font-size: 1.125rem;
            line-height: 1.8;
            max-width: 70ch;
            margin: 0 auto;
        }

        .math-content .flex > *,
        .math-content .grid > * {
            min-width: 0;
        }

        .math-content p {
            margin-bottom: 1.5rem;
        }

        .math-content h1 {
            font-family: 'Inter', sans-serif;
            font-size: 2.5rem;
            font-weight: 900;
            color: var(--heading-color);
            margin-top: 0;
            margin-bottom: 2rem;
            letter-spacing: -0.025em;
            line-height: 1.2;
            text-wrap: balance;
        }

        .math-content h2 {
            font-family: 'Inter', sans-serif;
            font-size: 1.875rem;
            font-weight: 800;
            color: var(--heading-color);
            margin-top: 3rem;
            margin-bottom: 1.5rem;
            letter-spacing: -0.025em;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 0.5rem;
            text-wrap: balance;
        }

        .math-content h3 {
            font-family: 'Inter', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--heading-color);
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            text-wrap: balance;
        }

        .math-content ul, .math-content ol {
            margin-bottom: 1.5rem;
            padding-left: 1.5rem;
        }

        .math-content li {
            margin-bottom: 0.5rem;
        }

        .math-content .notebox {
            border-left: 4px solid var(--accent);
            padding: 1.5rem 2rem;
            margin: 2.5rem 0;
            background-color: #f8fafc;
            border-radius: 0 0.75rem 0.75rem 0;
            font-style: italic;
            color: #334155;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        .math-content figure {
            margin: 3rem 0;
            border-radius: 1rem;
            overflow: hidden;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .math-content figure img {
            max-width: 100%;
            height: auto;
            display: block;
        }

        .math-content figcaption {
            padding: 1rem;
            background: #f8fafc;
            width: 100%;
            text-align: center;
            font-family: 'Inter', sans-serif;
            font-size: 0.875rem;
            color: #334155;
            border-top: 1px solid #e2e8f0;
        }

        /* Allow horizontal scrolling for wide math equations with scroll cues */
        .math-content mjx-container[display="true"] {
            max-width: 100% !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            margin: 2rem 0 !important;
            padding: 0.5rem 0.25rem !important;
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
        }

        .math-content mjx-container[display="true"]::-webkit-scrollbar {
            height: 4px;
        }
        .math-content mjx-container[display="true"]::-webkit-scrollbar-track {
            background: transparent;
        }
        .math-content mjx-container[display="true"]::-webkit-scrollbar-thumb {
            background-color: rgba(148, 163, 184, 0.4);
            border-radius: 4px;
        }

        /* Mobile specific adjustments (Scoped strictly to phone viewports < 640px) */
        @media (max-width: 640px) {
            body {
                font-size: 1rem;
                line-height: 1.6;
            }
            .container {
                padding: 0.75rem 0.5rem;
            }
            .header {
                margin-bottom: 0.75rem !important;
                padding-bottom: 0.5rem !important;
            }
            .controls {
                flex-wrap: wrap;
                gap: 0.4rem !important;
                justify-content: flex-end;
            }
            .btn {
                padding: 0.45rem 0.75rem;
                font-size: 0.75rem;
                border-radius: 0.5rem;
            }
            .font-size-control {
                height: 34px;
                padding: 0.2rem 0.4rem;
                border-radius: 0.5rem;
            }
            .font-size-control span {
                font-size: 0.65rem;
            }
            .btn-font-menu {
                font-size: 0.65rem;
                padding: 1px 4px;
            }
            .font-menu-dropdown {
                min-width: 240px;
                max-width: calc(100vw - 20px);
                left: 0;
                right: auto;
                box-sizing: border-box;
            }
            .btn-font-size {
                width: 22px;
                height: 22px;
            }
            .math-content {
                font-size: 1rem;
                line-height: 1.65;
            }
            .math-content h1 { font-size: 1.5rem; margin-bottom: 1.25rem; line-height: 1.25; }
            .math-content h2 { font-size: 1.25rem; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.3; }
            .math-content h3 { font-size: 1.1rem; margin-top: 1.25rem; margin-bottom: 0.5rem; }
            .math-content p { margin-bottom: 1rem; }
            .math-content .notebox { 
                padding: 1rem; 
                margin: 1.25rem 0; 
                border-radius: 0.5rem;
                border-left-width: 3px;
                font-size: 0.95rem;
            }
            .sidebar-hidden .math-content {
                padding: 0.75rem;
            }
            .page-article {
                padding: 1.25rem 0.875rem;
                border-radius: 1rem;
                margin-bottom: 1.5rem;
            }
            .math-content mjx-container[display="true"] {
                margin: 1rem 0 !important;
                padding: 0.5rem 0.25rem !important;
                /* Soft right-edge scroll cue on mobile */
                mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
                -webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%);
            }
            .math-content mjx-container[display="true"].is-scrolled {
                mask-image: none;
                -webkit-mask-image: none;
            }
            .math-content table {
                font-size: 0.85rem;
            }
            .math-content figure {
                margin: 1.5rem 0;
            }
        }

        /* Fix alignment for math in flex containers */
        .math-content .flex mjx-container[display="true"] {
            margin: 0 !important;
            padding: 0 !important;
        }

        /* Safety net: prevent double-boxing if math is nested in a notebox */
        .notebox mjx-container[display="true"] {
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 1rem 0 !important;
        }

        @media print {
            @page {
                margin: 2cm;
            }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            body { 
                background: white !important; 
                color: #000000 !important;
            }
            /* Hide UI elements and interactive tools */
            .sidebar, .header, .page-badge, .no-print, .annotated-note-delete, 
            .annotation-toolbar, .diagram-lightbox, .mobile-page-pill, 
            .mobile-page-sheet, .mobile-page-sheet-backdrop, button, nav, aside { 
                display: none !important; 
            }
            .layout { 
                display: block !important; 
                padding: 0 !important; 
                margin: 0 !important;
            }
            .content {
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
            }
            /* Force page breaks */
            .page-article { 
                box-shadow: none !important; 
                border: none !important; 
                padding: 0 !important; 
                margin: 0 0 2rem 0 !important; 
                page-break-after: always !important;
                break-after: page !important;
            }
            .math-content { 
                font-size: 12pt !important; 
                box-shadow: none !important; 
                border-radius: 0 !important; 
                padding: 0 !important; 
                margin: 0 !important; 
                max-width: 100% !important;
            }
            .continuous-container { 
                gap: 0 !important; 
            }
            /* Prevent figures, images, charts, and math blocks from breaking across pages */
            figure, img, svg, canvas, .notebox, table, tr, pre, blockquote, mjx-container {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            /* Ensure annotations print properly */
            .annotated-highlight {
                background-color: rgba(255, 224, 102, 0.6) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .annotated-note {
                box-shadow: none !important;
                border: 1px solid rgba(0, 0, 0, 0.15) !important;
                border-left: 4px solid #eab308 !important;
                background-color: #fef08a !important;
                color: #854d0e !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
        
        .annotation-toolbar {
            background: white;
            border: 1px solid #f1f5f9;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            color: #475569;
            padding: 1.25rem;
            border-radius: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex-shrink: 0;
            overflow-y: auto;
            max-height: 55vh;
        }
        .annotation-btn {
            background: transparent;
            color: inherit;
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            text-align: left;
        }
        .annotation-btn:hover {
            background: #f1f5f9;
            color: #0f172a;
        }
        .annotation-btn.active {
            background: var(--accent);
            color: black;
        }
        .color-swatch {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 0 1px #cbd5e1;
            cursor: pointer;
            padding: 0;
            transition: transform 0.1s, box-shadow 0.1s;
        }
        .color-swatch:hover {
            transform: scale(1.1);
        }
        .color-swatch.active {
            box-shadow: 0 0 0 2px #0f172a;
            transform: scale(1.1);
        }
        #btn-save-html {
            background: #0f172a;
            color: white;
            margin-top: 0.5rem;
        }
        #btn-save-html:hover {
            background: #334155;
            color: white;
        }
        .drawing-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
            overflow: visible;
        }
        .drawing-layer.active {
            pointer-events: auto;
            cursor: crosshair;
            touch-action: none;
        }
        .drawing-layer.erase-mode {
            pointer-events: auto;
            cursor: alias;
            touch-action: none;
        }
        .annotated-highlight {
            background-color: rgba(255, 224, 102, 0.6);
            border-radius: 2px;
            padding: 0 2px;
        }
        .annotated-note {
            position: absolute;
            background: #fef08a;
            color: #854d0e;
            padding: 0 1rem 0.75rem 1rem;
            border-radius: 0.5rem;
            border-left: 4px solid #eab308;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1);
            min-width: 200px;
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            line-height: 1.5;
            z-index: 100;
        }
        .annotated-note-drag-handle {
            height: 16px;
            width: calc(100% + 2rem);
            margin-left: -1rem;
            cursor: grab;
            background: rgba(0,0,0,0.05);
            border-radius: 0.5rem 0.5rem 0 0;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .annotated-note-drag-handle:active {
            cursor: grabbing;
        }
        .annotated-note-delete {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 101;
        }
        .annotated-note:hover .annotated-note-delete {
            display: flex;
        }
        .annotated-note-content {
            white-space: pre-wrap;
            outline: none;
            min-height: 1.5em;
        }
        /* Diagram tap-to-zoom cursor & affordance */
        .math-content figure img {
            cursor: zoom-in;
            transition: transform 0.15s ease-in-out;
        }
        .math-content figure img:hover {
            opacity: 0.95;
        }

        /* Lightbox CSS */
        .diagram-lightbox {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 9999;
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
        }
        .diagram-lightbox.active {
            display: flex;
            opacity: 1;
        }
        .lightbox-controls {
            position: absolute;
            top: 1rem;
            right: 1rem;
            display: flex;
            gap: 0.5rem;
            z-index: 10002;
        }
        .lightbox-btn {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 9999px;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s;
            font-weight: bold;
        }
        .lightbox-btn:hover {
            background: rgba(255, 255, 255, 0.25);
        }
        .lightbox-btn:active {
            transform: scale(0.92);
        }
        .lightbox-viewport {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            cursor: grab;
            position: relative;
        }
        .lightbox-viewport:active {
            cursor: grabbing;
        }
        .lightbox-img {
            max-width: 90vw;
            max-height: 75vh;
            object-fit: contain;
            border-radius: 0.75rem;
            background: white;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
            transform-origin: center center;
            transition: transform 0.05s linear;
        }
        .lightbox-caption-box {
            position: absolute;
            bottom: 1.5rem;
            max-width: min(650px, 92vw);
            background: rgba(15, 23, 42, 0.88);
            color: #f8fafc;
            padding: 0.75rem 1.25rem;
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.15);
            font-size: 0.875rem;
            line-height: 1.45;
            text-align: center;
            z-index: 10001;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
        }
        .lightbox-hint {
            font-size: 0.75rem;
            color: #94a3b8;
            margin-top: 0.25rem;
        }

        @media (max-width: 1023px) {
            /* Hide page selector, sidebar, and annotation editor toolbar on small screen, but keep Notes toggle pill button accessible */
            .sidebar, 
            #sidebar-nav, 
            .sidebar-box, 
            #sidebar-toggle, 
            .annotation-toolbar {
                display: none !important;
            }

            .layout {
                display: block !important;
                grid-template-columns: 1fr !important;
                gap: 0 !important;
                padding-top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
            }

            .content {
                padding-bottom: 3rem !important;
                width: 100% !important;
                max-width: 100% !important;
            }

            .header .controls {
                justify-content: flex-end;
                gap: 0.5rem;
            }
        }

        @media print {
            .math-content mjx-container[display="true"],
            .math-content table,
            .math-content figure {
                overflow-x: visible !important;
                overflow-y: visible !important;
                white-space: normal !important;
            }
        }
    </style>
    <style>
        .toc-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
        .toc-link { display: flex; align-items: flex-start; text-decoration: none; color: #475569; padding: 0.375rem 0.5rem; border-radius: 0.5rem; font-size: 0.85rem; line-height: 1.4; transition: all 0.2s; }
        .toc-link:hover { background-color: #f1f5f9; color: #0f172a; }
        .toc-level-1 { font-weight: 700; color: #0f172a; margin-top: 0.5rem; }
        .toc-level-2 { font-weight: 500; margin-left: 0.75rem; }
        .toc-level-3 { font-weight: 400; margin-left: 1.5rem; font-size: 0.8rem; color: #64748b; }
        .toc-link svg { flex-shrink: 0; margin-top: 2px; }
        .toc-link mjx-container { font-size: 90% !important; margin: 0 !important; }
        
        .toc-drawer {
            position: fixed;
            top: 0;
            right: 0;
            width: 20rem;
            max-width: 100vw;
            height: 100vh;
            background: white;
            box-shadow: -4px 0 25px rgba(0,0,0,0.1);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
        }
        .toc-drawer.open {
            transform: translateX(0);
        }
        .toc-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            border-bottom: 1px solid #f1f5f9;
        }
        .toc-content {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
        }
        .toc-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.2);
            z-index: 999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }
        .toc-backdrop.open {
            opacity: 1;
            pointer-events: auto;
        }
    </style>
    </head>
    <body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div class="container" id="main-container">
        <header class="header no-print" style="border-bottom: none; margin-bottom: 1rem; padding-bottom: 0;">
            <div class="controls" style="width: 100%; justify-content: flex-end; gap: 0.75rem;">
                <button id="btn-toggle-notes" class="btn btn-outline" style="border-radius: 9999px; padding: 0.5rem 1rem; font-weight: 600;" title="Toggle margin notes, step-by-step explanations, and teacher callouts">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span id="btn-toggle-notes-label">Margin Notes (${totalMarginNotes})</span>
                </button>
                <div class="font-size-control" title="Adjust font and text size">
                    <div class="font-dropdown-wrapper" style="position: relative; display: inline-flex;">
                        <button id="btn-font-menu" class="btn-font-menu" aria-haspopup="true" aria-expanded="false" title="Click to choose an accessibility-friendly font">
                            <span id="current-font-label">Font</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="font-menu-arrow"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div id="font-menu-dropdown" class="font-menu-dropdown no-print" role="menu" aria-label="Accessibility Fonts">
                            <div class="font-menu-header">Accessibility Fonts</div>
                            <button class="font-menu-option" data-font="atkinson" role="menuitem">
                                <div class="font-opt-text">
                                    <div class="font-opt-name" style="font-family: 'Atkinson Hyperlegible', sans-serif;">Atkinson Hyperlegible</div>
                                    <div class="font-opt-sub">Braille Institute • Low vision clarity</div>
                                </div>
                                <span class="font-opt-check">✓</span>
                            </button>
                            <button class="font-menu-option" data-font="lexend" role="menuitem">
                                <div class="font-opt-text">
                                    <div class="font-opt-name" style="font-family: 'Lexend', sans-serif;">Lexend</div>
                                    <div class="font-opt-sub">Engineered for reading fluency</div>
                                </div>
                                <span class="font-opt-check">✓</span>
                            </button>
                            <button class="font-menu-option" data-font="opendyslexic" role="menuitem">
                                <div class="font-opt-text">
                                    <div class="font-opt-name" style="font-family: 'OpenDyslexic', sans-serif;">OpenDyslexic</div>
                                    <div class="font-opt-sub">Weighted bottoms for dyslexia</div>
                                </div>
                                <span class="font-opt-check">✓</span>
                            </button>
                            <button class="font-menu-option" data-font="inter" role="menuitem">
                                <div class="font-opt-text">
                                    <div class="font-opt-name" style="font-family: 'Inter', sans-serif;">Inter</div>
                                    <div class="font-opt-sub">Clean modern sans-serif</div>
                                </div>
                                <span class="font-opt-check">✓</span>
                            </button>
                            <button class="font-menu-option" data-font="lora" role="menuitem">
                                <div class="font-opt-text">
                                    <div class="font-opt-name" style="font-family: 'Lora', serif;">Lora</div>
                                    <div class="font-opt-sub">High-contrast literary serif</div>
                                </div>
                                <span class="font-opt-check">✓</span>
                            </button>
                            <button class="font-menu-option" data-font="mono" role="menuitem">
                                <div class="font-opt-text">
                                    <div class="font-opt-name" style="font-family: 'Fira Code', monospace;">Fira Code</div>
                                    <div class="font-opt-sub">Monospaced technical clarity</div>
                                </div>
                                <span class="font-opt-check">✓</span>
                            </button>
                        </div>
                    </div>
                    <div style="height: 16px; width: 1px; background-color: #cbd5e1; margin: 0 4px;"></div>
                    <button id="btn-dec-font" class="btn-font-size" aria-label="Decrease font size">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <span id="font-size-indicator" style="min-width: 2.25rem; text-align: center;">${textSize}%</span>
                    <button id="btn-inc-font" class="btn-font-size" aria-label="Increase font size">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
                <button id="btn-toc-toggle" class="btn btn-outline" aria-expanded="false" aria-controls="toc-drawer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    <span class="hidden sm:inline">Contents</span>
                </button>
                <button id="sidebar-toggle" class="btn btn-outline" aria-expanded="true" aria-controls="sidebar-nav">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    <span class="hidden sm:inline">Toggle </span>Sidebar
                </button>
                <button onclick="window.print()" class="btn btn-primary">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    <span>Print<span class="hidden sm:inline"> PDF</span></span>
                </button>
            </div>
        </header>

        <div class="layout" id="main-layout">
            ${layoutMode === 'paginated' ? `
            <nav class="sidebar no-print" id="sidebar-nav" aria-label="Page navigation">
                <div class="nav-list-container sidebar-box">
                    <h2 style="font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #334155; margin-top: 0; margin-bottom: 1rem;">Pages</h2>
                    <ul class="nav-list">
                        ${cleanResults.map(r => `
                        <li>
                            <a href="#page-${r.pageNumber}" class="nav-link">
                                P${r.pageNumber}
                            </a>
                        </li>
                        `).join('')}
                    </ul>
                </div>
                ${toolbarHTML}
            </nav>
            ` : `
            <nav class="sidebar no-print" id="sidebar-nav" aria-label="Page navigation">
                ${toolbarHTML}
            </nav>
            `}
            <main id="main-content" tabindex="-1" class="content" style="padding-bottom: 12rem; outline: none;">
                ${layoutMode === 'continuous' ? `
                ${originalFileName ? `
                <div class="no-print download-btn-wrapper" style="position: fixed; top: 2rem; right: 3rem; z-index: 50;">
                    <a href="${originalFileName}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[11px] transition-all border-2 no-underline tracking-widest shadow-xl transform hover:-translate-y-0.5 active:translate-y-0" style="background-color: var(--accent); color: var(--ink); border-color: var(--ink);" title="Download original notes">
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 21v-8H7v8" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 3v5h8" />
                        </svg>
                        <span>Download original notes</span>
                    </a>
                </div>` : ''}
                <div class="continuous-container" style="display: flex; flex-direction: column; gap: 2rem;">
                    ${cleanResults.map((r, i) => `
                    ${i > 0 ? `
                    <div style="display: flex; align-items: center; justify-content: center; margin: 2rem 0; position: relative;">
                        <div style="position: absolute; inset: 0; display: flex; align-items: center;" aria-hidden="true">
                            <div class="continuous-separator" style="width: 100%; border-top: 1px dashed #cbd5e1;"></div>
                        </div>
                        <div style="position: relative; display: flex; justify-content: center;">
                            <span class="continuous-badge" style="background: var(--bg); padding: 0 1rem; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #334155;">Page ${r.pageNumber}</span>
                        </div>
                    </div>
                    ` : ''}
                    <article role="region" aria-label="Page ${r.pageNumber}" class="page-article content-expanded">
                        <span class="sr-only">Original Page ${r.pageNumber}</span>
                        <div class="math-content">
                            ${r.html}
                        </div>
                    </article>
                    `).join('\n')}
                </div>
                ` : cleanResults.map((r, idx) => `
                <article id="page-${r.pageNumber}" role="region" aria-label="Page ${r.pageNumber}" class="page-article">
                    ${idx === 0 && originalFileName ? `
                    <div class="no-print download-btn-wrapper" style="position: absolute; top: 0; right: 1.5rem;">
                        <a href="${originalFileName}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[11px] transition-all border-2 no-underline tracking-widest shadow-xl transform hover:-translate-y-0.5 active:translate-y-0" style="background-color: var(--accent); color: var(--ink); border-color: var(--ink);" title="Download original notes">
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 21v-8H7v8" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 3v5h8" />
                            </svg>
                            <span>Download original notes</span>
                        </a>
                    </div>` : ''}
                    <span class="page-badge">PAGE ${r.pageNumber}</span>
                    <div class="math-content">
                        ${r.html}
                    </div>
                </article>`).join('\n')}
            </main>
        </div>
    </div>

    <!-- Diagram Tap-to-Zoom Lightbox Overlay -->
    <div id="diagram-lightbox" class="diagram-lightbox no-print" role="dialog" aria-modal="true" aria-label="Diagram enlarged view">
        <div class="lightbox-controls">
            <button id="lightbox-zoom-in" class="lightbox-btn" title="Zoom in" aria-label="Zoom in">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button id="lightbox-zoom-out" class="lightbox-btn" title="Zoom out" aria-label="Zoom out">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button id="lightbox-reset" class="lightbox-btn" title="Reset zoom (1:1)" aria-label="Reset zoom" style="font-size: 0.75rem; font-weight: bold;">
                1:1
            </button>
            <button id="lightbox-close" class="lightbox-btn" title="Close (Esc)" aria-label="Close lightbox">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div id="lightbox-viewport" class="lightbox-viewport">
            <img id="lightbox-img" class="lightbox-img" src="" alt="Enlarged diagram">
        </div>
        <div id="lightbox-caption-box" class="lightbox-caption-box">
            <div id="lightbox-caption"></div>
            <div class="lightbox-hint">Pinch or double-tap to zoom • Drag to pan</div>
        </div>
    </div>

    <!-- ToC Drawer -->
    <div class="toc-backdrop no-print" id="toc-backdrop"></div>
    <div class="toc-drawer no-print" id="toc-drawer" role="dialog" aria-modal="true" aria-label="Table of Contents">
        <div class="toc-header">
            <h2 style="font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 700; margin: 0; color: #0f172a;">Table of Contents</h2>
            <button id="toc-close" class="btn btn-outline" style="border: none; padding: 0.5rem;" aria-label="Close Table of Contents">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div class="toc-content">
            ${tocHTML}
        </div>
    </div>

    <script>
        const toggleBtn = document.getElementById('sidebar-toggle');
        const container = document.querySelector('.container');
        const layout = document.getElementById('main-layout');
        const sidebar = document.getElementById('sidebar-nav');
        const articles = document.querySelectorAll('.page-article');

        // TOC Toggle
        const btnTocToggle = document.getElementById('btn-toc-toggle');
        const tocDrawer = document.getElementById('toc-drawer');
        const tocBackdrop = document.getElementById('toc-backdrop');
        const tocClose = document.getElementById('toc-close');

        if (btnTocToggle && tocDrawer && tocBackdrop && tocClose) {
            const openToc = () => {
                tocDrawer.classList.add('open');
                tocBackdrop.classList.add('open');
                btnTocToggle.setAttribute('aria-expanded', 'true');
            };
            const closeToc = () => {
                tocDrawer.classList.remove('open');
                tocBackdrop.classList.remove('open');
                btnTocToggle.setAttribute('aria-expanded', 'false');
            };

            btnTocToggle.addEventListener('click', openToc);
            tocClose.addEventListener('click', closeToc);
            tocBackdrop.addEventListener('click', closeToc);
            
            // Close on link click
            const tocLinks = tocDrawer.querySelectorAll('.toc-link');
            tocLinks.forEach(link => {
                link.addEventListener('click', () => {
                    closeToc();
                });
            });
        }

        // Annotations / Margin Notes Toggle
        const notesToggleBtn = document.getElementById('btn-toggle-notes');
        const notesToggleLabel = document.getElementById('btn-toggle-notes-label');
        let notesVisible = false;
        
        function getMarginNotesCount() {
            const elements = document.querySelectorAll('.auto-annotation, .note-box, aside[role="note"], .callout, .margin-note');
            return elements.length;
        }

        function updateNotesLabel() {
            const count = getMarginNotesCount();
            if (notesToggleLabel) {
                notesToggleLabel.textContent = notesVisible 
                    ? \`Hide Margin Notes (\${count})\` 
                    : \`Margin Notes (\${count})\`;
            }
        }
        
        if (notesToggleBtn) {
            updateNotesLabel();
            notesToggleBtn.addEventListener('click', () => {
                notesVisible = !notesVisible;
                if (notesVisible) {
                    document.body.classList.add('show-annotations');
                    notesToggleBtn.classList.remove('btn-outline');
                    notesToggleBtn.classList.add('btn-primary');
                } else {
                    document.body.classList.remove('show-annotations');
                    notesToggleBtn.classList.add('btn-outline');
                    notesToggleBtn.classList.remove('btn-primary');
                }
                updateNotesLabel();
                if (notesVisible && window.MathJax && window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise().catch(function(err) { console.error(err); });
                }
            });
        }

        // Figure Captions & Collapsible Details MathJax Typesetting
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

        // Font size control logic
        let currentFontSize = ${textSize};
        const docRoot = document.documentElement;
        const fontIncBtn = document.getElementById('btn-inc-font');
        const fontDecBtn = document.getElementById('btn-dec-font');
        const fontIndicator = document.getElementById('font-size-indicator');

        function updateFontSize(newSize) {
            currentFontSize = Math.max(70, Math.min(200, newSize));
            if (fontIndicator) {
                fontIndicator.textContent = currentFontSize + '%';
            }
            // 1.125rem is the default base size. Convert percentage to rem.
            const remSize = (1.125 * (currentFontSize / 100)).toFixed(3) + 'rem';
            docRoot.style.setProperty('--math-font-size', remSize);
            
            // Also update any inline math-content element styles directly to override any !important reading-mode styles
            const mathContents = document.querySelectorAll('.math-content');
            mathContents.forEach(el => {
                el.style.setProperty('font-size', remSize, 'important');
            });
        }

        if (fontIncBtn) {
            fontIncBtn.addEventListener('click', () => {
                updateFontSize(currentFontSize + 10);
            });
        }
        if (fontDecBtn) {
            fontDecBtn.addEventListener('click', () => {
                updateFontSize(currentFontSize - 10);
            });
        }
        
        // Initialize font size on load if it's different from default
        if (currentFontSize !== 100) {
            updateFontSize(currentFontSize);
        }

        // Font family switcher logic
        const btnFontMenu = document.getElementById('btn-font-menu');
        const fontMenuDropdown = document.getElementById('font-menu-dropdown');
        const currentFontLabel = document.getElementById('current-font-label');
        const fontOptions = document.querySelectorAll('.font-menu-option');

        const fontMap = {
            'atkinson': { name: 'Atkinson', family: "'Atkinson Hyperlegible', sans-serif", headingFamily: "'Atkinson Hyperlegible', sans-serif" },
            'lexend': { name: 'Lexend', family: "'Lexend', sans-serif", headingFamily: "'Lexend', sans-serif" },
            'opendyslexic': { name: 'Dyslexic', family: "'OpenDyslexic', sans-serif", headingFamily: "'OpenDyslexic', sans-serif" },
            'inter': { name: 'Inter', family: "'Inter', sans-serif", headingFamily: "'Inter', sans-serif" },
            'lora': { name: 'Lora', family: "'Lora', serif", headingFamily: "'Inter', sans-serif" },
            'mono': { name: 'Mono', family: "'Fira Code', monospace", headingFamily: "'Fira Code', monospace" }
        };

        let currentFontKey = '${fontPreference}' || 'inter';
        if (currentFontKey === 'sans') currentFontKey = 'inter';
        if (!fontMap[currentFontKey]) currentFontKey = 'inter';

        function applyFont(fontKey) {
            const fontDef = fontMap[fontKey] || fontMap['inter'];
            currentFontKey = fontKey;
            
            // Set CSS variables on root
            docRoot.style.setProperty('--math-font-family', fontDef.family);
            docRoot.style.setProperty('--math-heading-font-family', fontDef.headingFamily);

            // Update all math content elements inline to guarantee overriding any reading mode CSS
            const mathContents = document.querySelectorAll('.math-content');
            mathContents.forEach(el => {
                el.style.setProperty('font-family', fontDef.family, 'important');
                const subElements = el.querySelectorAll('p, li, span, a, td, th, blockquote, div, .notebox');
                subElements.forEach(sub => {
                    sub.style.setProperty('font-family', fontDef.family, 'important');
                });
                const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
                headings.forEach(h => {
                    h.style.setProperty('font-family', fontDef.headingFamily, 'important');
                });
            });

            // Update active option in dropdown menu
            fontOptions.forEach(opt => {
                const optFont = opt.getAttribute('data-font');
                if (optFont === fontKey) {
                    opt.classList.add('active');
                } else {
                    opt.classList.remove('active');
                }
            });

            // Update button label
            if (currentFontLabel) {
                currentFontLabel.textContent = fontDef.name || 'Font';
            }
        }

        if (btnFontMenu && fontMenuDropdown) {
            const toggleFontMenu = (e) => {
                e.stopPropagation();
                const isOpen = fontMenuDropdown.classList.toggle('open');
                btnFontMenu.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                if (isOpen) {
                    // Prevent off-screen clipping on narrow phone viewports
                    fontMenuDropdown.style.left = '';
                    fontMenuDropdown.style.right = '';
                    const rect = fontMenuDropdown.getBoundingClientRect();
                    if (rect.left < 8) {
                        const shift = 8 - rect.left;
                        fontMenuDropdown.style.left = shift + 'px';
                    } else if (rect.right > window.innerWidth - 8) {
                        const overflow = rect.right - (window.innerWidth - 8);
                        fontMenuDropdown.style.left = '-' + overflow + 'px';
                    }
                } else {
                    fontMenuDropdown.style.left = '';
                    fontMenuDropdown.style.right = '';
                }
            };

            const closeFontMenu = () => {
                fontMenuDropdown.classList.remove('open');
                btnFontMenu.setAttribute('aria-expanded', 'false');
                fontMenuDropdown.style.left = '';
                fontMenuDropdown.style.right = '';
            };

            btnFontMenu.addEventListener('click', toggleFontMenu);

            fontOptions.forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const fontKey = opt.getAttribute('data-font');
                    if (fontKey) {
                        applyFont(fontKey);
                    }
                    closeFontMenu();
                });
            });

            document.addEventListener('click', (e) => {
                if (!btnFontMenu.contains(e.target) && !fontMenuDropdown.contains(e.target)) {
                    closeFontMenu();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeFontMenu();
                }
            });
        }

        // Apply initial font setting
        applyFont(currentFontKey);

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = sidebar.classList.toggle('hidden');
                layout.classList.toggle('sidebar-hidden');
                container.classList.toggle('sidebar-hidden');
                toggleBtn.setAttribute('aria-expanded', !isHidden);
                
                articles.forEach(article => {
                    if (isHidden) {
                        article.classList.add('content-expanded');
                    } else {
                        article.classList.remove('content-expanded');
                    }
                });
            });
        }

        function checkMobile() {
            if (toggleBtn) {
                if (window.innerWidth < 1024) {
                    toggleBtn.style.display = 'none';
                } else {
                    toggleBtn.style.display = 'flex';
                }
            }
        }
        window.addEventListener('resize', checkMobile);
        checkMobile();

        if (sidebar) {
            // Set first item active initially
            const firstLink = document.querySelector('.nav-link');
            if (firstLink) {
                firstLink.classList.add('active-nav-link');
                firstLink.setAttribute('aria-current', 'page');
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        if (id) {
                            document.querySelectorAll('.nav-link').forEach(link => {
                                link.classList.remove('active-nav-link');
                                link.removeAttribute('aria-current');
                                if (link.getAttribute('href') === '#' + id) {
                                    link.classList.add('active-nav-link');
                                    link.setAttribute('aria-current', 'page');
                                }
                            });
                        }
                    }
                });
            }, { rootMargin: '-20% 0px -40% 0px' });

            articles.forEach(article => {
                if (article.id) observer.observe(article);
            });
        }
    </script>
    
    <!-- Annotation System -->
    <svg id="drawing-layer" class="drawing-layer" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>
    <script>
        (function() {
            let isHighlightMode = false;
            let isDrawMode = false;
            let isEraseMode = false;
            let isDrawing = false;
            let isPointerDown = false;
            let currentPath = null;
            let d = "";
            let undoStack = [];

            const btnHighlight = document.getElementById('btn-highlight');
            const btnAddNote = document.getElementById('btn-add-note');
            const btnSaveHtml = document.getElementById('btn-save-html');
            const btnDraw = document.getElementById('btn-draw');
            const btnErase = document.getElementById('btn-erase');
            const btnUndo = document.getElementById('btn-undo');
            const btnClearAll = document.getElementById('btn-clear-all');
            const thicknessSlider = document.getElementById('draw-thickness');
            const drawingLayer = document.getElementById('drawing-layer');
            
            let currentColor = '#000000';
            document.querySelectorAll('.color-swatch').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    currentColor = e.target.dataset.color;
                    if (!isDrawMode) {
                        btnDraw.click();
                    }
                });
            });

            function setScrollingEnabled(enabled) {
                if (!enabled) {
                    document.body.style.touchAction = 'none';
                } else {
                    document.body.style.touchAction = '';
                }
            }

            function clearModes() {
                isHighlightMode = false;
                isDrawMode = false;
                isEraseMode = false;
                isDrawing = false;
                isPointerDown = false;
                setScrollingEnabled(true);
                btnHighlight.classList.remove('active');
                btnDraw.classList.remove('active');
                if (btnErase) btnErase.classList.remove('active');
                drawingLayer.classList.remove('active');
                drawingLayer.classList.remove('erase-mode');
                document.body.style.cursor = 'default';
            }

            btnDraw.addEventListener('click', () => {
                const wasDraw = isDrawMode;
                clearModes();
                if (!wasDraw) {
                    isDrawMode = true;
                    btnDraw.classList.add('active');
                    drawingLayer.classList.add('active');
                    drawingLayer.style.height = document.documentElement.scrollHeight + 'px';
                }
            });

            if (btnErase) {
                btnErase.addEventListener('click', () => {
                    const wasErase = isEraseMode;
                    clearModes();
                    if (!wasErase) {
                        isEraseMode = true;
                        btnErase.classList.add('active');
                        drawingLayer.classList.add('erase-mode');
                        drawingLayer.style.height = document.documentElement.scrollHeight + 'px';
                    }
                });
            }

            if (btnUndo) {
                btnUndo.addEventListener('click', () => {
                    if (undoStack.length === 0) return;
                    const action = undoStack.pop();
                    
                    if (action.type === 'draw' && action.element.parentNode) {
                        action.element.remove();
                    } else if (action.type === 'erase') {
                        action.parent.appendChild(action.element);
                    } else if (action.type === 'highlight') {
                        const span = action.element;
                        if (span.parentNode) {
                            const parent = span.parentNode;
                            while (span.firstChild) {
                                parent.insertBefore(span.firstChild, span);
                            }
                            parent.removeChild(span);
                        }
                    } else if (action.type === 'note' && action.element.parentNode) {
                        action.element.remove();
                    } else if (action.type === 'erase-note') {
                        action.parent.appendChild(action.element);
                    }
                });
            }

            if (btnClearAll) {
                btnClearAll.addEventListener('click', () => {
                    if (confirm('Are you sure you want to clear all annotations? This action cannot be undone.')) {
                        drawingLayer.innerHTML = '';
                        document.querySelectorAll('.annotated-highlight').forEach(el => {
                            const parent = el.parentNode;
                            while (el.firstChild) {
                                parent.insertBefore(el.firstChild, el);
                            }
                            parent.removeChild(el);
                        });
                        document.querySelectorAll('.annotated-note').forEach(el => el.remove());
                        undoStack = [];
                    }
                });
            }

            drawingLayer.addEventListener('pointerdown', (e) => {
                if (isEraseMode) {
                    isPointerDown = true;
                    setScrollingEnabled(false);
                    if (e.target.tagName === 'path') {
                        undoStack.push({ type: 'erase', element: e.target, parent: drawingLayer });
                        e.target.remove();
                    }
                    return;
                }
                if (!isDrawMode) return;
                isDrawing = true;
                isPointerDown = true;
                setScrollingEnabled(false);
                d = \`M \${e.pageX} \${e.pageY}\`;
                currentPath = document.createElementNS("http://www.w3.org/2000/svg", 'path');
                currentPath.setAttribute('d', d);
                currentPath.setAttribute('stroke', currentColor);
                currentPath.setAttribute('stroke-width', thicknessSlider ? thicknessSlider.value : '3');
                currentPath.setAttribute('fill', 'none');
                currentPath.setAttribute('stroke-linecap', 'round');
                currentPath.setAttribute('stroke-linejoin', 'round');
                currentPath.style.pointerEvents = 'auto';
                drawingLayer.appendChild(currentPath);
            });

            drawingLayer.addEventListener('pointermove', (e) => {
                if (isEraseMode && isPointerDown && e.target.tagName === 'path') {
                    undoStack.push({ type: 'erase', element: e.target, parent: drawingLayer });
                    e.target.remove();
                    return;
                }
                if (!isDrawMode || !isDrawing || !currentPath) return;
                d += \` L \${e.pageX} \${e.pageY}\`;
                currentPath.setAttribute('d', d);
            });

            window.addEventListener('pointerup', () => {
                isPointerDown = false;
                setScrollingEnabled(true);
                if (isDrawing) {
                    isDrawing = false;
                    if (currentPath) {
                        undoStack.push({ type: 'draw', element: currentPath });
                    }
                    currentPath = null;
                }
            });

            window.addEventListener('pointercancel', () => {
                isPointerDown = false;
                isDrawing = false;
                setScrollingEnabled(true);
                currentPath = null;
            });

            drawingLayer.addEventListener('touchmove', (e) => {
                if (isDrawing || (isEraseMode && isPointerDown)) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                }
            }, { passive: false });

            btnHighlight.addEventListener('click', () => {
                const wasHighlight = isHighlightMode;
                clearModes();
                if (!wasHighlight) {
                    isHighlightMode = true;
                    btnHighlight.classList.add('active');
                    document.body.style.cursor = 'text';
                }
            });

            document.addEventListener('pointerup', () => {
                if (!isHighlightMode) return;
                const sel = window.getSelection();
                if (!sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const span = document.createElement('mark');
                    span.className = 'annotated-highlight';
                    span.style.backgroundColor = currentColor + '66'; // Add alpha
                    try {
                        range.surroundContents(span);
                        sel.removeAllRanges();
                        undoStack.push({ type: 'highlight', element: span });
                    } catch (e) {
                        console.warn("Could not highlight selection across multiple elements.");
                    }
                }
            });

            btnAddNote.addEventListener('click', () => {
                const noteWrapper = document.createElement('div');
                noteWrapper.className = 'annotated-note';
                noteWrapper.setAttribute('role', 'note');
                noteWrapper.setAttribute('aria-label', 'Sticky Note');
                
                // Position near the center of the viewport
                const top = window.scrollY + window.innerHeight / 3;
                const left = window.scrollX + window.innerWidth / 2 - 100;
                
                noteWrapper.style.top = top + 'px';
                noteWrapper.style.left = left + 'px';
                
                const dragHandle = document.createElement('div');
                dragHandle.className = 'annotated-note-drag-handle no-print';
                dragHandle.contentEditable = "false";
                dragHandle.setAttribute('aria-label', 'Drag to move note');
                dragHandle.setAttribute('role', 'button');
                dragHandle.setAttribute('tabindex', '0');
                dragHandle.innerHTML = '<div style="width: 20px; height: 4px; border-top: 1px solid rgba(0,0,0,0.2); border-bottom: 1px solid rgba(0,0,0,0.2);"></div>';

                const noteContent = document.createElement('div');
                noteContent.className = 'annotated-note-content';
                noteContent.contentEditable = "true";
                noteContent.setAttribute('aria-label', 'Note content');
                noteContent.setAttribute('role', 'textbox');
                noteContent.textContent = "Type note here...";
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'annotated-note-delete no-print';
                deleteBtn.innerHTML = '×';
                deleteBtn.setAttribute('aria-label', 'Delete note');
                deleteBtn.contentEditable = "false";
                deleteBtn.onclick = function(e) {
                    e.stopPropagation();
                    undoStack.push({ type: 'erase-note', element: noteWrapper, parent: document.body });
                    noteWrapper.remove();
                };
                
                noteWrapper.appendChild(dragHandle);
                noteWrapper.appendChild(deleteBtn);
                noteWrapper.appendChild(noteContent);
                
                document.body.appendChild(noteWrapper);
                
                makeDraggable(noteWrapper, dragHandle);
                setupNoteContentListeners(noteContent);
                
                // Set cursor into note
                setTimeout(() => {
                    noteContent.focus();
                    const s = window.getSelection();
                    s.selectAllChildren(noteContent);
                }, 10);
            });

            function makeDraggable(elmnt, dragHandle) {
                let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
                dragHandle.onpointerdown = dragMouseDown;

                function dragMouseDown(e) {
                    e = e || window.event;
                    e.preventDefault();
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    document.onpointerup = closeDragElement;
                    document.onpointermove = elementDrag;
                }

                function elementDrag(e) {
                    e = e || window.event;
                    e.preventDefault();
                    pos1 = pos3 - e.clientX;
                    pos2 = pos4 - e.clientY;
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
                    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
                }

                function closeDragElement() {
                    document.onpointerup = null;
                    document.onpointermove = null;
                }
            }

            function setupNoteContentListeners(noteContent) {
                noteContent.addEventListener('focus', function() {
                    if (this.dataset.rawLatex !== undefined) {
                        this.innerText = this.dataset.rawLatex;
                    }
                });
                
                noteContent.addEventListener('blur', function() {
                    this.dataset.rawLatex = this.innerText;
                    this.textContent = this.innerText;
                    if (window.MathJax && window.MathJax.typesetPromise) {
                        window.MathJax.typesetPromise([this]).catch(function (err) {
                            console.log(err.message);
                        });
                    }
                });
            }

            // Initialize existing notes
            function initExistingNotes() {
                document.querySelectorAll('.annotated-note').forEach(note => {
                    const dragHandle = note.querySelector('.annotated-note-drag-handle');
                    if (dragHandle) {
                        makeDraggable(note, dragHandle);
                    }
                    const btn = note.querySelector('.annotated-note-delete');
                    if (btn) {
                        btn.onclick = function(e) {
                            e.stopPropagation();
                            undoStack.push({ type: 'erase-note', element: note, parent: note.parentNode });
                            note.remove();
                        };
                    }
                    const content = note.querySelector('.annotated-note-content');
                    if (content) {
                        setupNoteContentListeners(content);
                        if (window.MathJax && window.MathJax.typesetPromise) {
                            window.MathJax.typesetPromise([content]).catch(function (err) {
                                console.log(err.message);
                            });
                        }
                    }
                });
            }
            initExistingNotes();

            btnSaveHtml.addEventListener('click', () => {
                // Remove active states before saving
                const wasHighlightActive = isHighlightMode;
                const wasDrawActive = isDrawMode;
                const wasEraseActive = isEraseMode;
                
                isHighlightMode = false;
                isDrawMode = false;
                isEraseMode = false;
                
                btnHighlight.classList.remove('active');
                btnDraw.classList.remove('active');
                if (btnErase) btnErase.classList.remove('active');
                drawingLayer.classList.remove('active');
                drawingLayer.classList.remove('erase-mode');
                document.body.style.cursor = 'default';
                
                // Get HTML string
                const html = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;
                
                // Restore active state
                if (wasHighlightActive) {
                    isHighlightMode = true;
                    btnHighlight.classList.add('active');
                    document.body.style.cursor = 'text';
                }
                if (wasDrawActive) {
                    isDrawMode = true;
                    btnDraw.classList.add('active');
                    drawingLayer.classList.add('active');
                }
                if (wasEraseActive) {
                    isEraseMode = true;
                    if (btnErase) btnErase.classList.add('active');
                    drawingLayer.classList.add('erase-mode');
                }

                // Create blob and download
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                let title = document.title;
                if (!title.includes('(Annotated)')) {
                    title += ' (Annotated)';
                }
                a.download = title + '.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        })();

        // Diagram Tap-to-Zoom Lightbox Controller
        (function() {
            const lightbox = document.getElementById('diagram-lightbox');
            if (!lightbox) return;

            const lightboxImg = document.getElementById('lightbox-img');
            const lightboxCaption = document.getElementById('lightbox-caption');
            const lightboxClose = document.getElementById('lightbox-close');
            const lightboxZoomIn = document.getElementById('lightbox-zoom-in');
            const lightboxZoomOut = document.getElementById('lightbox-zoom-out');
            const lightboxReset = document.getElementById('lightbox-reset');
            const viewport = document.getElementById('lightbox-viewport');

            let currentScale = 1;
            let translateX = 0;
            let translateY = 0;
            let isDragging = false;
            let startX = 0;
            let startY = 0;
            let initialDistance = 0;
            let lastTap = 0;

            function applyTransform() {
                if (lightboxImg) {
                    lightboxImg.style.transform = "translate(" + translateX + "px, " + translateY + "px) scale(" + currentScale + ")";
                }
            }

            function resetTransform() {
                currentScale = 1;
                translateX = 0;
                translateY = 0;
                applyTransform();
            }

            function openLightbox(src, alt, captionText) {
                if (!lightbox || !lightboxImg) return;
                lightboxImg.src = src;
                lightboxImg.alt = alt || 'Enlarged diagram';
                if (lightboxCaption) {
                    lightboxCaption.textContent = captionText || alt || 'Diagram details';
                }
                resetTransform();
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            function closeLightbox() {
                if (!lightbox) return;
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
                resetTransform();
            }

            // Attach click listener to all figure images in the document
            document.querySelectorAll('.math-content figure img').forEach(img => {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const figure = img.closest('figure');
                    const figcaption = figure ? figure.querySelector('figcaption') : null;
                    const captionText = figcaption ? figcaption.textContent.trim() : (img.getAttribute('alt') || '');
                    openLightbox(img.src, img.getAttribute('alt') || '', captionText);
                });
            });

            if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
            
            if (lightboxZoomIn) {
                lightboxZoomIn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentScale = Math.min(currentScale + 0.5, 4);
                    applyTransform();
                });
            }

            if (lightboxZoomOut) {
                lightboxZoomOut.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentScale = Math.max(currentScale - 0.5, 0.8);
                    if (currentScale <= 1) {
                        translateX = 0;
                        translateY = 0;
                    }
                    applyTransform();
                });
            }

            if (lightboxReset) {
                lightboxReset.addEventListener('click', (e) => {
                    e.stopPropagation();
                    resetTransform();
                });
            }

            // Keyboard support: Escape to close, +/- to zoom
            window.addEventListener('keydown', (e) => {
                if (!lightbox.classList.contains('active')) return;
                if (e.key === 'Escape') closeLightbox();
                if (e.key === '+' || e.key === '=') {
                    currentScale = Math.min(currentScale + 0.5, 4);
                    applyTransform();
                }
                if (e.key === '-' || e.key === '_') {
                    currentScale = Math.max(currentScale - 0.5, 0.8);
                    applyTransform();
                }
            });

            // Close on background tap (if clicked outside image)
            if (viewport) {
                viewport.addEventListener('click', (e) => {
                    if (e.target === viewport) {
                        closeLightbox();
                    }
                });

                // Mouse / Touch Dragging and Panning
                viewport.addEventListener('pointerdown', (e) => {
                    if (e.target === lightboxImg || e.target === viewport) {
                        isDragging = true;
                        startX = e.clientX - translateX;
                        startY = e.clientY - translateY;
                        viewport.setPointerCapture(e.pointerId);
                    }
                });

                viewport.addEventListener('pointermove', (e) => {
                    if (!isDragging) return;
                    translateX = e.clientX - startX;
                    translateY = e.clientY - startY;
                    applyTransform();
                });

                viewport.addEventListener('pointerup', (e) => {
                    isDragging = false;
                    try { viewport.releasePointerCapture(e.pointerId); } catch(err){}
                });

                // Wheel zoom
                viewport.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const delta = e.deltaY < 0 ? 0.2 : -0.2;
                    currentScale = Math.max(0.8, Math.min(4, currentScale + delta));
                    applyTransform();
                }, { passive: false });

                // Double-tap to toggle zoom on touch devices
                viewport.addEventListener('touchend', (e) => {
                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - lastTap;
                    if (tapLength < 300 && tapLength > 0) {
                        e.preventDefault();
                        if (currentScale > 1.2) {
                            resetTransform();
                        } else {
                            currentScale = 2.5;
                            applyTransform();
                        }
                    }
                    lastTap = currentTime;
                });

                // Multi-touch pinch to zoom
                viewport.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 2) {
                        initialDistance = Math.hypot(
                            e.touches[0].pageX - e.touches[1].pageX,
                            e.touches[0].pageY - e.touches[1].pageY
                        );
                    }
                }, { passive: true });

                viewport.addEventListener('touchmove', (e) => {
                    if (e.touches.length === 2 && initialDistance > 0) {
                        const currentDistance = Math.hypot(
                            e.touches[0].pageX - e.touches[1].pageX,
                            e.touches[0].pageY - e.touches[1].pageY
                        );
                        const factor = currentDistance / initialDistance;
                        currentScale = Math.max(0.8, Math.min(4, currentScale * (factor > 1 ? 1.03 : 0.97)));
                        applyTransform();
                    }
                }, { passive: true });
            }
        })();
    </script>
</body>
</html>`;
};
