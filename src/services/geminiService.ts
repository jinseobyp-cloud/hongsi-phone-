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
export function formatFallbackTitle(text: string, defaultHook: string = '핵심 내용'): string {
  const clean = (text || '').replace(/\[|\]/g, '').trim();
  if (!clean) return `스마트폰 카드뉴스\n[${defaultHook}]`;
  if (clean.includes('\n')) {
    const parts = clean.split('\n').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}\n[${parts[1]}]`;
  }
  if (clean.length <= 14) return `${clean}\n[${defaultHook}]`;
  const mid = Math.min(18, Math.floor(clean.length / 2));
  const space = clean.lastIndexOf(' ', mid);
  const splitIdx = space > 6 ? space : mid;
  const l1 = clean.slice(0, splitIdx).trim();
  const l2 = clean.slice(splitIdx, splitIdx + 20).trim();
  return `${l1}\n[${l2}]`;
}

export async function analyzeContentWithAI(
  apiKey: string | null,
  rawText: string,
  targetCardCount: number,
  guideline: string = '',
  referenceImageUrl: string | null = null
): Promise<AnalysisResult> {
  const cleanLines = (rawText || '').split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const userFallbackTitle = formatFallbackTitle(cleanLines[0] || '스마트폰 카드뉴스', '핵심 비결');

  if (!apiKey || !apiKey.trim()) {
    // Local simulation: Generate clean, text-free AI photo based on topic/reference
    const topicKeyword = cleanLines[0]?.slice(0, 35) || 'candid photograph';
    let card1Url = '';
    let hasCard1Photo = false;

    try {
      card1Url = await generateCardImageAI(
        `photorealistic clean photograph of ${topicKeyword}`,
        'candid portrait textless no words no text no subtitles 8k'
      );
      hasCard1Photo = true;
    } catch {
      card1Url = `https://image.pollinations.ai/prompt/${encodeURIComponent(topicKeyword + ' clean photograph textless no words 8k')}?width=1080&height=1350&nologo=true`;
      hasCard1Photo = true;
    }

    const simCards: CardItem[] = Array.from({ length: Math.max(1, targetCardCount) }, (_, idx) => ({
      cardId: idx + 1,
      role: idx === 0 ? '표지' : '본문',
      titleText: idx === 0 ? userFallbackTitle : formatFallbackTitle(cleanLines[idx] || `카드 ${idx + 1} 상세 안내`, `핵심 포인트 ${idx + 1}`),
      photo: {
        hasPhoto: idx === 0 ? hasCard1Photo : false,
        url: idx === 0 ? card1Url : '',
        originalUploadUrl: (idx === 0 && referenceImageUrl) ? referenceImageUrl : '',
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
    }));

    const titlesList = [
      formatFallbackTitle(cleanLines[0] || '스마트폰 카드뉴스', '핵심 비결'),
      formatFallbackTitle(cleanLines[1] || cleanLines[0] || '주목할 만한 이야기', '화제의 이유'),
      formatFallbackTitle(cleanLines[2] || cleanLines[0] || '놓치면 아쉬운 정보', '상세 분석'),
      formatFallbackTitle(cleanLines[3] || cleanLines[0] || '이것만 알면 끝', '반전 결말'),
      formatFallbackTitle(cleanLines[4] || cleanLines[0] || '핵심 요약 정리', '최종 정리'),
    ];

    return {
      projectTitle: userFallbackTitle.replace(/\[|\]|\n/g, ' ').slice(0, 20),
      recommendedTitles: titlesList.map((t, i) => ({
        id: `rec_${i + 1}`,
        rawTitle: t,
        displayWithNewlineSymbol: t.replace('\n', '\\n'),
        score: `${(9.8 - i * 0.2).toFixed(1)}/10`,
        reason: i === 0 ? '입력된 원문의 핵심 메시지를 직접 반영' : `원문 문맥 기반 추천 제목 ${i + 1}`,
        isSelected: i === 0,
      })),
      articleSummary: rawText.slice(0, 150) || '원문 내용을 바탕으로 기획된 카드뉴스입니다.',
      cards: simCards,
      caption: `${rawText.slice(0, 120)}\n\n#카드뉴스 #홍시폰 #정보공유`,
    };
  }

  // Call real Gemini API with gemini-2.0-flash and candidate models
  try {
    const prompt = `
당신은 인스타그램 카드뉴스 및 바이럴 콘텐츠 전문 AI 에디터입니다.
다음 원문 기사/글을 바탕으로 카드뉴스를 기획해 주세요. 첨부된 이미지가 있다면 이미지 속 피사체와 분위기를 분석하세요.

[지침]
${guideline || '제목에 숫자를 넣어주세요 / 본문은 존댓말로 / 인용문은 있는 그대로 살려주세요'}

[원문]
${rawText}

[요청 사항]
1. 3어절 내외의 프로젝트 핵심 주제어(projectTitle)
2. 가장 바이럴 가능성이 높은 AI 추천 제목 5개:
   - 각 제목은 2줄로 줄바꿈(\\n)을 포함해야 하며, 가장 핵심이 되는 강조 단어/구절은 반드시 [대괄호]로 감싸야 합니다. 예: "220만 유튜버 우주하마\\n[방송 중단하게 만든 질병]"
   - 10점 만점 바이럴 점수(score, 예: "9.5/10")와 선정 이유(reason) 포함
3. 1번 표지 배경용 영문 이미지 생성 프롬프트(coverImagePrompt):
   - 원본 사진에 글씨나 자막, 워터마크가 있더라도, 새로 제작되는 표지 배경 사진에는 글자가 일절 없는 깨끗한 실제 사진(textless clean photograph, no words, no subtitles)이어야 합니다.
   - 핵심 피사체(인물, 행동, 사물)를 글자 없이 깨끗한 실제 사진으로 그릴 수 있는 30~50단어의 구체적인 영문 프롬프트 작성.
4. 원문 핵심 요약 3~4문장(articleSummary)
5. 총 ${targetCardCount}장의 카드 문구(cards):
   - 1번 카드는 표지(role: "표지"), 나머지는 본문(role: "본문")
   - 각 카드의 titleText는 2줄 줄바꿈(\\n)과 핵심 강조구간 [대괄호] 포함
6. 인스타그램 업로드용 상세 캡션 및 해시태그(caption)

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

        if (idx === 0) {
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
      })
    );

    return {
      projectTitle: parsed.projectTitle || userFallbackTitle.replace(/\[|\]|\n/g, ' ').slice(0, 20),
      recommendedTitles: (parsed.recommendedTitles || []).map((t: any, i: number) => ({
        id: `rec_${i + 1}`,
        rawTitle: t.rawTitle,
        displayWithNewlineSymbol: t.rawTitle.replace('\n', '\\n'),
        score: t.score || '9.0/10',
        reason: t.reason || '',
        isSelected: i === 0,
      })),
      articleSummary: parsed.articleSummary || '',
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
