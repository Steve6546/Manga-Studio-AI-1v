
import { GoogleGenAI } from "@google/genai";
import { AIPromptInputs, AIOutputTypes, CharacterArcSuggestion } from '../../types';

export async function suggestCharacterArcTask(
  inputs: AIPromptInputs["suggest_character_arc"]
): Promise<AIOutputTypes["suggest_character_arc"]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const otherCharactersContext = inputs.allCharacters && inputs.allCharacters.length > 1
    ? `الشخصيات الأخرى: ${inputs.allCharacters.filter(c => c.id !== inputs.character.id).map(c => c.name).join(', ')}.`
    : "";

  const prompt = `
مهمة: قم بتقديم اقتراحات لتطور شخصية (Character Arc) في قصة مانغا باللغة العربية.
الشخصية:
- الاسم: ${inputs.character.name}
- الدور: ${inputs.character.role || "غير محدد"}
- السمات: ${inputs.character.traits?.join(', ') || "غير محددة"}
السياق الحالي للقصة:
${inputs.storyContext.slice(-1500)}
${otherCharactersContext}
التعليمات:
1.  اقترح تطورات محتملة لمسار هذه الشخصية.
2.  اقترح تطورات محتملة لعلاقات هذه الشخصية.

الاستجابة يجب أن تكون بتنسيق JSON صارم حسب الـ Schema التالي:
{
  "arcSuggestions": ["string"],
  "relationshipSuggestions": ["string"]
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
    return JSON.parse(response.text) as CharacterArcSuggestion;
  } catch (e) {
    console.error("Failed to parse JSON from suggestCharacterArcTask:", response.text, e);
    throw new Error("فشل تحليل استجابة الذكاء الاصطناعي.");
  }
}
