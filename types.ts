

export enum ArtStyle {
  ANIME = 'anime',
  CARTOON = 'cartoon',
  NOIR = 'noir',
  FANTASY = 'fantasy',
}

export enum Environment { // May be less directly used for manga panels but kept for overall theme
  CITY = 'city',
  FOREST = 'forest',
  SPACE = 'space',
  UNDERWATER = 'underwater',
  DESERT = 'desert',
}

// --- Sprint 8: Manga Specific Types ---
export enum PanelLayoutType {
  GRID_2X3 = 'grid_2x3', // 6 panels
  GRID_1X3_VERTICAL = 'grid_1x3_vertical', // 3 panels
  GRID_2X2 = 'grid_2x2', // 4 panels
  SPLASH_FULL_PAGE = 'splash_full_page', // 1 panel
  CUSTOM = 'custom', // For more complex, user-defined layouts later
}

export interface SpeechBubble {
  text: string;
  characterName?: string; // Optional: to hint which character is speaking
  style?: 'normal' | 'shout' | 'thought' | 'whisper' | 'narration'; // Narration can be a box
  // Position and specific shape are complex UI concerns, handle later.
}

export interface SceneSettings { // Reused for Panel image generation settings
  cameraAngle: string;
  detailLevel: number; 
  colorTone: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted' | 'default' | 'sepia' | 'grayscale'; 
  additionalDetails?: string;
}

export interface Panel {
  panelOrder: number; // Order within the page (0-indexed)
  description: string; // Text description of what happens in this panel (from AI outline)
  caption?: string; // Short narrative text for the panel (e.g., "Meanwhile...")
  dialogue?: SpeechBubble[];
  imagePrompt?: string; // Prompt used or to be used for image generation
  imageUrl?: string; // Base64 image data
  styleKey: VisualStyleKey; // Art style for this panel
  settings?: SceneSettings; // Image generation settings for this panel
  isGeneratingImage?: boolean;
  imageError?: string;
  timestamp?: number; // When image was generated/updated
}

export interface MangaPage {
  pageNumber: number; // Overall page number in the chapter/project
  layout: PanelLayoutType;
  panels: Panel[];
}

export interface Chapter {
  chapterNumber: number;
  title?: string;
  pages: MangaPage[];
}
// --- End Sprint 8 Manga Specific Types ---


export interface StorySetup { // Retained for initial project setup if simple inputs are still desired before full manga flow
  title: string;
  artStyle: ArtStyle;
  environment: Environment; // Can guide initial world memory or theme
  season?: string; 
  episode?: number; 
}

export type VisualStyleKey = ArtStyle; 

// --- Sprint 7: Story Memory Interfaces (Crucial for Manga Context) ---
export interface CharacterMemory {
  id: string;
  name: string;
  role?: string; 
  traits?: string[]; 
  description?: string; 
  history?: string[]; 
  relationships?: { relatedCharacterId: string; description: string }[]; 
}

export interface WorldPlace {
  id: string;
  name: string;
  description?: string;
}

export interface WorldEvent {
  id: string;
  description: string; 
  sceneOrder?: number; 
}

export interface WorldMemory {
  places: WorldPlace[];
  majorEvents: WorldEvent[];
  timelineNotes?: string; 
  lore?: string; 
}

export interface StoryMemory {
  characters: CharacterMemory[];
  world: WorldMemory;
  theme?: string;
  overallStyleNotes?: string; 
}
// --- End Sprint 7 Story Memory ---


export interface MangaDocument extends StorySetup { // Replaces FactoryData
  id: string;
  createdAt: number;
  updatedAt: number; 
  summary?: string; // Overall story summary, can be AI generated initially
  content?: string; // Full narrative text if user wants to write it out, AI can use this to generate panel descriptions
  contentHistory?: string[]; 
  visualStyleKey: VisualStyleKey; // Default style for the project
  chapters: Chapter[];
  storyMemory: StoryMemory; 
}

