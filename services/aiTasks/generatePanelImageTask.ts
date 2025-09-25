import { GoogleGenAI } from "@google/genai";
// FIX: Corrected import path
import { AIPromptInputs, AIOutputTypes, ArtStyle, StoryMemory } from '../../types';
import { visualStyles } from '../../src/engine/visualStyles';

function formatStoryMemoryForPrompt(storyMemory?: StoryMemory, charactersInFocus?: {name: string, description?:string}[]): string {
    if (!storyMemory && (!charactersInFocus || charactersInFocus.length === 0)) return "";
    let contextParts: string[] = [];
    if (storyMemory?.theme) contextParts.push(`Overall story theme: ${storyMemory.theme}.`);
    if (charactersInFocus && charactersInFocus.length > 0) {
        contextParts.push("Characters in this panel are: " + charactersInFocus.map(c => `${c.name} (${c.description || 'no description'})`).join(', '));
    }
    return contextParts.length > 0 ? `\n\n[Story Context: ${contextParts.join(' ')}]` : "";
}

export async function generatePanelImageTask(
  inputs: AIPromptInputs["generate_panel_image"]
): Promise<AIOutputTypes["generate_panel_image"]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  if (!inputs.panelDescription.trim()) {
    throw new Error("Panel description cannot be empty.");
  }

  let stylePromptPart = visualStyles[inputs.styleKey] || visualStyles[ArtStyle.ANIME];
  if (inputs.styleKey === ArtStyle.ANIME) {
      stylePromptPart = `High-contrast, black and white manga panel style, sharp ink lines, using screentones for shading, professional Japanese manga art. Do not use any color.`;
  }
  
  const memoryContext = formatStoryMemoryForPrompt(inputs.storyMemory, inputs.charactersInPanel);
  const settings = inputs.settings;
  
  const promptSegments = [
    `Generate an image for a single manga panel.`,
    `**Visual Style:** ${stylePromptPart}.`,
    `**Panel Content Description:** "${inputs.panelDescription}".`,
    settings?.cameraAngle && settings.cameraAngle !== 'default' && `**Camera:** ${settings.cameraAngle}.`,
    settings?.colorTone && settings.colorTone !== 'default' && inputs.styleKey !== ArtStyle.ANIME && `**Color Tone:** ${settings.colorTone}.`,
    settings?.additionalDetails && `**Additional Details:** ${settings.additionalDetails}.`,
    memoryContext
  ];

  const finalPrompt = promptSegments.filter(Boolean).join('\n');

  const response = await ai.models.generateImages({
      // FIX: Updated model name
      model: 'imagen-4.0-generate-001',
      prompt: finalPrompt,
      config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
      },
  });

  if (response.generatedImages && response.generatedImages[0].image?.imageBytes) {
      return { base64Image: response.generatedImages[0].image.imageBytes, actualPrompt: finalPrompt };
  } else {
      console.error("No image data from Imagen.", response);
      throw new Error("The AI model did not return image data.");
  }
}
