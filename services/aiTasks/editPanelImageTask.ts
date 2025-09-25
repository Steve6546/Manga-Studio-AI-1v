import { GoogleGenAI, Modality } from "@google/genai";
import { AIPromptInputs, AIOutputTypes } from '../../types';

export async function editPanelImageTask(
  inputs: AIPromptInputs["edit_panel_image"]
): Promise<AIOutputTypes["edit_panel_image"]> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!inputs.base64ImageData) {
    throw new Error("Image data is required for editing.");
  }
  if (!inputs.prompt) {
    throw new Error("A prompt is required for editing the image.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: inputs.base64ImageData,
              mimeType: inputs.mimeType,
            },
          },
          {
            text: inputs.prompt,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let editedImageBase64: string | null = null;
    let accompanyingText = "";
    
    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                accompanyingText += part.text;
            } else if (part.inlineData?.data) {
                editedImageBase64 = part.inlineData.data;
            }
        }
    }

    if (!editedImageBase64) {
      throw new Error("The AI model did not return an edited image.");
    }

    return {
      base64Image: editedImageBase64,
      text: accompanyingText,
    };

  } catch (error: any) {
    console.error("Error editing image with Gemini:", error);
    throw new Error(`Failed to edit image: ${error.message}`);
  }
}
