
import { AIPromptInputs, AIOutputTypes } from '../types';

// Import individual task handlers
import { generateStoryStubTask } from './aiTasks/generateStoryStubTask';
import { generateStoryContinuationTask } from './aiTasks/generateStoryContinuationTask';
import { generatePanelImageTask } from './aiTasks/generatePanelImageTask';
import { suggestPlotPointTask } from './aiTasks/suggestPlotPointTask';
import { getStoryFeedbackTask } from './aiTasks/getStoryFeedbackTask';
import { analyzeAndSuggestMemoryUpdatesTask } from './aiTasks/analyzeAndSuggestMemoryUpdatesTask';
import { suggestCharacterArcTask } from './aiTasks/suggestCharacterArcTask';
import { generateMangaPageOutlineTask } from './aiTasks/generateMangaPageOutlineTask';
import { generatePanelElementsTask } from './aiTasks/generatePanelElementsTask';


export async function googleAIController<T extends keyof AIPromptInputs>(
  taskType: T,
  inputs: AIPromptInputs[T]
): Promise<AIOutputTypes[T]> {
  switch (taskType) {
    case "generate_story_stub":
      return generateStoryStubTask(inputs as AIPromptInputs["generate_story_stub"]) as Promise<AIOutputTypes[T]>;
    case "generate_story_continuation":
      return generateStoryContinuationTask(inputs as AIPromptInputs["generate_story_continuation"]) as Promise<AIOutputTypes[T]>;
    case "generate_panel_image":
      return generatePanelImageTask(inputs as AIPromptInputs["generate_panel_image"]) as Promise<AIOutputTypes[T]>;
    case "suggest_plot_point":
      return suggestPlotPointTask(inputs as AIPromptInputs["suggest_plot_point"]) as Promise<AIOutputTypes[T]>;
    case "get_story_feedback":
      return getStoryFeedbackTask(inputs as AIPromptInputs["get_story_feedback"]) as Promise<AIOutputTypes[T]>;
    case "analyze_and_suggest_memory_updates":
      return analyzeAndSuggestMemoryUpdatesTask(inputs as AIPromptInputs["analyze_and_suggest_memory_updates"]) as Promise<AIOutputTypes[T]>;
    case "suggest_character_arc":
      return suggestCharacterArcTask(inputs as AIPromptInputs["suggest_character_arc"]) as Promise<AIOutputTypes[T]>;
    case "generate_manga_page_outline":
      return generateMangaPageOutlineTask(inputs as AIPromptInputs["generate_manga_page_outline"]) as Promise<AIOutputTypes[T]>;
    case "generate_panel_elements":
      return generatePanelElementsTask(inputs as AIPromptInputs["generate_panel_elements"]) as Promise<AIOutputTypes[T]>;
    default:
      const exhaustiveCheck: never = taskType;
      console.error(`Unknown AI task type: ${exhaustiveCheck}`);
      throw new Error(`مهمة الذكاء الاصطناعي غير معروفة: ${exhaustiveCheck}`);
  }
}
