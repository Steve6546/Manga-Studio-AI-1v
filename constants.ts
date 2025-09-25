
import { ArtStyle, Environment, OptionType, SceneSettings, AITask, PanelLayoutType } from './types';

export const APP_TITLE = "مصنع المانغا بالذكاء الاصطناعي"; // Updated title
export const DB_NAME = 'StoryFactoryDB'; // Keep DB name for smoother transition for users
export const DB_VERSION = 2; // Increment version due to significant schema change
export const MANGA_PROJECTS_STORE_NAME = 'manga_projects'; // New store name

export const ART_STYLES_OPTIONS: OptionType<ArtStyle>[] = [
  { value: ArtStyle.ANIME, label: 'أنمي/مانغا' }, // Emphasize Manga
  { value: ArtStyle.CARTOON, label: 'كرتوني غربي' },
  { value: ArtStyle.NOIR, label: 'نوار/تحقيق' },
  { value: ArtStyle.FANTASY, label: 'خيالي/فانتازيا' },
];

export const ENVIRONMENT_OPTIONS: OptionType<Environment>[] = [
  { value: Environment.CITY, label: 'مدينة حديثة' },
  { value: Environment.FOREST, label: 'غابة/طبيعة' },
  { value: Environment.SPACE, label: 'فضاء/خيال علمي' },
  { value: Environment.UNDERWATER, label: 'تحت الماء' },
  { value: Environment.DESERT, label: 'صحراء/أراضي قاحلة' },
];

// Sprint 8: Panel Layout Options
export const PANEL_LAYOUT_OPTIONS: OptionType<PanelLayoutType>[] = [
  { value: PanelLayoutType.GRID_2X3, label: 'شبكة 2x3 (6 لوحات)' },
  { value: PanelLayoutType.GRID_1X3_VERTICAL, label: 'شبكة 1x3 عمودية (3 لوحات)' },
  { value: PanelLayoutType.GRID_2X2, label: 'شبكة 2x2 (4 لوحات)' },
  { value: PanelLayoutType.SPLASH_FULL_PAGE, label: 'صفحة كاملة (لوحة واحدة)' },
  // { value: PanelLayoutType.CUSTOM, label: 'مخصص (متقدم)' }, // For future
];


export const AI_TASK_DEFINITIONS: Record<AITask, { description: string }> = {
  generate_story_stub: { description: "توليد ملخص مبدئي للمشروع/القصة" },
  generate_story_continuation: { description: "متابعة كتابة النص السردي العام" },
  generate_panel_image: { description: "توليد صورة للوحة (بانل)" },
  suggest_plot_point: { description: "اقتراح حدث جديد للقصة العامة" },
  get_story_feedback: { description: "الحصول على مراجعة وتقييم للقصة العامة" },
  analyze_and_suggest_memory_updates: { description: "تحليل القصة واقتراح عناصر للذاكرة" },
  suggest_character_arc: { description: "اقتراح تطورات لشخصية معينة" },
  generate_manga_page_outline: { description: "توليد مخطط تفصيلي لصفحة مانغا (شخصيات، بيئة، لوحات)" }, // Sprint 8
  generate_panel_elements: { description: "توليد عناصر لوحة (تعليق نصي وحوار)" }, // Sprint 8
};

export const CAMERA_ANGLE_OPTIONS: OptionType<string>[] = [
  { value: 'eye_level', label: 'مستوى العين (Eye-level)' },
  { value: 'wide_shot', label: 'لقطة واسعة (Wide Shot)' },
  { value: 'close_up', label: 'لقطة قريبة (Close-up)' },
  { value: 'low_angle', label: 'زاوية منخفضة (Low Angle)' },
  { value: 'high_angle', label: 'زاوية مرتفعة (High Angle)' },
  { value: 'dutch_angle', label: 'زاوية مائلة (Dutch Angle)' },
  { value: 'pov', label: 'منظور شخصي (POV)' },
  { value: 'long_shot', label: 'لقطة بعيدة (Long Shot)' },
  { value: 'default', label: 'افتراضي/غير محدد' },
];

export const DETAIL_LEVEL_OPTIONS: OptionType<number>[] = [
  { value: 1, label: '1 - بسيط جداً' },
  { value: 2, label: '2 - قليل التفاصيل' },
  { value: 3, label: '3 - متوسط التفاصيل' },
  { value: 4, label: '4 - عالي التفاصيل' },
  { value: 5, label: '5 - مفصل للغاية' },
];

export const COLOR_TONE_OPTIONS: OptionType<SceneSettings['colorTone']>[] = [
  { value: 'default', label: 'افتراضي/غير محدد' },
  { value: 'warm', label: 'دافئ (Warm)' },
  { value: 'cool', label: 'بارد (Cool)' },
  { value: 'neutral', label: 'محايد (Neutral)' },
  { value: 'vibrant', label: 'حيوي (Vibrant)' },
  { value: 'muted', label: 'باهت/هادئ (Muted)' },
  { value: 'sepia', label: 'سيبيا (Sepia)' },
  { value: 'grayscale', label: 'تدرج رمادي (Grayscale)'},
];

export const DEFAULT_SCENE_SETTINGS: SceneSettings = { // Used for Panels now
  cameraAngle: 'default',
  detailLevel: 3,
  colorTone: 'default',
  additionalDetails: ''
};

export const DEFAULT_PANEL_LAYOUT: PanelLayoutType = PanelLayoutType.GRID_2X3;
export const DEFAULT_PANELS_PER_PAGE: Record<PanelLayoutType, number> = {
    [PanelLayoutType.GRID_2X3]: 6,
    [PanelLayoutType.GRID_1X3_VERTICAL]: 3,
    [PanelLayoutType.GRID_2X2]: 4,
    [PanelLayoutType.SPLASH_FULL_PAGE]: 1,
    [PanelLayoutType.CUSTOM]: 0, // Needs specific definition
};