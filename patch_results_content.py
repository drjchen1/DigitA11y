import re

with open('components/ResultsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_pattern = r"import \{ ExportPdfModal \} from \"\./ExportPdfModal\";"
replacement_import = "import { ExportPdfModal } from \"./ExportPdfModal\";\nimport { ResultsContent } from \"./ResultsContent\";"
content = re.sub(import_pattern, replacement_import, content)

content_pattern = r"\{viewMode === 'preview' \? \(\s*<div\s*ref=\{contentRef\}.*?</div>\s*\)\}"
replacement_content = """<ResultsContent
              viewMode={viewMode}
              layoutMode={layoutMode}
              results={results}
              activeTab={activeTab}
              showAnnotations={showAnnotations}
              isReadingMode={isReadingMode}
              isProcessing={isProcessing}
              onReprocessPage={onReprocessPage}
              onUpdateHtml={onUpdateHtml}
              setEditingMathPageIndex={setEditingMathPageIndex}
              contentRef={contentRef}
              containerMaxWidthClass={containerMaxWidthClass}
              articleClass={articleClass}
              accessibilityStyle={accessibilityStyle}
            />"""

content = re.sub(content_pattern, replacement_content, content, flags=re.DOTALL)

with open('components/ResultsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
