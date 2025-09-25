
import { GoogleGenAI } from "@google/genai";
import { AIPromptInputs, AIOutputTypes, PlotSuggestion, StoryMemory } from '../../types';

function formatStoryMemoryForPrompt(storyMemory?: StoryMemory): string {
    if (!storyMemory) return "";
    const parts = [
        storyMemory.theme && `Theme: ${storyMemory.theme}`,
        storyMemory.characters?.length && `Characters: ${storyMemory.characters.map(c => c.name).join(', ')}`,
    ].filter(Boolean);
    return parts.length > 0 ? `\n--- Story Context ---\n${parts.join('\n')}\n-------------------\n` : "";
}

export async function suggestPlotPointTask(
    inputs: AIPromptInputs["suggest_plot_point"]
): Promise<AIOutputTypes["suggest_plot_point"]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const memoryContext = formatStoryMemoryForPrompt(inputs.storyMemory);
    const prompt = `
مهمة: اقترح حدثًا جديدًا أو تطورًا لقصة باللغة العربية.
عنوان القصة: ${inputs.storyTitle || "غير محدد"}
المحتوى الحالي (آخر جزء):
${inputs.currentStoryContent.slice(-1000)} 
${memoryContext}
الاقتراح يجب أن يكون منطقيًا ومثيرًا. اذكر الاقتراح وسببًا موجزًا له.

الاستجابة يجب أن تكون بتنسيق JSON صارم حسب الـ Schema التالي:
{
  "suggestion": "string",
  "reasoning": "string"
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
        return JSON.parse(response.text) as PlotSuggestion;
    } catch (e) {
        console.error("Failed to parse JSON from suggestPlotPointTask:", response.text, e);
        throw new Error("فشل تحليل استجابة الذكاء الاصطناعي.");
    }
}
