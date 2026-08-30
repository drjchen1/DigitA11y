import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports with React.lazy
imports_to_replace = {
    r"import ImageEditor from '\./components/ImageEditor';": "const ImageEditor = React.lazy(() => import('./components/ImageEditor'));",
    r"import ResultsView from '\./components/ResultsView';": "const ResultsView = React.lazy(() => import('./components/ResultsView'));",
    r"import AccessibilityAuditReport from '\./components/AccessibilityAuditReport';": "const AccessibilityAuditReport = React.lazy(() => import('./components/AccessibilityAuditReport'));",
    r"import HelpModal from '\./components/HelpModal';": "const HelpModal = React.lazy(() => import('./components/HelpModal'));",
    r"import ResetWarningModal from '\./components/ResetWarningModal';": "const ResetWarningModal = React.lazy(() => import('./components/ResetWarningModal'));",
}

for pattern, replacement in imports_to_replace.items():
    content = re.sub(pattern, replacement, content)

# We need to import Suspense from React, so let's update the React import
content = re.sub(r"import React, \{ useState, useEffect \} from 'react';", "import React, { useState, useEffect, Suspense } from 'react';", content)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
