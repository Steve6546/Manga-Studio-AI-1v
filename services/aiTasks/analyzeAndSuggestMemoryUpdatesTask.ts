
import { GoogleGenAI } from "@google/genai";
import { AIPromptInputs, AIOutputTypes, SuggestedMemoryUpdates, StoryMemory } from '../../types';

function formatStoryMemoryForPrompt(storyMemory?: StoryMemory): string {
    if (!storyMemory) return "";
    // Simplified version for brevity
    const parts = [
        storyMemory.theme && `Theme: ${storyMemory.theme}`,
        storyMemory.characters?.length && `Characters: ${storyMemory.characters.map(c => c.name).slice(0, 3).join(', ')}`,
    ].filter(Boolean);
    if (parts.length === 0) return "";
    return `\nExisting Memory Context:\n${parts.join('\n')}\n`;
}

export async function analyzeAndSuggestMemoryUpdatesTask(
  inputs: AIPromptInputs["analyze_and_suggest_memory_updates"]
): Promise<AIOutputTypes["analyze_and_suggest_memory_updates"]> {

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const existingMemoryContext = inputs.existingStoryMemory ? formatStoryMemoryForPrompt(inputs.existingStoryMemory) : "";
  const prompt = `
مهمة: قم بتحليل نص القصة التالي باللغة العربية، واستخرج منه عناصر مهمة لتحديث ذاكرة القصة.
نص القصة:
${inputs.currentStoryContent}
${existingMemoryContext}

التعليمات:
1.  حدد الشخصيات (الاسم، الدور، وصف موجز، السمات).
2.  حدد الأماكن الهامة (الاسم، وصف موجز).
3.  حدد الأحداث الرئيسية.
4.  قدم ملخصًا موجزًا لتحليلك.

الاستجابة يجب أن تكون بتنسيق JSON صارم حسب الـ Schema التالي:
{
  "analysisSummary": "string",
  "suggestedCharacters": [{ "name": "string", "role": "string", "description": "string", "traits": ["string"] }],
  "suggestedPlaces": [{ "name": "string", "description": "string" }],
  "suggestedEvents": [{ "description": "string" }]
}
`;

  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          responseMimeType: "application/json",
      }
  });

  try {
    // The response text should be a valid JSON string.
    return JSON.parse(response.text) as SuggestedMemoryUpdates;
  } catch (e) {
    console.error("Failed to parse JSON from analyzeAndSuggestMemoryUpdatesTask:", response.text, e);
    throw new Error("فشل تحليل استجابة الذكاء الاصطناعي.");
  }
}
