import { GoogleGenAI } from "@google/genai";
// FIX: Corrected import path
import { AIPromptInputs, AIOutputTypes, StoryMemory } from '../../types';

function formatStoryMemoryForPrompt(storyMemory?: StoryMemory): string {
    if (!storyMemory) return "";
    const parts = [
        storyMemory.theme && `Theme: ${storyMemory.theme}`,
        storyMemory.characters?.length && `Characters: ${storyMemory.characters.map(c => c.name).slice(0, 3).join(', ')}`,
    ].filter(Boolean);
    if (parts.length === 0) return "";
    return `\n--- Story Context ---\n${parts.join('\n')}\n-------------------\n`;
}

export async function generateStoryContinuationTask(
  inputs: AIPromptInputs["generate_story_continuation"]
): Promise<AIOutputTypes["generate_story_continuation"]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  if (!inputs.currentStoryContent.trim()) {
    throw new Error("لا يمكن متابعة القصة بدون محتوى حالي.");
  }
  const memoryContext = formatStoryMemoryForPrompt(inputs.storyMemory);
  const prompt = `هذا نص سردي عام لقصة مانغا:\n\n${inputs.currentStoryContent}\n\n${memoryContext}\n\nمهمة: تابع كتابة القصة باللغة العربية. أضف فقرة أو فقرتين لإكمال النص بشكل طبيعي ومنطقي، مع الحفاظ على نفس الأسلوب.`;
  
  const response = await ai.models.generateContent({
      // FIX: Updated model name
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          temperature: 0.8,
      }
  });

  return response.text;
}
