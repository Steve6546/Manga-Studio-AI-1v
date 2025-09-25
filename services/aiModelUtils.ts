import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
// FIX: Corrected import path
import { StoryMemory } from '../types';

// FIX: Updated model names to recommended versions.
export const GEMINI_MODEL_TEXT_DEFAULT = 'gemini-2.5-flash';
export const GEMINI_MODEL_IMAGE_GEN_DEFAULT = 'imagen-4.0-generate-001';

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.warn("API_KEY for Gemini is not set in environment variables. AI features will be disabled or use stubs.");
}

// FIX: Initialize with named apiKey parameter.
export const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY_STUB" });

export function formatStoryMemoryForPrompt(storyMemory?: StoryMemory, charactersInFocus?: {name: string, description?:string}[]): string {
  if (!storyMemory && (!charactersInFocus || charactersInFocus.length === 0)) return "";

  let contextParts: string[] = [];

  if (storyMemory?.theme) contextParts.push(`الموضوع الرئيسي للقصة: ${storyMemory.theme}`);
  if (storyMemory?.overallStyleNotes) contextParts.push(`ملاحظات الأسلوب العام للقصة: ${storyMemory.overallStyleNotes}`);

  if (charactersInFocus && charactersInFocus.length > 0) {
     contextParts.push("الشخصيات الموجودة في هذا المشهد/اللوحة:");
     charactersInFocus.forEach(char => {
        const memChar = storyMemory?.characters.find(mc => mc.name.toLowerCase() === char.name.toLowerCase());
        const traits = memChar?.traits?.join(', ') || 'سمات غير محددة';
        const role = memChar?.role ? ` (${memChar.role})` : '';
        contextParts.push(`- ${char.name}${role}: ${char.description || traits}`);
     });
  } else if (storyMemory?.characters && storyMemory.characters.length > 0) {
    contextParts.push("الشخصيات البارزة في القصة (أول 3):");
    storyMemory.characters.slice(0, 3).forEach(char => {
      contextParts.push(`- ${char.name}${char.role ? ` (${char.role})` : ''}: ${char.traits?.join(', ') || 'سمات غير محددة'}. ${char.description || ''}`);
    });
  }

  if (!charactersInFocus || charactersInFocus.length === 0) {
    if (storyMemory?.world.places && storyMemory.world.places.length > 0) {
      contextParts.push("الأماكن الهامة (أول 2):");
      storyMemory.world.places.slice(0, 2).forEach(place => {
        contextParts.push(`- ${place.name}: ${place.description || 'وصف غير متوفر'}`);
      });
    }
    if (storyMemory?.world.majorEvents && storyMemory.world.majorEvents.length > 0) {
      contextParts.push("أحداث رئيسية (أول 2):");
      storyMemory.world.majorEvents.slice(0, 2).forEach(event => {
        contextParts.push(`- ${event.description}`);
      });
    }
  }

  if (storyMemory?.world.timelineNotes) contextParts.push(`ملاحظات الجدول الزمني للقصة: ${storyMemory.world.timelineNotes}`);
  if (storyMemory?.world.lore && (!charactersInFocus || charactersInFocus.length === 0)) {
    contextParts.push(`معلومات إضافية عن العالم: ${storyMemory.world.lore.substring(0, 200)}${storyMemory.world.lore.length > 200 ? '...' : ''}`);
  }

  if (contextParts.length === 0) return "";
  return "\n\n--- سياق القصة الحالي ---\n" + contextParts.join('\n') + "\n-------------------------\n";
}


export async function callGeminiTextModel(
  prompt: string,
  maxOutputTokens: number,
  temperature: number = 0.7,
  contextMessage: string,
  stubbedResponseGenerator?: () => string // For providing specific stubs per task
): Promise<string> {
  if (!apiKey || apiKey === "MISSING_API_KEY_STUB") {
    console.warn(`Stubbing AI call for ${contextMessage} due to missing API key.`);
    if (stubbedResponseGenerator) {
        return stubbedResponseGenerator();
    }
    // Generic fallback stub if no specific generator provided
    return `نص تجريبي لـ ${contextMessage}. مفتاح API غير متوفر.`;
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT_DEFAULT,
      contents: prompt,
      config: {
        temperature: temperature,
        maxOutputTokens: maxOutputTokens,
      },
    });
    // FIX: Access the 'text' property directly on the response object, as per SDK guidelines.
    const textOutput = response.text;
    if (textOutput === "" || textOutput === undefined || textOutput === null) {
      let detailedError = `لم يتم إرجاع أي نص من النموذج لـ ${contextMessage}.`;
      console.error(`No text from Gemini for ${contextMessage}. Prompt: "${prompt.substring(0,200)}...". Details:`, JSON.stringify(response, null, 2));
      if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason === "MAX_TOKENS") {
        detailedError += ` تم تجاوز الحد الأقصى للرموز (${maxOutputTokens}).`;
      } else if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason) {
        detailedError += ` سبب الإنهاء: ${response.candidates[0].finishReason}.`;
      }
      throw new Error(detailedError);
    }
    return textOutput;
  } catch (error: any) {
    console.error(`Error calling Gemini for ${contextMessage}:`, error.message, error.stack, error);
    throw new Error(`فشل ${contextMessage}: ${error.message}`);
  }
}

export async function callGeminiImageModel(
  prompt: string,
  contextMessage: string
): Promise<{ base64Image: string; actualPrompt: string }> {
   if (!apiKey || apiKey === "MISSING_API_KEY_STUB") {
    console.warn(`Stubbing Image AI call for ${contextMessage} due to missing API key.`);
    const placeholderBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; // 1x1 transparent PNG
    return { base64Image: placeholderBase64, actualPrompt: prompt };
  }
  try {
    const response = await ai.models.generateImages({
        model: GEMINI_MODEL_IMAGE_GEN_DEFAULT,
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });
    // FIX: Access the 'generatedImages' array on the response object, as per SDK guidelines.
    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      return { base64Image: response.generatedImages[0].image.imageBytes, actualPrompt: prompt };
    } else {
      console.error(`No image data from Imagen for ${contextMessage}. Prompt: "${prompt.substring(0,100)}...". Details:`, JSON.stringify(response, null, 2));
      throw new Error(`لم يتم إرجاع بيانات الصورة من النموذج لـ ${contextMessage}.`);
    }
  } catch (error: any) {
    console.error(`Error calling Imagen for ${contextMessage}:`, error);
    throw new Error(`فشل ${contextMessage}: ${error.message}`);
  }
}
