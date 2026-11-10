export type MainTab = 'source' | 'card' | 'style';
export type StyleSubTab = 'title' | 'photo' | 'gradient' | 'logo';
export type AspectRatio = 'post_1080_1350' | 'reels_1080_1920';
export type LayoutTemplate = 'full_photo_gradient' | 'text_only' | 'center_card';
export type TextAlign = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | 'bold' | 'extra-bold';

export interface CardPhoto {
  hasPhoto: boolean;
  url: string;
  originalUploadUrl?: string;
  promptMode: 'auto' | 'custom';
  styleHint: string;
  scale: number; // 50 ~ 200 (default 100)
  offsetX: number; // -200 ~ 200 (default 0)
  offsetY: number; // -200 ~ 200 (default 0)
  isGrayscale: boolean;
}

export interface CardTypography {
  fontSizePx: number; // e.g. 66
  align: TextAlign;
  fontWeight: FontWeight;
  lineHeightPercent: number; // e.g. 134
  letterSpacingPercent: number; // e.g. -2
  baseColorHex: string; // e.g. '#FFFFFF'
  accentColorHex: string; // e.g. '#1CF28D'
  strokeWidthPx: number; // 0 ~ 10
}

export interface CardGradient {
  enabled: boolean;
  heightPercent: number; // e.g. 55
  opacity: number; // 0 ~ 1.0 (default 0.9)
}

export interface CardItem {
  cardId: number;
  role: '표지' | '본문' | '마무리';
  titleText: string;
  bodyText?: string;
  photo: CardPhoto;
  typography: CardTypography;
  gradient: CardGradient;
}

export interface AIRecommendedTitle {
  id: string;
  rawTitle: string;
  displayWithNewlineSymbol: string;
  score: string;
  reason: string;
  isSelected: boolean;
}

export interface SourceInput {
  guideline: string;
  inputType: 'paste' | 'link';
  rawText: string;
  sourceUrl: string;
  referenceImageUrl: string | null;
  targetCardCount: number;
}

export interface ExportAndTranslate {
  targetLanguage: string;
  captionText: string;
}

export interface ProjectState {
  apiKey: string;
  projectTitle: string;
  isSaved: boolean;
  activeMainTab: MainTab;
  activeStyleSubTab: StyleSubTab;
  aspectRatio: AspectRatio;
  layoutTemplate: LayoutTemplate;
  sourceInput: SourceInput;
  aiRecommendedTitles: AIRecommendedTitle[];
  articleSummary: string;
  cards: CardItem[];
  activeCardIndex: number;
  exportAndTranslate: ExportAndTranslate;
  canvasZoom: number; // 0.7 ~ 2.0 (default 1.0)
}
