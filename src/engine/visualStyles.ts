
import { ArtStyle, VisualStyleKey } from '../../types';

// Provides descriptive prompt additions for image generation based on ArtStyle
export const visualStyles: Record<VisualStyleKey, string> = {
  [ArtStyle.ANIME]: "أنمي ياباني عالي الدقة",
  [ArtStyle.CARTOON]: "أسلوب كرتوني بسيط وملون",
  [ArtStyle.NOIR]: "أسود وأبيض سينمائي",
  [ArtStyle.FANTASY]: "خيال سحري",
};