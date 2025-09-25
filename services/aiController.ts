import { AIPromptInputs, AIOutputTypes, AITaskName } from '../types';

// Import all task functions
import { generateStoryStubTask } from './aiTasks/generateStoryStubTask';
import { generateStoryContinuationTask } from './aiTasks/generateStoryContinuationTask';
import { generatePanelImageTask } from './aiTasks/generatePanelImageTask';
import { suggestPlotPointTask } from './aiTasks/suggestPlotPointTask';
import { getStoryFeedbackTask } from './aiTasks/getStoryFeedbackTask';
import { suggestCharacterArcTask } from './aiTasks/suggestCharacterArcTask';
import { analyzeAndSuggestMemoryUpdatesTask } from './aiTasks/analyzeAndSuggestMemoryUpdatesTask';
import { generateWorldMemoryFoundationTask } from './aiTasks/generateWorldMemoryFoundationTask';
import { generateMangaPageOutlineTask } from './aiTasks/generateMangaPageOutlineTask';
import { generatePanelElementsTask } from './aiTasks/generatePanelElementsTask';
import { editPanelImageTask } from './aiTasks/editPanelImageTask';
import { suggestStoryGraphConnectionsTask } from './aiTasks/suggestStoryGraphConnectionsTask';

// A map from task names to task functions
const taskMap: { [K in AITaskName]: (inputs: AIPromptInputs[K]) => Promise<AIOutputTypes[K]> } = {
    generate_story_stub: generateStoryStubTask,
    generate_story_continuation: generateStoryContinuationTask,
    generate_panel_image: generatePanelImageTask,
    suggest_plot_point: suggestPlotPointTask,
    get_story_feedback: getStoryFeedbackTask,
    suggest_character_arc: suggestCharacterArcTask,
    analyze_and_suggest_memory_updates: analyzeAndSuggestMemoryUpdatesTask,
    generate_world_memory_foundation: generateWorldMemoryFoundationTask,
    generate_manga_page_outline: generateMangaPageOutlineTask,
    generate_panel_elements: generatePanelElementsTask,
    edit_panel_image: editPanelImageTask,
    suggest_story_graph_connections: suggestStoryGraphConnectionsTask,
};

/**
 * Central controller for all AI interactions.
 * It takes a task name and the corresponding inputs, and returns the output.
 * This provides a single point of entry for AI calls, making it easier to manage,
 * mock, and add cross-cutting concerns like logging or error handling.
 *
 * @param taskName The name of the AI task to execute.
 * @param inputs The inputs required for that specific task.
 * @returns A promise that resolves with the output of the AI task.
 */
export async function googleAIController<T extends AITaskName>(
  taskName: T,
  inputs: AIPromptInputs[T]
): Promise<AIOutputTypes[T]> {
  const taskFunction = taskMap[taskName];

  if (!taskFunction) {
    throw new Error(`AI task "${taskName}" is not implemented.`);
  }

  try {
    // The type assertion is safe because taskMap is strongly typed.
    const result = await (taskFunction as (inputs: AIPromptInputs[T]) => Promise<AIOutputTypes[T]>)(inputs);
    return result;
  } catch (error: any) {
    console.error(`Error executing AI task "${taskName}":`, error);
    // Re-throw a more user-friendly error or a specific error type
    throw new Error(`An error occurred while performing the AI task: ${error.message}`);
  }
}