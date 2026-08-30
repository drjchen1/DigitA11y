import re

with open('services/geminiService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

original_fix = """    let result = response.text?.trim() || "";
    if (!result) {
      throw new Error("Empty response from Gemini");
    }
    if (result.startsWith('```html')) {
      result = result.replace(/^```html\\n?/, '').replace(/\\n?```$/, '');
    } else if (result.startsWith('```')) {
      result = result.replace(/^```\\n?/, '').replace(/\\n?```$/, '');
    }
    return result;"""

new_fix = """    let result = response.text?.trim() || "";
    if (!result) {
      throw new Error("Empty response from Gemini");
    }
    if (result.startsWith('```html')) {
      result = result.replace(/^```html\\n?/, '').replace(/\\n?```$/, '');
    } else if (result.startsWith('```')) {
      result = result.replace(/^```\\n?/, '').replace(/\\n?```$/, '');
    }
    return beautify.html(result, {
      indent_size: 2,
      wrap_line_length: 120,
      preserve_newlines: true
    });"""

content = content.replace(original_fix, new_fix)

with open('services/geminiService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
