import re

with open('components/ResultsContent.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
import_statement = """import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-tomorrow.css';
"""

content = re.sub(r"import \{ ConversionResult, LayoutMode \} from '\.\./types';", f"import {{ ConversionResult, LayoutMode }} from '../types';\n{import_statement}", content)

# Replace textareas
textarea_continuous_pattern = r"<textarea\s+className=\"w-full bg-white p-4 md:p-6 rounded-2xl font-mono text-\[11px\] md:text-xs text-zinc-700 border border-zinc-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-zinc-300 transition-shadow resize-y min-h-\[300px\]\"\s+value=\{r\.html\}\s+onChange=\{\(e\) => onUpdateHtml\(i, e\.target\.value\)\}\s+spellCheck=\{false\}\s+/>"
textarea_continuous_replacement = """<div className="w-full bg-[#2d2d2d] rounded-2xl overflow-hidden shadow-inner border border-zinc-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                    <Editor
                      value={r.html}
                      onValueChange={(code) => onUpdateHtml(i, code)}
                      highlight={(code) => Prism.highlight(code, Prism.languages.markup, 'markup')}
                      padding={24}
                      className="font-mono text-[11px] md:text-xs text-white min-h-[300px]"
                      style={{
                        fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                      }}
                    />
                  </div>"""

textarea_single_pattern = r"<textarea\s+className=\"w-full bg-white p-4 md:p-6 rounded-2xl font-mono text-\[11px\] md:text-xs text-zinc-700 border border-zinc-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-zinc-300 transition-shadow resize-y min-h-\[600px\]\"\s+value=\{results\[activeTab\]\?\.html \|\| ''\}\s+onChange=\{\(e\) => onUpdateHtml\(activeTab, e\.target\.value\)\}\s+spellCheck=\{false\}\s+/>"
textarea_single_replacement = """<div className="w-full bg-[#2d2d2d] rounded-2xl overflow-hidden shadow-inner border border-zinc-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                  <Editor
                    value={results[activeTab]?.html || ''}
                    onValueChange={(code) => onUpdateHtml(activeTab, code)}
                    highlight={(code) => Prism.highlight(code, Prism.languages.markup, 'markup')}
                    padding={24}
                    className="font-mono text-[11px] md:text-xs text-white min-h-[600px]"
                    style={{
                      fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                    }}
                  />
                </div>"""

content = re.sub(textarea_continuous_pattern, textarea_continuous_replacement, content, flags=re.DOTALL)
content = re.sub(textarea_single_pattern, textarea_single_replacement, content, flags=re.DOTALL)

with open('components/ResultsContent.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
