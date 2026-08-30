import re

with open('components/ResultsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
import_pattern = r"import \{ MathEditorModal \} from \"\./MathEditorModal\";"
replacement_import = "import { MathEditorModal } from \"./MathEditorModal\";\nimport { ResultsSidebar } from \"./ResultsSidebar\";"
content = re.sub(import_pattern, replacement_import, content)

# 2. Replace aside block
aside_pattern = r"<aside className=\"w-full xl:w-64 flex-shrink-0 flex flex-col gap-4 xl:sticky xl:top-24 xl:max-h-\[calc\(100vh-8rem\)\] overflow-y-auto no-scrollbar pb-8\">.*?</aside>"
replacement_aside = """<ResultsSidebar
          results={results}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          layoutMode={layoutMode}
          activeAudit={activeAudit}
          onShowAudit={onShowAudit}
          onDownloadHtml={onDownloadHtml}
          handlePrint={handlePrint}
          showAnnotations={showAnnotations}
          setShowAnnotations={setShowAnnotations}
          onReprocessAll={onReprocessAll}
          isProcessing={isProcessing}
          onReset={onReset}
        />"""

content = re.sub(aside_pattern, replacement_aside, content, flags=re.DOTALL)

with open('components/ResultsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

