import { GoogleGenAI, Type } from "@google/genai";
import { AIPromptInputs, AIOutputTypes, StoryGraphConnectionSuggestion } from '../../types';

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            fromId: { type: Type.STRING },
            fromType: { type: Type.STRING, enum: ['character', 'place'] },
            toId: { type: Type.STRING },
            toType: { type: Type.STRING, enum: ['character', 'place'] },
            label: { type: Type.STRING },
            reasoning: { type: Type.STRING }
        },
        required: ["fromId", "fromType", "toId", "toType", "label", "reasoning"]
    }
};

export async function suggestStoryGraphConnectionsTask(
  inputs: AIPromptInputs["suggest_story_graph_connections"]
): Promise<AIOutputTypes["suggest_story_graph_connections"]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const { storyContent, storyMemory } = inputs;

  const characterList = storyMemory.characters.map(c => `- Character: ${c.name} (ID: ${c.id})`).join('\n');
  const placeList = storyMemory.world.places.map(p => `- Place: ${p.name} (ID: ${p.id})`).join('\n');
  const existingRelationships = storyMemory.characters.flatMap(c => 
    c.relationships?.map(r => `${c.name} -> ${storyMemory.characters.find(c2 => c2.id === r.characterId)?.name} (${r.relationshipType})`) || []
  );

  const prompt = `
Act as a story analyst. Your task is to analyze a story's narrative and its existing knowledge base (Story Memory) to find implicit or potential new relationships between characters, or between characters and places.

**Existing Story Memory:**
${characterList}
${placeList}

**Existing Explicit Relationships:**
${existingRelationships.join(', ') || 'None'}

**Story Narrative:**
---
${storyContent.slice(-2000)}
---

**Instructions:**
1. Read the narrative and identify interactions or mentions that suggest a new relationship.
2. The relationship could be between two characters (e.g., mentor, rival, ally) or between a character and a place (e.g., 'lives in', 'is searching for', 'fears').
3. **Only suggest connections that are NOT already listed in the "Existing Explicit Relationships".**
4. For each suggestion, provide the IDs of the two items, their types ('character' or 'place'), a descriptive label for the relationship, and a brief reasoning based on the narrative text.

Return a JSON array of suggestions. Use the exact IDs provided.
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
    return JSON.parse(response.text) as StoryGraphConnectionSuggestion[];
  } catch (e) {
    console.error("Failed to parse JSON from suggestStoryGraphConnectionsTask:", response.text, e);
    throw new Error("The AI's connection analysis resulted in an unexpected format.");
  }
}
