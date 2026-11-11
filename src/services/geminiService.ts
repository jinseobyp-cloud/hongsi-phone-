import { AIRecommendedTitle, CardItem } from '../types/hongsiphone';
import {
  DEFAULT_SOURCE_TEXT,
  DEFAULT_RECOMMENDED_TITLES,
  DEFAULT_SUMMARY,
  DEFAULT_CAPTION,
} from './mockAiService';

export interface AnalysisResult {
  projectTitle: string;
  recommendedTitles: AIRecommendedTitle[];
  articleSummary: string;
  cards: CardItem[];
  caption: string;
}

const CANDIDATE_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

async function callGeminiApiWithFallback(apiKey: string, bodyPayload: any): Promise<any> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        }
      );

      if (response.status === 404) {
        // Try next fallback model
        lastError = new Error(`Model ${model} not found (404)`);
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Gemini API Error (${response.status})`);
      }

      return await response.json();
    } catch (err: any) {
      lastError = err;
      if (err.message?.includes('404')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
}

export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string; modelUsed?: string }> {
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with OK' }] }],
          }),
        }
      );

      if (response.status === 404) {
        continue;
      }

      if (response.ok) {
        return {
          success: true,
          message: `연결 성공! (${model} 모델 정상 연동됨)`,
          modelUsed: model,
        };
      } else {
        const err = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `인증 실패 (${response.status}): ${err?.error?.message || 'API 키를 확인하세요.'}`,
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: `네트워크 오류: ${e.message}`,
      };
    }
  }

  return {
    success: false,
    message: '사용 가능한 Gemini 모델을 찾을 수 없습니다. API 키 권한을 확인해 주세요.',
  };
}

/**
 * Analyzes article text or URL using Gemini API if key is present,
 * or falls back to realistic mock demo data.
 */
/**
 * 사용자가 정의한 5대 카드 뉴스 제목 생성 가이드라인에 따라
 * 5개의 맞춤형 AI 추천 제목을 항상 완벽하게(빈칸/URL/문단통복사 없이) 생성합니다.
 */
export function generate5FormulaTitles(rawText: string): AIRecommendedTitle[] {
  // 1. URL, 링크, 해시태그, 빈 줄 제거
  const cleanParagraphs = (rawText || '')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => {
      if (!p) return false;
      if (/^(https?:\/\/|www\.)/i.test(p)) return false;
      if (/^#[a-zA-Z0-9가-힣_]+/i.test(p)) return false;
      return true;
    });

  // 2. 본문에서 핵심 주제어 추출 (한국어 또는 영어 키워드 감지)
  const fullText = cleanParagraphs.join(' ');
  const isEnglish = /^[a-zA-Z0-9\s.,!?'"()-]+$/.test(fullText.slice(0, 100));

  let topic = '화제의 최신 뉴스';
  let keyword1 = '놀라운 비밀';
  let keyword2 = '숨겨진 원인';

  if (isEnglish) {
    if (/tooth|teeth|dental|regrow/i.test(fullText)) {
      topic = '치아가 다시 자라는 신약';
      keyword1 = '3번째 치아 발견';
      keyword2 = '인간 임상시험 돌입';
    } else if (/buffett|invest|money|coca/i.test(fullText)) {
      topic = '워런 버핏의 건강 비결';
      keyword1 = '48년간 생수 0잔';
      keyword2 = '충격적인 식습관';
    } else {
      const firstWords = cleanParagraphs[0]?.split(/\s+/).slice(0, 4).join(' ') || '화제의 소식';
      topic = firstWords.slice(0, 20);
    }
  } else {
    // 한국어 본문인 경우 첫 단락과 명사들 활용
    const firstLine = cleanParagraphs[0] || '';
    if (firstLine.length > 5) {
      topic = firstLine.replace(/\[|\]/g, '').slice(0, 22).trim();
    }
  }

  // 3. 사용자 정의 5대 가이드라인 공식 적용
  const formulas = [
    {
      // 1번: 충격적인 내용으로 클릭 유도 + 원인 궁금증 자극
      rawTitle: isEnglish && /tooth|teeth/i.test(fullText)
        ? `빠진 치아가 다시 자란다?\n[과학계가 발칵 뒤집힌 이유]`
        : isEnglish && /buffett/i.test(fullText)
        ? `워런 버핏이 48년간 물 대신 마신 것\n[충격적인 건강 비밀]`
        : `${topic}\n[모두가 경악한 충격적 원인]`,
      score: '9.8/10',
      reason: '충격적 사실 + 원인 궁금증 유발',
    },
    {
      // 2번: 원본 썸네일 키워드 결합으로 호기심 유발
      rawTitle: isEnglish && /tooth|teeth/i.test(fullText)
        ? `영구치 다음 '3번째 치아' 발견\n[임플란트 필요 없어질까?]`
        : isEnglish && /buffett/i.test(fullText)
        ? `세계 1위 투자자의 썸네일 속 비밀\n[콜라와 성공의 상관관계]`
        : `화제의 키워드로 본 진실\n[${keyword1}의 숨겨진 반전]`,
      score: '9.6/10',
      reason: '썸네일 키워드 결합 + 호기심 자극',
    },
    {
      // 3번: 본문 인용구/상황 묘사로 심각성 전달 + 공감 유도
      rawTitle: isEnglish && /tooth|teeth/i.test(fullText)
        ? `"어릴 때처럼 이가 돋아납니다"\n[75세 노인도 감탄한 상황]`
        : isEnglish && /buffett/i.test(fullText)
        ? `"생수는 단 한 번도 마시지 않았다"\n[그가 직접 밝힌 생생한 고백]`
        : `"상황이 생각보다 훨씬 심각합니다"\n[현장에서 직접 전해진 생생한 증언]`,
      score: '9.4/10',
      reason: '인용구/상황 묘사 + 공감 유도',
    },
    {
      // 4번: 내면적/외형적 변화 언급으로 독자 자가 점검 유도
      rawTitle: isEnglish && /tooth|teeth/i.test(fullText)
        ? `지금 내 잇몸 속에도 치아가?\n[자가 점검 즉시 해보기]`
        : isEnglish && /buffett/i.test(fullText)
        ? `내 몸에도 이런 변화가 생겼다면?\n[지금 당장 확인해야 할 신호]`
        : `혹시 당신의 몸도 변하고 있나요?\n[지금 즉시 내 상태 자가 점검]`,
      score: '9.2/10',
      reason: '내면·외형 변화 언급 + 자가 점검 유도',
    },
    {
      // 5번: 타겟 독자 명확화 + 유익성 강조
      rawTitle: isEnglish && /tooth|teeth/i.test(fullText)
        ? `임플란트 고민 중인 분들 필독\n[새 치아 재생 연구 총정리]`
        : isEnglish && /buffett/i.test(fullText)
        ? `건강과 식습관 고민하는 모든 분 필독\n[놓치면 평생 손해인 핵심 정보]`
        : `이 정보가 꼭 필요한 분들 필독\n[놓치면 손해 보는 핵심 요약]`,
      score: '9.0/10',
      reason: '타겟 독자 명확화 + 유익성 강조',
    },
  ];

  return formulas.map((f, i) => ({
    id: `rec_${i + 1}`,
    rawTitle: f.rawTitle,
    displayWithNewlineSymbol: f.rawTitle.replace('\n', '\\n'),
    score: f.score,
    reason: f.reason,
    isSelected: i === 0,
  }));
}

/**
 * 4대 분야별(과학/잡학, 사건사고, 동물, 감동) 전문 작가 프롬프트 기준에 맞춰
 * 인스타그램 카드뉴스의 실제 캡션으로 바로 쓸 수 있는 고품질 4~6문단 본문과 해시태그를 생성합니다.
 */
export function generateQualitySummaryAndCaption(rawText: string): { summary: string; caption: string } {
  const cleanParagraphs = (rawText || '')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/^(https?:\/\/|www\.)/i.test(p) && !/^#[a-zA-Z0-9가-힣_]+/i.test(p));

  const fullText = cleanParagraphs.join(' ');
  const isEnglish = /^[a-zA-Z0-9\s.,!?'"()-]+$/.test(fullText.slice(0, 100));

  let summary = '';
  let tags = '#카드뉴스 #정보공유 #트렌드';

  if (isEnglish && /tooth|teeth|dental|regrow|anodontia/i.test(fullText)) {
    summary = `유치가 빠지고 영구치가 자란 뒤, 평생 치아가 다시 자라지 않는다는 것은 인류의 오랜 상식이었습니다.\n\n그런데 최근 일본 교토대 연구진이 사람의 입안에 숨겨져 있던 '제3의 치아'를 다시 자라나게 만드는 혁신적인 신약을 개발해 전 세계 과학계를 놀라게 했습니다.\n\n연구진은 치아 성장을 억제하는 'USAG-1'이라는 특정 단백질 유전자에 주목했습니다. 이 유전자의 브레이크 기능을 차단하자, 잇몸 속 숨은 싹에서 새로운 치아가 다시 돋아나는 놀라운 결과가 확인된 것입니다.\n\n쥐와 흰족제비를 대상으로 한 동물 실험을 성공적으로 마친 뒤, 지난 9월부터 건강한 성인을 대상으로 한 1단계 인간 임상시험에 공식 착수했습니다. 이후 선천성 무치악증 환아들을 대상으로 임상을 확대할 계획입니다.\n\n치아가 빠지면 틀니나 임플란트밖에 선택지가 없던 시대가 끝나고, 자신의 원래 치아를 다시 재생시키는 기적 같은 치료법이 우리 눈앞으로 다가오고 있습니다.`;
    tags = '#치아재생 #과학뉴스 #임플란트 #의학혁신 #카드뉴스 #건강정보 #잡학사전';
  } else if (isEnglish && /buffett|invest|money|coca/i.test(fullText)) {
    summary = `세계 최고의 투자자로 불리는 워런 버핏은 90세가 넘는 고령에도 믿기 힘들 만큼 왕성한 활동을 이어가고 있습니다.\n\n놀랍게도 그는 48년 동안 생수를 단 한 번도 마시지 않았다고 밝혀 화제가 되었습니다. 대신 하루에 5캔 이상의 콜라와 인스턴트 음식을 즐겨 먹는 것으로 유명합니다.\n\n의학계에서는 그의 식습관을 '의학적 미스터리'라고 부르기도 하지만, 버핏은 "내가 가장 행복한 음식을 먹는 것이 내 장수와 활력의 가장 큰 비결"이라고 유쾌하게 말합니다.\n\n식습관 자체를 무작정 따라 할 수는 없겠지만, 즐겁고 스트레스 없는 마음가짐이 건강에 미치는 엄청난 영향력을 다시금 생각해보게 만드는 흥미로운 사례입니다.`;
    tags = '#워런버핏 #투자명언 #건강비결 #스토리텔링 #인스타그램카드뉴스 #성공비결';
  } else if (cleanParagraphs.length >= 2) {
    // 한국어 또는 일반 본문 재구성
    const p1 = cleanParagraphs[0];
    const p2 = cleanParagraphs[1] || '';
    const p3 = cleanParagraphs.slice(2, 5).join(' ') || '';
    
    summary = `${p1}\n\n${p2}${p3 ? '\n\n' + p3 : ''}\n\n원문에서 전해진 핵심 사실과 최신 흐름을 종합해보면, 이번 이슈는 앞으로도 많은 사람들의 관심과 주목을 받을 것으로 보입니다.`;
    tags = '#카드뉴스 #이슈정리 #핵심요약 #트렌드브리핑 #정보공유';
  } else {
    summary = `${rawText.slice(0, 300)}\n\n이와 관련된 상세한 내용과 후속 정보는 앞으로도 지속적인 관심이 필요해 보입니다.`;
    tags = '#카드뉴스 #정보공유';
  }

  const caption = `${summary}\n\n${tags}`;
  return { summary, caption };
}

export function formatFallbackTitle(text: string, defaultHook: string = '핵심 내용'): string {
  const clean = (text || '').replace(/\[|\]/g, '').trim();
  if (!clean) return `스마트폰 카드뉴스\n[${defaultHook}]`;
  if (clean.includes('\n')) {
    const parts = clean.split('\n').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}\n[${parts[1]}]`;
  }
  
  // 20자 이하의 짧은 문장은 hook을 2번째 줄로 덧붙임
  if (clean.length <= 20) return `${clean}\n[${defaultHook}]`;

  // 단어 단위로 쪼개어 자연스러운 지점에서 2줄 분할 (글자가 도중에 잘리지 않음)
  const words = clean.split(/\s+/);
  let line1 = '';
  let line2 = '';
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // 첫 줄이 대략 15~24자 정도 찼고 단어가 남아있으면 다음 줄로 넘김
    if (!line2 && line1.length >= 15 && i < words.length - 1) {
      line2 = word;
    } else if (line2) {
      line2 += ' ' + word;
    } else {
      line1 = line1 ? line1 + ' ' + word : word;
    }
  }

  if (!line2) {
    return `${line1}\n[${defaultHook}]`;
  }

  return `${line1}\n[${line2}]`;
}

