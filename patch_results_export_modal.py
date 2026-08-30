import re

with open('components/ResultsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace modal block
modal_pattern = r"\{showExportPdfModal && \(\s*<div className=\"fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity\">.*?</div>\s*</div>\s*\)\}"
replacement_modal = """{showExportPdfModal && (
        <ExportPdfModal 
          onClose={() => setShowExportPdfModal(false)}
          onOpenPrintable={openPrintableTab}
          onDownloadHtml={onDownloadHtml}
        />
      )}"""

content = re.sub(modal_pattern, replacement_modal, content, flags=re.DOTALL)

with open('components/ResultsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

