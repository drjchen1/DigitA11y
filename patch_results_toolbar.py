import re

with open('components/ResultsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import for ResultsToolbar
import_pattern = r"import \{ ResultsSidebar \} from \"\./ResultsSidebar\";"
replacement_import = "import { ResultsSidebar } from \"./ResultsSidebar\";\nimport { ResultsToolbar } from \"./ResultsToolbar\";"
content = re.sub(import_pattern, replacement_import, content)

# Replace Toolbar block
toolbar_pattern = r"<div className=\"flex items-center justify-between mb-8 border-b border-zinc-100 pb-4 sticky top-20 z-30 bg-white/90 backdrop-blur-md pt-4\">.*?</button>\s*</div>\s*\)\}\s*</div>"
replacement_toolbar = """<ResultsToolbar
              viewMode={viewMode}
              setViewMode={setViewMode}
              layoutMode={layoutMode}
              setLayoutMode={setLayoutMode}
              activeTab={activeTab}
              setEditingMathPageIndex={setEditingMathPageIndex}
              setIsReadingMode={setIsReadingMode}
              resultsLength={results.length}
              currentPageNumber={results[activeTab]?.pageNumber || 1}
              onReprocessPage={onReprocessPage}
              isProcessing={isProcessing}
            />"""

content = re.sub(toolbar_pattern, replacement_toolbar, content, flags=re.DOTALL)

with open('components/ResultsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

