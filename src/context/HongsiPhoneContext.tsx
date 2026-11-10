import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ProjectState,
  MainTab,
  StyleSubTab,
  AspectRatio,
  LayoutTemplate,
  CardItem,
  CardTypography,
  CardPhoto,
  CardGradient,
  AIRecommendedTitle,
} from '../types/hongsiphone';
import {
  DEFAULT_SOURCE_TEXT,
  DEFAULT_RECOMMENDED_TITLES,
  DEFAULT_SUMMARY,
  DEFAULT_CAPTION,
  generateInitialCards,
  generateBlankCards,
} from '../services/mockAiService';
import { exportCardsAsZip } from '../utils/exportZip';
import { analyzeContentWithAI, generateCardImageAI, formatFallbackTitle } from '../services/geminiService';
import {
  fetchServerAuthInfo,
  verifyPasswordMatch,
  verifyAdminMasterKey,
} from '../config/authConfig';

interface HongsiPhoneContextType {
  isAuthenticated: boolean;
  authenticate: (password: string) => boolean | Promise<boolean>;
  logout: () => void;
  state: ProjectState;
  isLanding: boolean;
  isAnalyzingModalOpen: boolean;
  analyzingStep: number;
  isImageGeneratingModalOpen: boolean;
  imageGeneratingStep: number;
  isColorPickerOpen: boolean;
  colorPickerTarget: 'base' | 'accent';
  isCropMode: boolean;
  isDarkMode: boolean;

  // Actions
  setApiKey: (key: string) => void;
  startStudio: () => void;
  setActiveMainTab: (tab: MainTab) => void;
  setActiveStyleSubTab: (subTab: StyleSubTab) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setLayoutTemplate: (template: LayoutTemplate) => void;
  setProjectTitle: (title: string) => void;
  setGuideline: (guideline: string) => void;
  setSourceInputType: (type: 'paste' | 'link') => void;
  setSourceText: (text: string) => void;
  setSourceUrl: (url: string) => void;
  setTargetCardCount: (count: number) => void;
  setReferenceImage: (url: string | null) => void;
  removeReferenceImage: () => void;
  setCanvasZoom: (zoom: number | ((prev: number) => number)) => void;
  runSourceAnalysis: () => Promise<void>;
  selectRecommendedTitle: (id: string) => void;
  runGenerateImage: (cardIndex?: number) => Promise<void>;
  runGenerateAllImages: () => Promise<void>;
  setActiveCardIndex: (index: number) => void;
  addCard: () => void;
  duplicateCard: (index: number) => void;
  removeCard: (index: number) => void;
  moveCardForward: (index: number) => void;
  moveCardBackward: (index: number) => void;
  updateCardTitle: (title: string) => void;
  updateCardTypography: (patch: Partial<CardTypography>) => void;
  updateCardPhoto: (patch: Partial<CardPhoto>) => void;
  updateCardGradient: (patch: Partial<CardGradient>) => void;
  removeCardPhoto: (index: number) => void;
  saveProject: () => void;
  toggleCropMode: () => void;
  toggleDarkMode: () => void;
  openColorPicker: (target: 'base' | 'accent') => void;
  closeColorPicker: () => void;
  setColorPickerColor: (hex: string) => void;
  translateLanguage: (lang: string) => void;
  generateCaption: () => void;
  exportZip: () => Promise<void>;
  loadSampleProject: () => void;
  clearAllContent: () => void;
}

const HongsiPhoneContext = createContext<HongsiPhoneContextType | undefined>(undefined);

