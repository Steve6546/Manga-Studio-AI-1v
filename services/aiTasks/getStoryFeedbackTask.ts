
import { GoogleGenAI } from "@google/genai";
import { AIPromptInputs, AIOutputTypes, StoryFeedback, StoryMemory } from '../../types';

function formatStoryMemoryForPrompt(storyMemory?: StoryMemory): string {
    if (!storyMemory) return "";
    const parts = [
        storyMemory.theme && `Theme: ${storyMemory.theme}`,
        storyMemory.characters?.length && `Characters: ${storyMemory.characters.map(c => c.name).join(', ')}`,
    ].filter(Boolean);
    if (parts.length === 0) return "";
    return `\n--- Story Context ---\n${parts.join('\n')}\n-------------------\n`;
}

export async function getStoryFeedbackTask(
    inputs: AIPromptInputs["get_story_feedback"]
): Promise<AIOutputTypes["get_story_feedback"]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const memoryContext = formatStoryMemoryForPrompt(inputs.storyMemory);
    const prompt = `
مهمة: قم بتقديم مراجعة نقدية بناءة لقصة المانغا التالية باللغة العربية.
عنوان القصة: "${inputs.storyTitle}"
ملخص القصة: ${inputs.storySummary || "غير متوفر"}
النص السردي: ${inputs.storyContent || "غير متوفر"}
${memoryContext}
يرجى التركيز على التقييم العام، نقاط القوة، وجوانب التحسين.

الاستجابة يجب أن تكون بتنسيق JSON صارم حسب الـ Schema التالي:
{
  "overallAssessment": "string",
  "positivePoints": ["string"],
  "areasForImprovement": ["string"]
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
        return JSON.parse(response.text) as StoryFeedback;
    } catch (e) {
        console.error("Failed to parse JSON from getStoryFeedbackTask:", response.text, e);
        throw new Error("فشل تحليل استجابة الذكاء الاصطناعي.");
    }
}
