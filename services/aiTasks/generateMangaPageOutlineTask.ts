import { GoogleGenAI } from "@google/genai";
// FIX: Corrected import path
import { AIPromptInputs, AIOutputTypes, PanelLayoutType, StoryMemory } from '../../types';
// FIX: Corrected import path
import { ART_STYLES_OPTIONS, ENVIRONMENT_OPTIONS, DEFAULT_PANELS_PER_PAGE, DEFAULT_PANEL_LAYOUT } from '../../constants';

function formatStoryMemoryForPrompt(storyMemory?: StoryMemory): string {
    if (!storyMemory) return "";
    const parts = [
        storyMemory.theme && `Theme: ${storyMemory.theme}`,
        storyMemory.characters?.length && `Characters: ${storyMemory.characters.map(c => c.name).join(', ')}`,
    ].filter(Boolean);
    if (parts.length === 0) return "";
    return `\n--- Story Context ---\n${parts.join('\n')}\n-------------------\n`;
}

export async function generateMangaPageOutlineTask(
  inputs: AIPromptInputs["generate_manga_page_outline"]
): Promise<AIOutputTypes["generate_manga_page_outline"]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const artStyleLabel = ART_STYLES_OPTIONS.find(opt => opt.value === inputs.artStyle)?.label || inputs.artStyle;
  const environmentLabel = inputs.environment ? (ENVIRONMENT_OPTIONS.find(opt => opt.value === inputs.environment)?.label || inputs.environment) : "غير محددة";
  const targetPanelCount = inputs.targetPanelCount || DEFAULT_PANELS_PER_PAGE[DEFAULT_PANEL_LAYOUT];
  const memoryContext = formatStoryMemoryForPrompt(inputs.storyMemory);

  const prompt = `
مهمة: قم بإنشاء مخطط تفصيلي لصفحة مانغا واحدة فقط تمثل بداية القصة.
فكرة القصة: "${inputs.storyIdea}"
الأسلوب الفني: ${artStyleLabel}
البيئة: ${environmentLabel}
${memoryContext}
المطلوب:
1.  CHARACTERS: اقترح 2-3 شخصيات لهذه الصفحة (الاسم، الدور، الوصف، السمات). استخدم "CHARACTER_SEPARATOR" للفصل.
2.  ENVIRONMENT_SYNOPSIS: وصف موجز لبيئة هذه الصفحة.
3.  CENTRAL_CONFLICT_HINT: تلميح للصراع الرئيسي.
4.  PANEL_DESCRIPTIONS: قائمة بوصف لـ ${targetPanelCount} لوحات. كل وصف يجب أن يبدأ برقم (e.g., "1: وصف...") ويحتوي على [الشخصيات: ...]. استخدم "PANEL_SEPARATOR" للفصل.
5.  PAGE_THEME: موضوع الصفحة.
6.  LAYOUT_SUGGESTION: اقتراح تخطيط (${Object.values(PanelLayoutType).join(', ')}).

الرجاء استخدام التنسيق التالي بدقة:
CHARACTERS:
[الاسم (الدور)]; [الوصف]; [السمات]
CHARACTER_SEPARATOR
[الاسم (الدور)]; [الوصف]; [السمات]
ENVIRONMENT_SYNOPSIS: [وصف]
CENTRAL_CONFLICT_HINT: [تلميح]
PANEL_DESCRIPTIONS:
1: [وصف] [الشخصيات: اسم1]
PANEL_SEPARATOR
2: [وصف] [الشخصيات: اسم2]
PAGE_THEME: [موضوع]
LAYOUT_SUGGESTION: [تخطيط]
`;

  const response = await ai.models.generateContent({
      // FIX: Updated model name
      model: "gemini-2.5-flash",
      contents: prompt,
  });
  const responseText = response.text;

  // Parsing logic remains similar but is now self-contained.
  const output: AIOutputTypes["generate_manga_page_outline"] = { initialCharacters: [], environmentSynopsis: "", centralConflictHint: "", panelDescriptions: [], pageTheme: "", pageLayoutSuggestion: DEFAULT_PANEL_LAYOUT };
  
  const charSection = responseText.match(/CHARACTERS:\s*([\s\S]*?)(?:ENVIRONMENT_SYNOPSIS:|$)/i);
  if (charSection && charSection[1]) {
    charSection[1].trim().split(/CHARACTER_SEPARATOR/i).forEach(charStr => {
      const parts = charStr.trim().split(';');
      if (parts.length >= 1) {
        const nameRoleMatch = parts[0].match(/^(.*?)(?:\s*\((.*?)\))?$/);
        if (nameRoleMatch && nameRoleMatch[1]) {
            output.initialCharacters.push({
                name: nameRoleMatch[1].trim(),
                role: nameRoleMatch[2]?.trim(),
                description: parts[1]?.trim() || "وصف غير متوفر",
                traits: parts[2]?.split(',').map(t => t.trim()).filter(Boolean)
            });
        }
      }
    });
  }
  const panelDescSection = responseText.match(/PANEL_DESCRIPTIONS:\s*([\s\S]*?)(?:PAGE_THEME:|$)/i);
    if (panelDescSection && panelDescSection[1]) {
        panelDescSection[1].trim().split(/PANEL_SEPARATOR/i).forEach(panelStr => {
            const panelMatch = panelStr.match(/^(\d+):\s*([\s\S]*?)(?:\s*\[الشخصيات:\s*(.*?)\])?$/i);
            if (panelMatch) {
                const panelOrder = parseInt(panelMatch[1], 10) - 1; // 0-indexed
                if (!isNaN(panelOrder)) {
                    output.panelDescriptions.push({
                        panelOrder,
                        description: panelMatch[2].trim(),
                        suggestedCharactersInPanel: panelMatch[3]?.split(',').map(name => name.trim()).filter(Boolean)
                    });
                }
            }
        });
    }

  return output;
}
