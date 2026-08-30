import re

with open('services/geminiService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace('import { GeminiPageResponse, BatchResponse, ModelType } from "../types";',
                          'import { GeminiPageResponse, BatchResponse, ModelType } from "../types";\nimport beautify from "js-beautify";')

# Patch convertBatchToHtml
original_convert = """export const convertBatchToHtml = async (images: { base64: string, pageNumber: number }[], model: ModelType = 'gemini-3.6-flash', thinkingLevelStr: string = 'LOW', onModelFallback?: (fallbackModel: ModelType) => void): Promise<BatchResponse> => {
  let result = { text: "", tokenCount: 0, actualModel: model };
  try {
    result = await callBatchGeminiWithRetry(images, model, thinkingLevelStr, 3, onModelFallback);
    const parsed = JSON.parse(result.text);
    return { pages: parsed.pages as GeminiPageResponse[], tokenCount: result.tokenCount, actualModelUsed: result.actualModel };
  } catch (error: any) {
    console.error('Gemini Batch API Error:', error);
    throw new Error(`Failed to process batch: ${error.message}`);
  }
};"""

new_convert = """export const convertBatchToHtml = async (images: { base64: string, pageNumber: number }[], model: ModelType = 'gemini-3.6-flash', thinkingLevelStr: string = 'LOW', onModelFallback?: (fallbackModel: ModelType) => void): Promise<BatchResponse> => {
  let result = { text: "", tokenCount: 0, actualModel: model };
  try {
    result = await callBatchGeminiWithRetry(images, model, thinkingLevelStr, 3, onModelFallback);
    const parsed = JSON.parse(result.text);
    
    if (parsed.pages) {
      parsed.pages = parsed.pages.map((page: any) => {
        if (page.html) {
          page.html = beautify.html(page.html, {
            indent_size: 2,
            wrap_line_length: 120,
            preserve_newlines: true
          });
        }
        return page;
      });
    }

    return { pages: parsed.pages as GeminiPageResponse[], tokenCount: result.tokenCount, actualModelUsed: result.actualModel };
  } catch (error: any) {
    console.error('Gemini Batch API Error:', error);
    throw new Error(`Failed to process batch: ${error.message}`);
  }
};"""

content = content.replace(original_convert, new_convert)

# Make sure we also patch reprocessPageHtml
original_reprocess = """export const reprocessPageHtml = async (html: string, annotations: string, model: ModelType = 'gemini-3.6-flash', thinkingLevelStr: string = 'LOW'): Promise<string> => {
  const result = await callGeminiWithRetry([html, annotations], getReprocessSystemInstruction(), true, model, thinkingLevelStr);
  let cleanJson = result.text.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleanJson;
};"""

new_reprocess = """export const reprocessPageHtml = async (html: string, annotations: string, model: ModelType = 'gemini-3.6-flash', thinkingLevelStr: string = 'LOW'): Promise<string> => {
  const result = await callGeminiWithRetry([html, annotations], getReprocessSystemInstruction(), true, model, thinkingLevelStr);
  let cleanJson = result.text.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '');
  }
  
  return beautify.html(cleanJson, {
    indent_size: 2,
    wrap_line_length: 120,
    preserve_newlines: true
  });
};"""

content = content.replace(original_reprocess, new_reprocess)

with open('services/geminiService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
