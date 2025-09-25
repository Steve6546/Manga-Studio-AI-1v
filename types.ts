// Enums and string literal types

export enum ArtStyle {
  ANIME = 'anime',
  CARTOON = 'cartoon',
  NOIR = 'noir',
  FANTASY = 'fantasy',
}

export type VisualStyleKey = ArtStyle;

export enum PanelLayoutType {
  TWO_BY_TWO = '2x2',
  ONE_TWO_ONE = '1-2-1',
  THREE_ROW = '3-row',
  FOUR_GRID = '4-grid',
}

// UI Types

export interface OptionType {
  value: string;
  label: string;
}

// Core Data Structures

export interface SceneSettings {
  cameraAngle: string;
  detailLevel: number;
  colorTone: 'default' | 'vibrant' | 'muted' | 'sepia' | 'monochrome';
  additionalDetails: string;
}

export interface SpeechBubble {
    characterName: string;
    style: 'normal' | 'shout' | 'whisper' | 'thought' | 'narration';
    text: string;
}

export interface Panel {
  panelOrder: number;
  description: string;
  settings: SceneSettings;
  styleKey: VisualStyleKey;
  imageUrl?: string;
  imageGenerationPrompt?: string;
  caption?: string;
  dialogue?: SpeechBubble[];
}

export interface MangaPage {
  pageNumber: number;
  layout: PanelLayoutType;
  panels: Panel[];
}

export interface Chapter {
  chapterNumber: number;
  title?: string;
  pages: MangaPage[];
}

// Story Memory Components

export interface CharacterRelationship {
  characterId: string;
  relationshipType: string; // e.g., 'rival', 'friend', 'family'
  description?: string;
}

export interface CharacterMemory {
  id: string;
  name: string;
  role?: string;
  description?: string;
  traits?: string[];
  history?: string[];
  relationships?: CharacterRelationship[];
}

export interface WorldPlace {
  id: string;
  name: string;
  description?: string;
}

export interface WorldEvent {
  id: string;
  description: string;
  sceneOrder?: number; // Optional link to a scene
}

export interface StoryMemory {
  characters: CharacterMemory[];
  world: {
    places: WorldPlace[];
    majorEvents: WorldEvent[];
    timelineNotes: string;
    lore: string;
  };
  theme: string;
  overallStyleNotes: string;
}

// Main Document Structure

export interface MangaDocument {
  id: string;
  title: string;
  artStyle: ArtStyle;
  visualStyleKey: VisualStyleKey;
  environment: string; // From older version, can be phased out
  season?: number;
  episode?: number;
  summary?: string;
  content?: string; // Main narrative text
  contentHistory: string[];
  storyMemory: StoryMemory;
  chapters: Chapter[];
  createdAt: number;
  updatedAt: number;
}

// AI Task related types

export type AITaskName = 
  | 'generate_story_stub'
  | 'generate_story_continuation'
  | 'generate_panel_image'
  | 'suggest_plot_point'
  | 'get_story_feedback'
  | 'suggest_character_arc'
  | 'analyze_and_suggest_memory_updates'
  | 'generate_world_memory_foundation'
  | 'generate_manga_page_outline'
  | 'generate_panel_elements'
  | 'edit_panel_image'
  | 'suggest_story_graph_connections';


export interface PlotSuggestion {
    suggestion: string;
    reasoning?: string;
}

export interface StoryFeedback {
    overallAssessment: string;
    positivePoints: string[];
    areasForImprovement: string[];
}

export interface CharacterArcSuggestion {
    arcSuggestions: string[];
    relationshipSuggestions: string[];
}

export interface SuggestedMemoryUpdates {
    analysisSummary: string;
    suggestedCharacters: Omit<CharacterMemory, 'id' | 'relationships' | 'history'>[];
    suggestedPlaces: Omit<WorldPlace, 'id'>[];
    suggestedEvents: Omit<WorldEvent, 'id'>[];
}

export interface WorldBuildingSuggestions {
    analysisSummary: string;
    suggestedCharacters: (Omit<CharacterMemory, 'id'|'relationships'|'history'> & {id?: string})[];
    suggestedPlaces: (Omit<WorldPlace, 'id'> & {id?: string})[];
    suggestedThemes: string[];
}

export interface StoryGraphConnectionSuggestion {
    fromId: string; // 'char-id' or 'place-id'
    fromType: 'character' | 'place';
    toId: string; // 'char-id' or 'place-id'
    toType: 'character' | 'place';
    label: string; // e.g., "rival", "mentor", "location"
    reasoning: string;
}


export interface AIPromptInputs {
  generate_story_stub: { title: string; artStyle: ArtStyle; environment: string };
  generate_story_continuation: { currentStoryContent: string; storyMemory: StoryMemory };
  generate_panel_image: {
    panelDescription: string;
    styleKey: VisualStyleKey;
    settings: SceneSettings;
    storyMemory: StoryMemory;
    charactersInPanel?: { name: string; description?: string }[];
  };
  suggest_plot_point: { currentStoryContent: string; storyTitle: string; storyMemory: StoryMemory };
  get_story_feedback: { storyTitle: string; storySummary?: string; storyContent?: string; storyMemory?: StoryMemory };
  suggest_character_arc: { character: CharacterMemory; allCharacters?: CharacterMemory[]; storyContext: string };
  analyze_and_suggest_memory_updates: { currentStoryContent: string; existingStoryMemory: StoryMemory };
  generate_world_memory_foundation: { title: string; storyIdea: string; };
  generate_manga_page_outline: {
    storyIdea: string;
    artStyle: ArtStyle;
    environment?: string;
    targetPanelCount?: number;
    storyMemory: StoryMemory;
  };
  generate_panel_elements: {
      panelOrder: number;
      panelDescription: string;
      storyMemory: StoryMemory;
      charactersInPanel?: { name: string; description?: string }[];
  };
  edit_panel_image: {
    base64ImageData: string;
    mimeType: string;
    prompt: string;
  };
  suggest_story_graph_connections: {
    storyContent: string;
    storyMemory: StoryMemory;
  };
}

export interface AIOutputTypes {
  generate_story_stub: string;
  generate_story_continuation: string;
  generate_panel_image: { base64Image: string; actualPrompt: string };
  suggest_plot_point: PlotSuggestion;
  get_story_feedback: StoryFeedback;
  suggest_character_arc: CharacterArcSuggestion;
  analyze_and_suggest_memory_updates: SuggestedMemoryUpdates;
  generate_world_memory_foundation: WorldBuildingSuggestions;
  generate_manga_page_outline: {
      initialCharacters: Omit<CharacterMemory, 'id'>[];
      environmentSynopsis: string;
      centralConflictHint: string;
      panelDescriptions: {
          panelOrder: number;
          description: string;
          suggestedCharactersInPanel: string[];
      }[];
      pageTheme: string;
      pageLayoutSuggestion: PanelLayoutType;
  };
  generate_panel_elements: {
      panelOrder: number;
      caption?: string;
      dialogue?: SpeechBubble[];
  };
  edit_panel_image: {
    base64Image: string;
    text: string;
  };
  suggest_story_graph_connections: StoryGraphConnectionSuggestion[];
}