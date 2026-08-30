import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace ResultsView
results_view_pattern = r"(<ResultsView\s+.*?/>)"
content = re.sub(results_view_pattern, r"<Suspense fallback={<div className=\"flex items-center justify-center p-12 text-zinc-500 text-sm animate-pulse\">Loading Results View...</div>}>\n          \1\n        </Suspense>", content, flags=re.DOTALL)

# Replace AccessibilityAuditReport
audit_pattern = r"(<AccessibilityAuditReport\s+.*?/>)"
content = re.sub(audit_pattern, r"<Suspense fallback={null}>\n          \1\n        </Suspense>", content, flags=re.DOTALL)

# Replace HelpModal
help_pattern = r"(<HelpModal\s+.*?/>)"
content = re.sub(help_pattern, r"<Suspense fallback={null}>\n          \1\n        </Suspense>", content, flags=re.DOTALL)

# Replace ResetWarningModal
reset_pattern = r"(<ResetWarningModal\s+.*?/>)"
content = re.sub(reset_pattern, r"<Suspense fallback={null}>\n          \1\n        </Suspense>", content, flags=re.DOTALL)

# Replace ImageEditor
editor_pattern = r"(<ImageEditor\s+.*?/>)"
content = re.sub(editor_pattern, r"<Suspense fallback={null}>\n            \1\n          </Suspense>", content, flags=re.DOTALL)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