export interface OptionType<T = string> { 
  value: T;
  label: string;
}

export type AITask = 
  | "generate_story_stub" // May still be useful for a project summary
  | "generate_story_continuation" // For full narrative text
  | "generate_panel_image" // Replaces generate_scene_image
  | "suggest_plot_point"
  | "get_story_feedback"
  | "analyze_and_suggest_memory_updates" 
  | "suggest_character_arc"
  | "generate_manga_page_outline" // Sprint 8: New
  | "generate_panel_elements";     // Sprint 8: New (caption & dialogue for a panel)


export interface AIPromptInputs {
  generate_story_stub: StorySetup;
  generate_story_continuation: { currentStoryContent: string; storyMemory?: StoryMemory };
  generate_panel_image: { panelDescription: string; styleKey: VisualStyleKey; settings?: SceneSettings; storyMemory?: StoryMemory; charactersInPanel?: {name: string, description?: string}[] };
  suggest_plot_point: { currentStoryContent: string; storyTitle?: string; storySummary?: string; storyMemory?: StoryMemory };
  get_story_feedback: { storyTitle: string; storySummary?: string; storyContent?: string; storyMemory?: StoryMemory };
  analyze_and_suggest_memory_updates: { currentStoryContent: string; existingStoryMemory?: StoryMemory };
  suggest_character_arc: { character: CharacterMemory; storyContext: string; allCharacters?: CharacterMemory[]; storyTheme?: string };
  generate_manga_page_outline: { storyIdea: string; artStyle: VisualStyleKey; environment?: Environment; targetPanelCount?: number; storyMemory?: StoryMemory; }; // Sprint 8
  generate_panel_elements: { panelDescription: string; charactersInPanel?: {name: string, description?: string}[]; storyMemory?: StoryMemory; panelOrder: number; }; // Sprint 8 - panelOrder is required input
}

export interface PlotSuggestion {
  suggestion: string;
  reasoning?: string;
}

export interface StoryFeedback {
  positivePoints: string[];
  areasForImprovement: string[];
  overallAssessment: string;
}

export interface SuggestedMemoryUpdates {
  suggestedCharacters: Omit<CharacterMemory, 'id' | 'relationships'>[]; 
  suggestedPlaces: Omit<WorldPlace, 'id'>[];
  suggestedEvents: Omit<WorldEvent, 'id' | 'sceneOrder'>[];
  analysisSummary?: string;
}

export interface CharacterArcSuggestion {
  arcSuggestions: string[]; 
  relationshipSuggestions: string[]; 
}

// Sprint 8: Output types for new Manga AI tasks
export interface MangaPageOutline {
  initialCharacters: { name: string; description: string; role?: string; traits?: string[] }[];
  environmentSynopsis: string; // Brief description of setting
  centralConflictHint: string; // Initial problem or goal
  panelDescriptions: { panelOrder: number, description: string, suggestedCharactersInPanel?: string[] }[]; // Array of text descriptions for each panel
  pageTheme?: string; // Theme for this specific page
  pageLayoutSuggestion?: PanelLayoutType; // AI could suggest a layout
}

export interface PanelElements {
  panelOrder?: number; // Output might not always include it if known by caller
  caption: string; // Narrative text for the panel
  dialogue: SpeechBubble[]; // Dialogue for characters
}


export interface AIOutputTypes {
  generate_story_stub: string;
  generate_story_continuation: string;
  generate_panel_image: { base64Image: string; actualPrompt: string }; // panel image
  suggest_plot_point: PlotSuggestion;
  get_story_feedback: StoryFeedback;
  analyze_and_suggest_memory_updates: SuggestedMemoryUpdates; 
  suggest_character_arc: CharacterArcSuggestion;              
  generate_manga_page_outline: MangaPageOutline; // Sprint 8
  generate_panel_elements: PanelElements;       // Sprint 8
}
