
// Limits the number of scenes to generate to avoid excessive API calls / long loading times.
const MAX_SCENES = 10; 
// Minimum characters for a paragraph to be considered a scene, to filter out very short lines.
const MIN_SCENE_LENGTH = 25; 

/**
 * Splits the story text into distinct scenes.
 * A scene is typically a paragraph or a few connected paragraphs.
 * We split by double line breaks, then filter and limit.
 * @param storyText The full content of the story.
 * @returns An array of strings, where each string is a scene's text.
 */
export function splitIntoScenes(storyText: string): string[] {
  if (!storyText || storyText.trim().length === 0) {
    return [];
  }

  // Split by one or more occurrences of newline characters (handles \n\n, \n\r\n, etc.)
  // Then filter out empty strings that might result from multiple contiguous newlines.
  const potentialScenes = storyText
    .split(/\n\s*\n/) // Split by blank lines (one or more newlines with optional whitespace in between)
    .map(s => s.trim())
    .filter(s => s.length >= MIN_SCENE_LENGTH);

  return potentialScenes.slice(0, MAX_SCENES);
}