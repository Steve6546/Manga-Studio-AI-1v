import { GoogleGenAI } from "@google/genai";
// FIX: Corrected import path
import { AIPromptInputs, AIOutputTypes, SpeechBubble, StoryMemory } from '../../types';

function formatStoryMemoryForPrompt(storyMemory?: StoryMemory, charactersInFocus?: {name: string, description?:string}[]): string {
  if (!storyMemory && (!charactersInFocus || charactersInFocus.length === 0)) return "";
  let contextParts: string[] = [];
  if (charactersInFocus && charactersInFocus.length > 0) {
     contextParts.push("Characters in this panel: " + charactersInFocus.map(c => c.name).join(', '));
  }
  if (storyMemory?.theme) contextParts.push(`Story Theme: ${storyMemory.theme}`);
  return contextParts.length > 0 ? `\n---Context---\n${contextParts.join('\n')}\n------------\n` : "";
}


export async function generatePanelElementsTask(
  inputs: AIPromptInputs["generate_panel_elements"]
): Promise<AIOutputTypes["generate_panel_elements"]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const memoryContext = formatStoryMemoryForPrompt(inputs.storyMemory, inputs.charactersInPanel);
  const characterNames = inputs.charactersInPanel?.map(c => c.name).join(' و ') || "الشخصيات المعنية";

  const prompt = `
مهمة: قم بإنشاء عناصر نصية للوحة مانغا باللغة العربية.
وصف اللوحة: "${inputs.panelDescription}"
الشخصيات في اللوحة: ${characterNames}
${memoryContext}
التعليمات:
1.  اكتب تعليقًا نصيًا (caption) مناسبًا أو اترك الحقل فارغًا.
2.  اكتب حوارًا (dialogue) بين الشخصيات. كل عنصر في الحوار يجب أن يحدد اسم الشخصية وأسلوب الكلام (normal, shout, whisper, thought, narration).

الرجاء تقديم الاستجابة بتنسيق JSON صارم حسب الـ Schema التالي:
{
  "caption": "string",
  "dialogue": [
    {
      "characterName": "string",
      "style": "normal | shout | whisper | thought | narration",
      "text": "string"
    }
  ]
}
`;
  const response = await ai.models.generateContent({
      // FIX: Updated model name
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          responseMimeType: "application/json",
      }
  });

  try {
    const parsed = JSON.parse(response.text) as Omit<AIOutputTypes["generate_panel_elements"], "panelOrder">;
    return {
        ...parsed,
        panelOrder: inputs.panelOrder,
    }
  } catch (e) {
    console.error("Failed to parse JSON from generatePanelElementsTask:", response.text, e);
    throw new Error("فشل تحليل استجابة الذكاء الاصطناعي.");
  }
}
