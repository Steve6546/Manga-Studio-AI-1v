
import { GoogleGenAI } from "@google/genai";
import { AIPromptInputs, AIOutputTypes } from '../../types';
import { ART_STYLES_OPTIONS, ENVIRONMENT_OPTIONS } from '../../constants';

export async function generateStoryStubTask(
  inputs: AIPromptInputs["generate_story_stub"]
): Promise<AIOutputTypes["generate_story_stub"]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const artStyleLabel = ART_STYLES_OPTIONS.find(opt => opt.value === inputs.artStyle)?.label || inputs.artStyle;
  const environmentLabel = ENVIRONMENT_OPTIONS.find(opt => opt.value === inputs.environment)?.label || inputs.environment;
  
  const prompt = `
مهمة: اكتب ملخص قصة مانغا موجز ومثير باللغة العربية الفصحى (حوالي 60-100 كلمة).
العنوان: "${inputs.title}"
الأسلوب الفني: ${artStyleLabel}
البيئة: ${environmentLabel}
الملخص يجب أن يؤسس للفكرة الرئيسية والصراع المحتمل.
`;

  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          temperature: 0.7,
      }
  });

  return response.text;
}