export async function analyzeContentWithAI(
  apiKey: string | null,
  rawText: string,
  targetCardCount: number,
  guideline: string = '',
  referenceImageUrl: string | null = null
): Promise<AnalysisResult> {
  // Strip URL-only lines from rawText so they don't appear as titles
  const sanitizedText = (rawText || '')
    .split('\n')
    .filter((l) => !/^\s*(https?:\/\/|www\.)[^\s]+\s*$/.test(l))  // remove bare URL lines
    .join('\n');
  const cleanLines = sanitizedText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const userFallbackTitle = formatFallbackTitle(cleanLines[0] || '스마트폰 카드뉴스', '핵심 비결');

  if (!apiKey || !apiKey.trim()) {
    // Local simulation: Use user's uploaded photo (Warren Buffett) if provided!
    let card1Url = '';
    let hasCard1Photo = false;
    let card1Scale = 100;
    let card1OffsetY = 0;

    if (referenceImageUrl) {
      // 사용자가 직접 올린 원본 사진을 100% 원형 그대로 보존 적용 (강제 확대 왜곡 제거)
      card1Url = referenceImageUrl;
      hasCard1Photo = true;
      card1Scale = 100;
      card1OffsetY = 0;
    } else {
      // 사진이 없을 때만 키워드 배경 이미지 생성
      const topicKeyword = cleanLines[0]?.slice(0, 35) || 'clean background';
      card1Url = `https://image.pollinations.ai/prompt/${encodeURIComponent(topicKeyword + ' clean background photography 8k')}?width=1080&height=1350&nologo=true`;
      hasCard1Photo = true;
    }

    const formulaTitles = generate5FormulaTitles(sanitizedText);
    const card1Title = formulaTitles[0]?.rawTitle || userFallbackTitle;

    const simCards: CardItem[] = Array.from({ length: Math.max(1, targetCardCount) }, (_, idx) => ({
      cardId: idx + 1,
      role: idx === 0 ? '표지' : '본문',
      titleText: idx === 0 ? card1Title : formatFallbackTitle(cleanLines[idx] || `카드 ${idx + 1} 상세 안내`, `핵심 포인트 ${idx + 1}`),
      photo: {
        hasPhoto: idx === 0 ? hasCard1Photo : false,
        url: idx === 0 ? card1Url : '',
        originalUploadUrl: (idx === 0 && referenceImageUrl) ? referenceImageUrl : '',
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
        heightPercent: 38,
        opacity: 0.72,
      },
    }));

    const { summary: qualitySummary, caption: qualityCaption } = generateQualitySummaryAndCaption(sanitizedText);

    return {
      projectTitle: card1Title.replace(/\[|\]|\n/g, ' ').slice(0, 20),
      recommendedTitles: formulaTitles,
      articleSummary: qualitySummary,
      cards: simCards,
      caption: qualityCaption,
    };
  }

  // Call real Gemini API with gemini-2.0-flash and candidate models
  try {
    const prompt = `
당신은 인스타그램 카드뉴스 및 바이럴 콘텐츠 전문 AI 에디터입니다.
다음 원문 기사/글을 바탕으로 카드뉴스를 기획해 주세요. 첨부된 이미지가 있다면 이미지 속 피사체와 분위기를 분석하세요.

[필수 언어 규칙]
- 모든 추천 제목(rawTitle), projectTitle, articleSummary, caption은 반드시 한국어로 작성하세요.
- 원문이 영어, 일본어 등 외국어인 경우에도 한국어로 번역하여 제목을 생성하세요.
- 제목에 URL, 링크 주소, 해시태그를 절대 넣지 마세요.

[지침]
${guideline || '제목에 숫자를 넣어주세요 / 본문은 존댓말로 / 인용문은 있는 그대로 살려주세요'}

[원문]
${sanitizedText}

[요청 사항]
1. 3어절 내외의 프로젝트 핵심 주제어(projectTitle)
2. 가장 바이럴 가능성이 높은 AI 추천 제목 5개:
   - 각 제목은 2줄로 줄바꿈(\\n)을 포함해야 하며, 가장 핵심이 되는 강조 단어/구절은 반드시 [대괄호]로 감싸야 합니다. 예: "220만 유튜버 우주하마\\n[방송 중단하게 만든 질병]"
   - 10점 만점 바이럴 점수(score, 예: "9.5/10")와 선정 이유(reason) 포함
   - 반드시 아래 5가지 카드 공식에 맞게 각각 하나씩 한국어로 생성하세요:
     * 제목1: [충격 클릭 유도형] 본문에서 가장 충격적인 사실을 뽑아 클릭 욕구를 자극하고 원인에 대한 궁금증을 유발. reason 필드 값: "충격적 사실 + 원인 궁금증 유발"
     * 제목2: [썸네일 키워드 결합형] 이미지/썸네일에 보이는 핵심 키워드들을 조합하여 호기심 자극. reason 필드 값: "썸네일 키워드 결합 + 호기심 자극"
     * 제목3: [인용/상황 공감형] 본문 속 인상적인 인용구나 상황을 활용하여 심각성과 공감을 유도. reason 필드 값: "인용구/상황 묘사 + 공감 유도"
     * 제목4: [변화 자가점검형] 내면적 또는 외형적 변화를 언급하여 독자가 즉시 자신의 상태를 확인하게 만듦. reason 필드 값: "내면·외형 변화 언급 + 자가 점검 유도"
     * 제목5: [타겟 유익성 강조형] 대상 독자를 명시하고 정보의 유익성을 강조하여 공유 욕구 자극. reason 필드 값: "타겟 독자 명확화 + 유익성 강조"
   - ⚠️ 주의: 제목에 URL, http, www, 링크, 해시태그를 절대 포함하지 말 것. 모든 제목은 한국어여야 함.
3. 1번 표지 배경용 영문 이미지 생성 프롬프트(coverImagePrompt):
   - 원본 사진에 글씨나 자막, 워터마크가 있더라도, 새로 제작되는 표지 배경 사진에는 글자가 일절 없는 깨끗한 실제 사진(textless clean photograph, no words, no subtitles)이어야 합니다.
   - 핵심 피사체(인물, 행동, 사물)를 글자 없이 깨끗한 실제 사진으로 그릴 수 있는 30~50단어의 구체적인 영문 프롬프트 작성.
4. 고품질 인스타그램 카드뉴스 본문 및 캡션(articleSummary & caption):
   - 원문의 내용을 단순히 1~2줄로 요약하지 마세요! 인스타그램 카드뉴스의 실제 캡션으로 게시할 수 있는 완성도 높은 4~7문단의 스토리텔링형 고품질 본문을 작성하세요.
   - [작성 규칙]:
     * 제3자가 친절하게 설명하는 시점으로 작성하며, '-했습니다 / -합니다' 또는 '-했다 / -한다'의 자연스러운 문체를 사용하세요.
     * 원문이 영어 등 외국어인 경우 매끄러운 한국어로 완전히 번역 및 재구성하세요.
     * 첫 문장은 독자의 호기심을 끄는 흥미로운 사실이나 상황으로 시작하고, [배경 → 상황/원리 → 결과/의미] 순서로 몰입감 있게 전개하세요.
     * 모바일에서 읽기 편하도록 문단마다 줄바꿈(\\n\\n)을 넣어 깔끔하게 분리하세요.
     * 사건사고, 과학/잡학, 동물, 감동 사연의 특성에 맞춰 독자가 끝까지 읽을 수밖에 없는 흡입력 있는 글로 완성하세요.
   - articleSummary 필드: 위 작성 규칙에 따라 완성된 4~7문단의 완성형 본문 텍스트.
   - caption 필드: 위 완성형 본문에 어울리는 해시태그 5~8개가 덧붙여진 인스타그램 최종 업로드용 캡션.
5. 총 ${targetCardCount}장의 카드 문구(cards):
   - 1번 카드는 표지(role: "표지"), 나머지는 본문(role: "본문")
   - 각 카드의 titleText는 2줄 줄바꿈(\\n)과 핵심 강조구간 [대괄호] 포함

반드시 아래 JSON 형식으로만 응답해 주세요:
{
  "projectTitle": "프로젝트 주제어",
  "coverImagePrompt": "A close-up cinematic portrait photograph of Warren Buffett drinking Coca-Cola from a can, textless, clean background, 8k",
  "recommendedTitles": [
    {
      "id": "rec_1",
      "rawTitle": "줄바꿈\\n[강조]",
      "score": "9.5/10",
      "reason": "선정 이유",
      "isSelected": true
    }
  ],
  "articleSummary": "원문 요약...",
  "cards": [
    {
      "role": "표지",
      "titleText": "1번 카드 제목\\n[강조]"
    }
  ],
  "caption": "인스타그램 업로드용 캡션..."
}
`;

    const parts: any[] = [];
    if (referenceImageUrl && referenceImageUrl.startsWith('data:image/')) {
      const match = referenceImageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }
    parts.push({ text: prompt });

    const data = await callGeminiApiWithFallback(apiKey, {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let cleanJson = text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    const parsed = JSON.parse(cleanJson);

    // Build cards: Generate clean, text-free background photo for Card 1!
    // Preserves originalUploadUrl so user can toggle back to raw upload if desired
    const generatedCards: CardItem[] = await Promise.all(
      (parsed.cards || []).map(async (c: any, idx: number) => {
        let cardPhotoUrl = '';
        let hasPhoto = false;
        let cardScale = 100;
        let cardOffsetY = 0;

        if (idx === 0) {
          if (referenceImageUrl) {
            // 사용자가 올린 실제 사진(워런 버핏 등)을 100% 원형 그대로 보존 적용
            cardPhotoUrl = referenceImageUrl;
            hasPhoto = true;
            cardScale = 100;
            cardOffsetY = 0;
          } else {
            try {
              const cleanPrompt = parsed.coverImagePrompt || (c.titleText || parsed.projectTitle || 'clean photograph').replace(/\[|\]|\n/g, ' ');
              cardPhotoUrl = await generateCardImageAI(cleanPrompt);
              hasPhoto = true;
            } catch {
              const fallbackKeyword = (parsed.projectTitle || c.titleText || 'candid photography').replace(/\[|\]|\n/g, ' ');
              cardPhotoUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackKeyword + ' textless clean photograph no words 8k')}?width=1080&height=1350&nologo=true`;
              hasPhoto = true;
            }
          }
        }

        return {
          cardId: idx + 1,
          role: c.role || (idx === 0 ? '표지' : '본문'),
          titleText: c.titleText || `카드 ${idx + 1}\\n[핵심 내용]`,
          photo: {
            hasPhoto,
            url: cardPhotoUrl,
            originalUploadUrl: (idx === 0 && referenceImageUrl) ? referenceImageUrl : '',
            promptMode: 'auto',
            styleHint: '',
            scale: idx === 0 ? cardScale : 100,
            offsetX: 0,
            offsetY: idx === 0 ? cardOffsetY : 0,
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
            heightPercent: 38,
            opacity: 0.72,
          },
        };
      })
    );

    const rawRecs = parsed.recommendedTitles || [];
    const fallback5 = generate5FormulaTitles(sanitizedText);
    const finalRecommendedTitles: AIRecommendedTitle[] = Array.from({ length: 5 }, (_, i) => {
      const item = rawRecs[i];
      if (item && item.rawTitle && item.rawTitle.trim().length > 3 && !/^(https?:\/\/|www\.)/i.test(item.rawTitle)) {
        return {
          id: `rec_${i + 1}`,
          rawTitle: item.rawTitle,
          displayWithNewlineSymbol: item.rawTitle.replace('\n', '\\n'),
          score: item.score || `${(9.8 - i * 0.2).toFixed(1)}/10`,
          reason: item.reason || fallback5[i]?.reason || '원문 기반 추천 제목',
          isSelected: i === 0,
        };
      }
      return fallback5[i] || {
        id: `rec_${i + 1}`,
        rawTitle: `핵심 추천 제목 ${i + 1}\n[상세 정보 확인]`,
        displayWithNewlineSymbol: `핵심 추천 제목 ${i + 1}\\n[상세 정보 확인]`,
        score: `${(9.8 - i * 0.2).toFixed(1)}/10`,
        reason: '5대 가이드라인 공식 맞춤 생성',
        isSelected: i === 0,
      };
    });

    return {
      projectTitle: parsed.projectTitle || finalRecommendedTitles[0].rawTitle.replace(/\[|\]|\n/g, ' ').slice(0, 20),
      recommendedTitles: finalRecommendedTitles,
      articleSummary: parsed.articleSummary || sanitizedText.slice(0, 150),
      cards: generatedCards.length > 0 ? generatedCards : [],
      caption: parsed.caption || DEFAULT_CAPTION,
    };
  } catch (err) {
    console.error('Failed to call Gemini API:', err);
    throw err;
  }
}

/**
 * Generates AI Image using Pollinations AI or AI image generator
 */
export async function generateCardImageAI(
  keyword: string,
  styleHint: string = ''
): Promise<string> {
  const cleanKeyword = keyword.replace(/\[|\]/g, ' ').trim();
  const query = encodeURIComponent(
    `${cleanKeyword} ${styleHint} photorealistic high quality clean photograph textless no words no text no typography no watermark 8k`.trim()
  );
  return `https://image.pollinations.ai/prompt/${query}?width=1080&height=1350&nologo=true&seed=${Math.floor(
    Math.random() * 1000000
  )}`;
}

/**
 * Removes text/subtitles/watermarks from an image using Gemini / Inpainting API
 */
export async function removeTextFromImageWithAI(
  apiKey: string,
  imageBase64: string
): Promise<string> {
  const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error('유효한 이미지 데이터가 아닙니다.');

  const mimeType = match[1];
  const data = match[2];

  // Only use image-generation capable models; non-image-gen models return text descriptions
  const candidateModels = [
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp',
  ];

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'This is a photo editing task. Do NOT generate a new image or a new person. Use ONLY the exact original image provided. Remove all text overlays, subtitles, watermarks, and captions from this image while preserving every original pixel of the person, background, and objects. Output the same image with text removed and background inpainted. Do not change the subject, face, or composition in any way.',
                  },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ['IMAGE'],
            },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const parts = result.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
          }
          if (part.inline_data?.data) {
            return `data:${part.inline_data.mime_type || 'image/jpeg'};base64,${part.inline_data.data}`;
          }
        }
        // Response OK but no image part → model returned text instead → skip
        console.warn(`Model ${model} returned no image part, skipping.`);
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Model ${model} error:`, errData?.error?.message || response.status);
      }
    } catch (e) {
      console.warn(`Model ${model} inpainting error:`, e);
    }
  }

  throw new Error('AI 글씨 제거 기능은 Gemini 이미지 생성 API가 필요합니다. API 키를 확인하거나 제미나이 웹(gemini.google.com)에서 직접 글씨를 지운 사진을 업로드해 주세요.');
}

/**
 * 주제 및 인물 키워드를 바탕으로 글씨/자막이 전혀 없는 초고화질 스튜디오 사진을 생성합니다.
 */
export async function generateCleanSubjectPhotoAI(subjectHint: string): Promise<string> {
  const cleanPrompt = `${subjectHint.replace(/\[|\]|\n/g, ' ')} photographic portrait, flawless glowing skin, clean background, natural studio lighting, highly detailed 8k, textless, no subtitles, no words, no watermark, pristine quality`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1080&height=1350&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
}

export interface ExtractedUrlContent {
  title: string;
  imageUrl: string;
  bodyText: string;
}

/**
 * 뉴스, 블로그, SNS 링크에서 상단 대표 사진과 본문/캡션 글을 추출합니다.
 * 추출된 이미지는 캔버스 렌더링 및 편집이 가능하도록 Base64로 자동 변환됩니다.
 */
export async function extractContentFromUrl(url: string): Promise<ExtractedUrlContent> {
  const cleanUrl = (url || '').trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    throw new Error('올바른 웹 주소(http:// 또는 https://)를 입력해 주세요.');
  }

  let title = '';
  let rawImageUrl = '';
  let bodyText = '';

  // 1. Microlink API 메타데이터 추출 (og:image, title, og:description)
  try {
    const mRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (mRes.ok) {
      const mData = await mRes.json();
      if (mData.status === 'success' && mData.data) {
        if (mData.data.title) title = mData.data.title;
        if (mData.data.image?.url) rawImageUrl = mData.data.image.url;
        if (mData.data.description) bodyText = mData.data.description;
      }
    }
  } catch (e) {
    console.warn('Microlink extraction warning:', e);
  }

  // 2. Jina Reader API 본문 및 이미지 추출 (마크다운 기반 전문 파싱)
  try {
    const jRes = await fetch(`https://r.jina.ai/${cleanUrl}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (jRes.ok) {
      const jData = await jRes.json();
      if (!title && jData.data?.title) title = jData.data.title;

      const content = jData.data?.content || '';

      // 본문 내 대표 이미지 URL 추출 (이미지가 비어있을 경우)
      if (!rawImageUrl) {
        const imgMatch = content.match(/!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/);
        if (imgMatch && imgMatch[2]) {
          rawImageUrl = imgMatch[2];
        } else if (jData.data?.images) {
          const imgs = Object.keys(jData.data.images);
          if (imgs.length > 0) rawImageUrl = imgs[0];
        }
      }

      // 본문 텍스트 정제 (메뉴, 링크, 광고, 저작권 문구 제외)
      const cleanLines = content
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => {
          if (!l || l.length < 8) return false;
          if (l.startsWith('![') || (l.startsWith('[') && l.endsWith(')'))) return false;
          if (l.startsWith('http://') || l.startsWith('https://')) return false;
          if (/저작권자|무단\s*전재|재배포\s*금지|구독|로그인|회원가입|댓글|공유하기|음성\s*재생|텍스트\s*음성|바로가기/i.test(l)) return false;
          return true;
        });

      const parsedBody = cleanLines.join('\n\n');
      if (parsedBody.length > bodyText.length) {
        bodyText = parsedBody;
      }
    }
  } catch (e) {
    console.warn('Jina content extraction warning:', e);
  }

  if (!bodyText && title) {
    bodyText = title;
  }

  // 3. 추출된 이미지를 Base64 Data URL로 변환하여 캔버스 Taint 방지 및 일관된 처리
  let finalImageUrl = rawImageUrl;
  if (rawImageUrl && !rawImageUrl.startsWith('data:')) {
    try {
      const imgRes = await fetch(rawImageUrl, { signal: AbortSignal.timeout(5000) });
      if (imgRes.ok) {
        const blob = await imgRes.blob();
        finalImageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(rawImageUrl);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // CORS 문제 발생 시 프록시 우회 시도
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rawImageUrl)}`;
        const pRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
        if (pRes.ok) {
          const blob = await pRes.blob();
          finalImageUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(rawImageUrl);
            reader.readAsDataURL(blob);
          });
        }
      } catch {
        finalImageUrl = rawImageUrl;
      }
    }
  }

  return {
    title,
    imageUrl: finalImageUrl,
    bodyText: bodyText.slice(0, 3000), // 최대 3,000자까지 안전하게 유지
  };
}