export const HongsiPhoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activePassword, setActivePassword] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hongsiphone_custom_password') || 'hongsi2026';
    }
    return 'hongsi2026';
  });

  // Real-time server auth validation and continuous monitoring
  useEffect(() => {
    let isMounted = true;

    const checkServerAuth = async () => {
      const info = await fetchServerAuthInfo();
      if (!isMounted) return;

      const currentActive = info?.activePassword || 'hongsi2026';
      setActivePassword(currentActive);

      const savedPass = localStorage.getItem('hongsiphone_session_pass') || '';
      const hasAuth = localStorage.getItem('hongsiphone_auth') === 'granted';

      if (hasAuth && savedPass) {
        // 1. Admin master key always remains authenticated
        if (verifyAdminMasterKey(savedPass)) {
          setIsAuthenticated(true);
          return;
        }

        // 2. Ordinary user password: check against current active server password
        if (!verifyPasswordMatch(savedPass, currentActive)) {
          // PASSWORD CHANGED BY ADMIN! Force immediate lockout!
          setIsAuthenticated(false);
          localStorage.removeItem('hongsiphone_auth');
          localStorage.removeItem('hongsiphone_session_pass');
        } else {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkServerAuth();

    // Poll every 3 seconds for instant multi-user lockout
    const interval = setInterval(checkServerAuth, 3000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkServerAuth();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkServerAuth);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkServerAuth);
    };
  }, []);

  const authenticate = async (inputPassword: string): Promise<boolean> => {
    const cleanInput = (inputPassword || '').trim();
    if (!cleanInput) return false;

    // 1. 현재 로컬/메모리 및 마스터키 확인
    if (verifyPasswordMatch(cleanInput, activePassword)) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hongsiphone_auth', 'granted');
        localStorage.setItem('hongsiphone_session_pass', cleanInput);
      }
      return true;
    }

    // 2. 불일치 시, 방금 관리자가 변경했을 가능성을 대비해 클라우드/서버 최신 비밀번호 즉시 확인
    try {
      const info = await fetchServerAuthInfo();
      const latestPass = info?.activePassword || activePassword;
      setActivePassword(latestPass);
      if (verifyPasswordMatch(cleanInput, latestPass)) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('hongsiphone_auth', 'granted');
          localStorage.setItem('hongsiphone_session_pass', cleanInput);
        }
        return true;
      }
    } catch {
      // ignore
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hongsiphone_auth');
      localStorage.removeItem('hongsiphone_session_pass');
    }
  };

  const [isLanding, setIsLanding] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isCropMode, setIsCropMode] = useState<boolean>(false);

  // Stepper Modals state
  const [isAnalyzingModalOpen, setIsAnalyzingModalOpen] = useState<boolean>(false);
  const [analyzingStep, setAnalyzingStep] = useState<number>(0);

  const [isImageGeneratingModalOpen, setIsImageGeneratingModalOpen] = useState<boolean>(false);
  const [imageGeneratingStep, setImageGeneratingStep] = useState<number>(0);

  // Color picker state
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<'base' | 'accent'>('accent');

  // Core Project State (Option B: Fresh Clean Start)
  const [state, setState] = useState<ProjectState>(() => {
    const savedApiKey = typeof window !== 'undefined' 
      ? (localStorage.getItem('hongsiphone_gemini_api_key') || localStorage.getItem('hongsiphone_gemini_api_key') || '') 
      : '';
    return {
      apiKey: savedApiKey,
      projectTitle: '새 카드뉴스',
      isSaved: false,
      activeMainTab: 'source',
      activeStyleSubTab: 'title',
      aspectRatio: 'post_1080_1350',
      layoutTemplate: 'full_photo_gradient',
      sourceInput: {
        guideline: '제목에 숫자를 넣어주세요 / 본문은 존댓말로 / 인용문은 있는 그대로 살려주세요',
        inputType: 'paste',
        rawText: '',
        sourceUrl: '',
        referenceImageUrl: null,
        targetCardCount: 2,
      },
      aiRecommendedTitles: [],
      articleSummary: '',
      cards: generateBlankCards(2),
      activeCardIndex: 0,
      exportAndTranslate: {
        targetLanguage: '日本語',
        captionText: '',
      },
      canvasZoom: 1.0,
    };
  });

  const setApiKey = (key: string) => {
    setState((prev) => ({ ...prev, apiKey: key }));
  };

  const startStudio = () => {
    setIsLanding(false);
  };

  const setActiveMainTab = (tab: MainTab) => {
    setState((prev) => ({ ...prev, activeMainTab: tab }));
  };

  const setActiveStyleSubTab = (subTab: StyleSubTab) => {
    setState((prev) => ({ ...prev, activeStyleSubTab: subTab }));
  };

  const setAspectRatio = (ratio: AspectRatio) => {
    setState((prev) => ({ ...prev, aspectRatio: ratio, isSaved: false }));
  };

  const setLayoutTemplate = (template: LayoutTemplate) => {
    setState((prev) => ({ ...prev, layoutTemplate: template, isSaved: false }));
  };

  const setProjectTitle = (title: string) => {
    setState((prev) => ({ ...prev, projectTitle: title, isSaved: false }));
  };

  const setGuideline = (guideline: string) => {
    setState((prev) => ({
      ...prev,
      sourceInput: { ...prev.sourceInput, guideline },
      isSaved: false,
    }));
  };

  const setSourceInputType = (inputType: 'paste' | 'link') => {
    setState((prev) => ({
      ...prev,
      sourceInput: { ...prev.sourceInput, inputType },
      isSaved: false,
    }));
  };

  const setSourceText = (text: string) => {
    setState((prev) => ({
      ...prev,
      sourceInput: { ...prev.sourceInput, rawText: text },
      isSaved: false,
    }));
  };

  const setSourceUrl = (sourceUrl: string) => {
    setState((prev) => ({
      ...prev,
      sourceInput: { ...prev.sourceInput, sourceUrl },
      isSaved: false,
    }));
  };

  const setTargetCardCount = (count: number) => {
    setState((prev) => ({
      ...prev,
      sourceInput: { ...prev.sourceInput, targetCardCount: count },
      isSaved: false,
    }));
  };

  const setReferenceImage = (url: string | null) => {
    setState((prev) => ({
      ...prev,
      sourceInput: { ...prev.sourceInput, referenceImageUrl: url },
      isSaved: false,
    }));
  };

  const removeReferenceImage = () => {
    setState((prev) => ({
      ...prev,
      sourceInput: { ...prev.sourceInput, referenceImageUrl: null },
      isSaved: false,
    }));
  };

  const setCanvasZoom = (zoomOrFn: number | ((prev: number) => number)) => {
    setState((prev) => {
      const nextZoom = typeof zoomOrFn === 'function' ? zoomOrFn(prev.canvasZoom) : zoomOrFn;
      const clamped = Math.max(0.6, Math.min(2.2, Number(nextZoom.toFixed(2))));
      return { ...prev, canvasZoom: clamped };
    });
  };

  const runSourceAnalysis = async () => {
    setIsAnalyzingModalOpen(true);
    setAnalyzingStep(0);

    const stepInterval = 500;
    setTimeout(() => setAnalyzingStep(1), stepInterval);
    setTimeout(() => setAnalyzingStep(2), stepInterval * 2);
    setTimeout(() => setAnalyzingStep(3), stepInterval * 3);

    const activeApiKey =
      state.apiKey ||
      (typeof window !== 'undefined' ? localStorage.getItem('hongsiphone_gemini_api_key') || '' : '');

    try {
      const textToAnalyze =
        state.sourceInput.inputType === 'link'
          ? `[출처 링크]: ${state.sourceInput.sourceUrl}\n${state.sourceInput.rawText}`
          : state.sourceInput.rawText;

      const aiResult = await analyzeContentWithAI(
        activeApiKey,
        textToAnalyze,
        state.sourceInput.targetCardCount,
        state.sourceInput.guideline,
        state.sourceInput.referenceImageUrl
      );

      // Brief animation completion then immediately switch to card tab
      setTimeout(() => {
        setIsAnalyzingModalOpen(false);
        setState((prev) => ({
          ...prev,
          apiKey: activeApiKey || prev.apiKey,
          projectTitle: aiResult.projectTitle,
          cards: aiResult.cards,
          aiRecommendedTitles: aiResult.recommendedTitles,
          articleSummary: aiResult.articleSummary,
          exportAndTranslate: {
            ...prev.exportAndTranslate,
            captionText: aiResult.caption,
          },
          activeCardIndex: 0,
          activeMainTab: 'card',
          isSaved: false,
        }));
      }, 300);
    } catch (e) {
      console.warn('AI analysis failed, using fallback:', e);
      setIsAnalyzingModalOpen(false);
      const raw = state.sourceInput.rawText || '';
      const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const fallbackTitle = formatFallbackTitle(lines[0] || '스마트폰 카드뉴스', '핵심 내용');
      const targetCount = Math.max(1, state.sourceInput.targetCardCount || 2);

      let card1Url = '';
      let hasCard1Photo = false;
      let card1Scale = 100;
      let card1OffsetY = 0;

      if (state.sourceInput.referenceImageUrl) {
        card1Url = state.sourceInput.referenceImageUrl;
        hasCard1Photo = true;
        card1Scale = 135;
        card1OffsetY = 20;
      } else {
        const topicKeyword = lines[0]?.slice(0, 35) || 'clean background';
        card1Url = `https://image.pollinations.ai/prompt/${encodeURIComponent(topicKeyword + ' clean background photography 8k')}?width=1080&height=1350&nologo=true`;
        hasCard1Photo = true;
      }

      const fallbackCards: CardItem[] = Array.from({ length: targetCount }, (_, idx) => ({
        cardId: idx + 1,
        role: idx === 0 ? '표지' : '본문',
        titleText: idx === 0 ? fallbackTitle : formatFallbackTitle(lines[idx] || `카드 ${idx + 1} 상세 안내`, `핵심 포인트 ${idx + 1}`),
        photo: {
          hasPhoto: idx === 0 ? hasCard1Photo : false,
          url: idx === 0 ? card1Url : '',
          originalUploadUrl: (idx === 0 && state.sourceInput.referenceImageUrl) ? state.sourceInput.referenceImageUrl : '',
          promptMode: 'auto',
          styleHint: '',
          scale: idx === 0 ? card1Scale : 100,
          offsetX: 0,
          offsetY: idx === 0 ? card1OffsetY : 0,
          isGrayscale: false,
        },
        typography: {
          fontSizePx: 26,
          align: 'left',
          fontWeight: 'extra-bold',
          lineHeightPercent: 134,
          letterSpacingPercent: -2,
          baseColorHex: '#FFFFFF',
          accentColorHex: '#1CF28D',
          strokeWidthPx: 0,
        },
        gradient: {
          enabled: true,
          heightPercent: idx === 0 && state.sourceInput.referenceImageUrl ? 60 : 55,
          opacity: 0.95,
        },
      }));

      const titlesList = [
        formatFallbackTitle(lines[0] || '스마트폰 카드뉴스', '핵심 비결'),
        formatFallbackTitle(lines[1] || lines[0] || '주목할 만한 이야기', '화제의 이유'),
        formatFallbackTitle(lines[2] || lines[0] || '놓치면 아쉬운 정보', '상세 분석'),
        formatFallbackTitle(lines[3] || lines[0] || '이것만 알면 끝', '반전 결말'),
        formatFallbackTitle(lines[4] || lines[0] || '핵심 요약 정리', '최종 정리'),
      ];

      setState((prev) => ({
        ...prev,
        apiKey: activeApiKey || prev.apiKey,
        projectTitle: fallbackTitle.replace(/\[|\]|\n/g, ' ').slice(0, 20),
        cards: fallbackCards,
        activeCardIndex: 0,
        activeMainTab: 'card',
        aiRecommendedTitles: titlesList.map((t, i) => ({
          id: `rec_${i + 1}`,
          rawTitle: t,
          displayWithNewlineSymbol: t.replace('\n', '\\n'),
          score: `${(9.8 - i * 0.2).toFixed(1)}/10`,
          reason: i === 0 ? '입력된 원문의 핵심 메시지를 직접 반영' : `원문 문맥 기반 추천 제목 ${i + 1}`,
          isSelected: i === 0,
        })),
        articleSummary: raw.slice(0, 150) || '원문 내용을 바탕으로 기획된 카드뉴스입니다.',
        exportAndTranslate: {
          ...prev.exportAndTranslate,
          captionText: `${raw.slice(0, 120)}\n\n#카드뉴스 #홍시폰 #정보공유`,
        },
        isSaved: false,
      }));
    }
  };

  const selectRecommendedTitle = (id: string) => {
    setState((prev) => {
      const updatedTitles = prev.aiRecommendedTitles.map((t) => ({
        ...t,
        isSelected: t.id === id,
      }));
      const selected = updatedTitles.find((t) => t.id === id);

      const updatedCards = prev.cards.map((card, idx) => {
        if (idx === prev.activeCardIndex && selected) {
          return {
            ...card,
            titleText: selected.rawTitle,
          };
        }
        return card;
      });

      return {
        ...prev,
        aiRecommendedTitles: updatedTitles,
        cards: updatedCards,
        isSaved: false,
      };
    });
  };

  const runGenerateImage = async (cardIndex?: number) => {
    const targetIdx = cardIndex !== undefined ? cardIndex : state.activeCardIndex;
    setIsImageGeneratingModalOpen(true);
    setImageGeneratingStep(0);

    const stepInterval = 700;
    setTimeout(() => setImageGeneratingStep(1), stepInterval);
    setTimeout(() => setImageGeneratingStep(2), stepInterval * 2);

    const activeCard = state.cards[targetIdx];
    let newImageUrl = '';

    if (targetIdx === 0 && state.sourceInput.referenceImageUrl && activeCard?.photo.promptMode !== 'custom') {
      newImageUrl = state.sourceInput.referenceImageUrl;
    } else {
      const cleanTitle = activeCard?.titleText?.replace(/\[|\]|\n/g, ' ') || state.projectTitle || 'clean background';
      try {
        newImageUrl = await generateCardImageAI(cleanTitle, activeCard?.photo.styleHint || '');
      } catch (err) {
        newImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanTitle + ' aesthetic clean photography')}?width=1080&height=1350&nologo=true`;
      }
    }

    setTimeout(() => {
      setIsImageGeneratingModalOpen(false);
      setState((prev) => {
        const updatedCards = [...prev.cards];
        if (updatedCards[targetIdx]) {
          updatedCards[targetIdx] = {
            ...updatedCards[targetIdx],
            photo: {
              ...updatedCards[targetIdx].photo,
              hasPhoto: true,
              url: newImageUrl,
            },
          };
        }
        return {
          ...prev,
          cards: updatedCards,
          isSaved: false,
        };
      });
    }, stepInterval * 3);
  };

  const runGenerateAllImages = async () => {
    setIsImageGeneratingModalOpen(true);
    setImageGeneratingStep(0);

    const stepInterval = 750;
    setTimeout(() => setImageGeneratingStep(1), stepInterval);
    setTimeout(() => setImageGeneratingStep(2), stepInterval * 2);

    const updatedCards = await Promise.all(
      state.cards.map(async (card, idx) => {
        if (idx === 0 && state.sourceInput.referenceImageUrl) {
          return {
            ...card,
            photo: {
              ...card.photo,
              hasPhoto: true,
              url: state.sourceInput.referenceImageUrl,
            },
          };
        }
        const cleanTitle = card.titleText?.replace(/\[|\]|\n/g, ' ') || `카드 ${idx + 1} 배경`;
        try {
          const generatedUrl = await generateCardImageAI(cleanTitle, card.photo.styleHint || '');
          return {
            ...card,
            photo: {
              ...card.photo,
              hasPhoto: true,
              url: generatedUrl,
            },
          };
        } catch {
          return {
            ...card,
            photo: {
              ...card.photo,
              hasPhoto: true,
              url: `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanTitle + ' clean aesthetic background')}?width=1080&height=1350&nologo=true&seed=${idx + 10}`,
            },
          };
        }
      })
    );

    setTimeout(() => {
      setIsImageGeneratingModalOpen(false);
      setState((prev) => ({
        ...prev,
        cards: updatedCards,
        isSaved: false,
      }));
    }, stepInterval * 3);
  };

  const setActiveCardIndex = (index: number) => {
    if (index >= 0 && index < state.cards.length) {
      setState((prev) => ({ ...prev, activeCardIndex: index }));
    }
  };

  const addCard = () => {
    setState((prev) => {
      const nextId = prev.cards.length + 1;
      const newCard: CardItem = {
        cardId: nextId,
        role: '본문',
        titleText: `새로운 카드 문구\n[중요한 강조 내용]`,
        photo: {
          hasPhoto: false,
          url: '',
          promptMode: 'auto',
          styleHint: '',
          scale: 100,
          offsetX: 0,
          offsetY: 0,
          isGrayscale: false,
        },
        typography: {
          fontSizePx: 26,
          align: 'left',
          fontWeight: 'extra-bold',
          lineHeightPercent: 134,
          letterSpacingPercent: -2,
          baseColorHex: '#FFFFFF',
          accentColorHex: '#1CF28D',
          strokeWidthPx: 0,
        },
        gradient: {
          enabled: true,
          heightPercent: 55,
          opacity: 0.9,
        },
      };
      return {
        ...prev,
        cards: [...prev.cards, newCard],
        activeCardIndex: prev.cards.length,
        isSaved: false,
      };
    });
  };

  const duplicateCard = (index: number) => {
    setState((prev) => {
      const target = prev.cards[index];
      if (!target) return prev;
      const clone: CardItem = {
        ...target,
        cardId: prev.cards.length + 1,
        titleText: `${target.titleText} (복사본)`,
      };
      const updated = [...prev.cards];
      updated.splice(index + 1, 0, clone);
      return {
        ...prev,
        cards: updated,
        activeCardIndex: index + 1,
        isSaved: false,
      };
    });
  };

  const removeCard = (index: number) => {
    setState((prev) => {
      if (prev.cards.length <= 1) {
        alert('카드는 최소 1장 이상 있어야 합니다.');
        return prev;
      }
      const updated = prev.cards.filter((_, idx) => idx !== index);
      const nextIdx = Math.max(0, Math.min(index, updated.length - 1));
      return {
        ...prev,
        cards: updated,
        activeCardIndex: nextIdx,
        isSaved: false,
      };
    });
  };

  const moveCardForward = (index: number) => {
    if (index <= 0) return;
    setState((prev) => {
      const updated = [...prev.cards];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return {
        ...prev,
        cards: updated,
        activeCardIndex: index - 1,
        isSaved: false,
      };
    });
  };

  const moveCardBackward = (index: number) => {
    if (index >= state.cards.length - 1) return;
    setState((prev) => {
      const updated = [...prev.cards];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return {
        ...prev,
        cards: updated,
        activeCardIndex: index + 1,
        isSaved: false,
      };
    });
  };

  const updateCardTitle = (title: string) => {
    setState((prev) => {
      const updated = [...prev.cards];
      if (updated[prev.activeCardIndex]) {
        updated[prev.activeCardIndex] = {
          ...updated[prev.activeCardIndex],
          titleText: title,
        };
      }
      return { ...prev, cards: updated, isSaved: false };
    });
  };

  const updateCardTypography = (patch: Partial<CardTypography>) => {
    setState((prev) => {
      const updated = [...prev.cards];
      const active = updated[prev.activeCardIndex];
      if (active) {
        updated[prev.activeCardIndex] = {
          ...active,
          typography: {
            ...active.typography,
            ...patch,
          },
        };
      }
      return { ...prev, cards: updated, isSaved: false };
    });
  };

  const updateCardPhoto = (patch: Partial<CardPhoto>) => {
    setState((prev) => {
      const updated = [...prev.cards];
      const active = updated[prev.activeCardIndex];
      if (active) {
        updated[prev.activeCardIndex] = {
          ...active,
          photo: {
            ...active.photo,
            ...patch,
          },
        };
      }
      return { ...prev, cards: updated, isSaved: false };
    });
  };

  const updateCardGradient = (patch: Partial<CardGradient>) => {
    setState((prev) => {
      const updated = [...prev.cards];
      const active = updated[prev.activeCardIndex];
      if (active) {
        updated[prev.activeCardIndex] = {
          ...active,
          gradient: {
            ...active.gradient,
            ...patch,
          },
        };
      }
      return { ...prev, cards: updated, isSaved: false };
    });
  };

  const removeCardPhoto = (index: number) => {
    setState((prev) => {
      const updated = [...prev.cards];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          photo: {
            ...updated[index].photo,
            hasPhoto: false,
            url: '',
          },
        };
      }
      return { ...prev, cards: updated, isSaved: false };
    });
  };

  const saveProject = () => {
    setState((prev) => ({ ...prev, isSaved: true }));
  };

  const toggleCropMode = () => {
    setIsCropMode((prev) => !prev);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      if (typeof document !== 'undefined') {
        const meta = document.getElementById('theme-color-meta') || document.querySelector('meta[name="theme-color"]');
        if (meta) {
          meta.setAttribute('content', next ? '#0F172A' : '#FFFFFF');
        }
      }
      return next;
    });
  };

  const openColorPicker = (target: 'base' | 'accent') => {
    setColorPickerTarget(target);
    setIsColorPickerOpen(true);
  };

  const closeColorPicker = () => {
    setIsColorPickerOpen(false);
  };

  const setColorPickerColor = (hex: string) => {
    if (colorPickerTarget === 'accent') {
      updateCardTypography({ accentColorHex: hex });
    } else {
      updateCardTypography({ baseColorHex: hex });
    }
  };

  const translateLanguage = (lang: string) => {
    setState((prev) => {
      const isJapanese = lang === '日本語';
      const updatedCards = prev.cards.map((c, idx) => {
        if (idx === 0) {
          return {
            ...c,
            titleText: isJapanese
              ? '登録者220万の配信者\n[放送中断に追い込んだ病気]'
              : '2.2M Streamer\n[The Disease That Stopped Broadcasts]',
          };
        }
        return {
          ...c,
          titleText: isJapanese
            ? '一日中座りっぱなしなら\n[お尻の筋肉が眠る]'
            : 'Sitting All Day?\n[Your Glutes Are Falling Asleep]',
        };
      });

      return {
        ...prev,
        exportAndTranslate: {
          ...prev.exportAndTranslate,
          targetLanguage: lang,
          captionText: isJapanese
            ? '登録者220万人のゲーム実況者が突如放送休止を発表した衝撃의 理由をご存知ですか？\n\n原因は現代人の持病とも言われる「大臀筋健忘症」です。'
            : 'Do you know why a 2.2M gaming streamer suddenly halted their streams?\n\nThe cause is the modern illness known as gluteal amnesia.',
        },
        cards: updatedCards,
        isSaved: false,
      };
    });
  };

  const generateCaption = () => {
    setState((prev) => ({
      ...prev,
      exportAndTranslate: {
        ...prev.exportAndTranslate,
        captionText: DEFAULT_CAPTION,
      },
      isSaved: false,
    }));
  };

  const exportZip = async () => {
    await exportCardsAsZip(
      state.cards,
      state.aspectRatio,
      state.exportAndTranslate.captionText,
      state.projectTitle
    );
  };

  const loadSampleProject = () => {
    setState((prev) => ({
      ...prev,
      sourceInput: {
        ...prev.sourceInput,
        rawText: DEFAULT_SOURCE_TEXT,
        guideline: '제목에 숫자를 넣어주세요 / 반말로 친근하게 / 인용문은 그대로 유지',
        sourceUrl: 'https://www.yna.co.kr/view/AKR202412010285?',
      },
      aiRecommendedTitles: DEFAULT_RECOMMENDED_TITLES,
      articleSummary: DEFAULT_SUMMARY,
      cards: generateInitialCards(2),
      exportAndTranslate: {
        ...prev.exportAndTranslate,
        captionText: DEFAULT_CAPTION,
      },
      isSaved: false,
    }));
  };

  const clearAllContent = () => {
    setState((prev) => ({
      ...prev,
      projectTitle: '새 카드뉴스',
      sourceInput: {
        ...prev.sourceInput,
        rawText: '',
        sourceUrl: '',
        referenceImageUrl: null,
      },
      aiRecommendedTitles: [],
      articleSummary: '',
      cards: generateBlankCards(2),
      activeCardIndex: 0,
      exportAndTranslate: {
        ...prev.exportAndTranslate,
        captionText: '',
      },
      isSaved: false,
    }));
  };

  return (
    <HongsiPhoneContext.Provider
      value={{
        isAuthenticated,
        authenticate,
        logout,
        state,
        isLanding,
        isAnalyzingModalOpen,
        analyzingStep,
        isImageGeneratingModalOpen,
        imageGeneratingStep,
        isColorPickerOpen,
        colorPickerTarget,
        isCropMode,
        isDarkMode,
        setApiKey,
        startStudio,
        setActiveMainTab,
        setActiveStyleSubTab,
        setAspectRatio,
        setLayoutTemplate,
        setProjectTitle,
        setGuideline,
        setSourceInputType,
        setSourceText,
        setSourceUrl,
        setTargetCardCount,
        setReferenceImage,
        removeReferenceImage,
        setCanvasZoom,
        runSourceAnalysis,
        selectRecommendedTitle,
        runGenerateImage,
        runGenerateAllImages,
        setActiveCardIndex,
        addCard,
        duplicateCard,
        removeCard,
        moveCardForward,
        moveCardBackward,
        updateCardTitle,
        updateCardTypography,
        updateCardPhoto,
        updateCardGradient,
        removeCardPhoto,
        saveProject,
        toggleCropMode,
        toggleDarkMode,
        openColorPicker,
        closeColorPicker,
        setColorPickerColor,
        translateLanguage,
        generateCaption,
        exportZip,
        loadSampleProject,
        clearAllContent,
      }}
    >
      {children}
    </HongsiPhoneContext.Provider>
  );
};

export const useHongsiPhone = () => {
  const context = useContext(HongsiPhoneContext);
  if (!context) {
    throw new Error('useHongsiPhone must be used within a HongsiPhoneProvider');
  }
  return context;
};
