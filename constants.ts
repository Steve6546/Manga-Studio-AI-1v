import { ArtStyle, OptionType, PanelLayoutType, SceneSettings, AITaskName } from './types';

export const APP_TITLE = "Story Factory AI";

// Database
export const DB_NAME = "StoryFactoryDB";
export const DB_VERSION = 2; // Incremented for Sprint 8 schema changes
export const MANGA_PROJECTS_STORE_NAME = "manga_projects";

// Default objects
export const DEFAULT_SCENE_SETTINGS: SceneSettings = {
  cameraAngle: 'default',
  detailLevel: 3,
  colorTone: 'default',
  additionalDetails: '',
};

export const DEFAULT_PANEL_LAYOUT = PanelLayoutType.TWO_BY_TWO;

export const DEFAULT_PANELS_PER_PAGE: Record<PanelLayoutType, number> = {
    [PanelLayoutType.TWO_BY_TWO]: 4,
    [PanelLayoutType.ONE_TWO_ONE]: 4,
    [PanelLayoutType.THREE_ROW]: 3,
    [PanelLayoutType.FOUR_GRID]: 4,
};

// UI Options
export const ART_STYLES_OPTIONS: OptionType[] = [
  { value: ArtStyle.ANIME, label: "أنمي/مانغا" },
  { value: ArtStyle.CARTOON, label: "كرتون أمريكي" },
  { value: ArtStyle.NOIR, label: "فيلم نوار (أبيض وأسود)" },
  { value: ArtStyle.FANTASY, label: "فن خيالي" },
];

export const ENVIRONMENT_OPTIONS: OptionType[] = [
  { value: 'city', label: 'مدينة حديثة' },
  { value: 'forest', label: 'غابة غامضة' },
  { value: 'space', label: 'فضاء خيال علمي' },
  { value: 'desert', label: 'صحراء قاحلة' },
];

export const CAMERA_ANGLE_OPTIONS: OptionType[] = [
    { value: 'default', label: 'افتراضي' },
    { value: 'close-up', label: 'لقطة قريبة' },
    { value: 'medium-shot', label: 'لقطة متوسطة' },
    { value: 'long-shot', label: 'لقطة بعيدة' },
    { value: 'dutch-angle', label: 'زاوية مائلة' },
    { value: 'birds-eye-view', label: 'منظور عين الطائر' },
];

export const DETAIL_LEVEL_OPTIONS: OptionType[] = [
    { value: '1', label: 'منخفض جداً' },
    { value: '2', label: 'منخفض' },
    { value: '3', label: 'متوسط' },
    { value: '4', label: 'مرتفع' },
    { value: '5', label: 'مرتفع جداً' },
];

export const COLOR_TONE_OPTIONS: OptionType[] = [
    { value: 'default', label: 'افتراضي' },
    { value: 'vibrant', label: 'زاهي' },
    { value: 'muted', label: 'باهت' },
    { value: 'sepia', label: 'سيبيا' },
    { value: 'monochrome', label: 'أحادي اللون' },
];

export const AI_TASK_DEFINITIONS: Record<AITaskName, { description: string }> = {
    generate_story_stub: { description: "Generates a short story summary." },
    generate_story_continuation: { description: "Continues an existing story." },
    generate_panel_image: { description: "Generates an image for a manga panel." },
    suggest_plot_point: { description: "Suggests a new plot point." },
    get_story_feedback: { description: "Provides feedback on the story." },
    suggest_character_arc: { description: "Suggests development arcs for a character." },
    analyze_and_suggest_memory_updates: { description: "Analyzes text to suggest memory updates." },
    generate_world_memory_foundation: { description: "Generates initial world-building elements." },
    generate_manga_page_outline: { description: "Creates an outline for a manga page." },
    generate_panel_elements: { description: "Generates dialogue and captions for a panel." },
    edit_panel_image: { description: "Edits an existing panel image based on a prompt." },
    suggest_story_graph_connections: { description: "Analyzes the story to suggest new relationships for the graph." },
};