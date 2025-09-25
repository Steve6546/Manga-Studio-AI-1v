import { GoogleGenAI, Type } from "@google/genai";
// FIX: Corrected import path
import { AIPromptInputs, AIOutputTypes, WorldBuildingSuggestions } from '../../types';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        analysisSummary: { type: Type.STRING, description: "A brief, encouraging analysis of the core idea." },
        suggestedCharacters: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING, description: "e.g., Protagonist, Antagonist, Mentor" },
                    description: { type: Type.STRING, description: "brief visual and personality description" },
                    traits: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["name", "role", "description", "traits"]
            },
        },
        suggestedPlaces: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "what makes this place unique or important" },
                },
                 required: ["name", "description"]
            },
        },
        suggestedThemes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        },
    },
     required: ["analysisSummary", "suggestedCharacters", "suggestedPlaces", "suggestedThemes"]
};


export async function generateWorldMemoryFoundationTask(
  inputs: AIPromptInputs["generate_world_memory_foundation"]
): Promise<AIOutputTypes["generate_world_memory_foundation"]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const prompt = `
Act as a creative co-writer for a manga artist. Based on the provided idea, brainstorm foundational elements for the world.
Manga Title: "${inputs.title}"
Core Idea: "${inputs.storyIdea}"

Your task is to generate suggestions for characters, places, and themes. Provide a brief analysis of the idea first.
Return your response in the specified JSON format.
`;
  
  const response = await ai.models.generateContent({
    // FIX: Updated model name
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });

  try {
    const parsedJson = JSON.parse(response.text) as WorldBuildingSuggestions;
    // Ensure arrays exist even if the model returns null/undefined
    parsedJson.suggestedCharacters = parsedJson.suggestedCharacters || [];
    parsedJson.suggestedPlaces = parsedJson.suggestedPlaces || [];
    parsedJson.suggestedThemes = parsedJson.suggestedThemes || [];
    return parsedJson;
  } catch (e) {
    console.error("Failed to parse JSON from generateWorldMemoryFoundationTask:", response.text, e);
    throw new Error("The AI's brainstorming session resulted in an unexpected format.");
  }
}
