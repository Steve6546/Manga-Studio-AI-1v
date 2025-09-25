import { GoogleGenAI, Type } from "@google/genai";
import { AIPromptInputs, AIOutputTypes, CharacterArcSuggestion } from '../../types';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    arcSuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Suggestions for the character's personal growth or change."
    },
    relationshipSuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Suggestions for how the character's relationships with others could evolve."
    },
  },
  required: ["arcSuggestions", "relationshipSuggestions"]
};

export async function suggestCharacterArcTask(
  inputs: AIPromptInputs["suggest_character_arc"]
): Promise<AIOutputTypes["suggest_character_arc"]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const otherCharactersContext = inputs.allCharacters && inputs.allCharacters.length > 1
    ? `الشخصيات الأخرى في القصة تشمل: ${inputs.allCharacters.filter(c => c.id !== inputs.character.id).map(c => c.name).join(', ')}.`
    : "لا توجد شخصيات رئيسية أخرى معروفة حاليًا.";

  const prompt = `
مهمة: أنت مستشار قصصي متخصص في تطوير الشخصيات. قم بتقديم اقتراحات لتطور شخصية (Character Arc) في قصة مانغا باللغة العربية.

**بيانات الشخصية المستهدفة:**
- الاسم: ${inputs.character.name}
- الدور: ${inputs.character.role || "غير محدد"}
- السمات: ${inputs.character.traits?.join(', ') || "غير محددة"}
- الوصف/الخلفية: ${inputs.character.description || "غير متوفر"}

**السياق الحالي للقصة (آخر الأحداث):**
${inputs.storyContext.slice(-1500)}

**${otherCharactersContext}**

**التعليمات:**
1.  بناءً على بيانات الشخصية وسياق القصة، اقترح 2-3 مسارات تطور محتملة لهذه الشخصية (كيف يمكن أن تتغير شخصيتها، معتقداتها، أو أهدافها).
2.  اقترح 1-2 تطورات محتملة لعلاقات هذه الشخصية مع الشخصيات الأخرى المذكورة.

يرجى تقديم الاستجابة بتنسيق JSON صارم وحصري حسب الـ Schema المحدد.
`;
  
  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
      }
  });

  try {
    const parsed = JSON.parse(response.text) as CharacterArcSuggestion;
    // Ensure arrays exist
    parsed.arcSuggestions = parsed.arcSuggestions || [];
    parsed.relationshipSuggestions = parsed.relationshipSuggestions || [];
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON from suggestCharacterArcTask:", response.text, e);
    throw new Error("فشل تحليل استجابة الذكاء الاصطناعي.");
  }
}
