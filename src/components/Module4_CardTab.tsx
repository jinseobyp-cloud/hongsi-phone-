import React, { useState } from 'react';
import { useHongsiPhone } from '../context/HongsiPhoneContext';
import { ChevronDown, ChevronUp, Sparkles, Image as ImageIcon, RotateCw, Layers } from 'lucide-react';

export const Module4_CardTab: React.FC = () => {
  const {
    state,
    runGenerateImage,
    runGenerateAllImages,
    updateCardPhoto,
    updateCardGradient,
    removeTextFromCardPhoto,
    generateCleanPhotoForCard,
  } = useHongsiPhone();

  const [isImageAccordionOpen, setIsImageAccordionOpen] = useState(true);
  const [promptMode, setPromptMode] = useState<'auto' | 'custom'>('auto');
  const [styleHint, setStyleHint] = useState('');

  const activeCard = state.cards[state.activeCardIndex];

  return (
    <div className="p-4 space-y-4 bg-white dark:bg-slate-900 pb-12">
      {/* Quick Action Button: 이 방식으로 5개 뽑기 [무료] */}
      <button
        onClick={() => runGenerateAllImages()}
        className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-between hover:bg-slate-50 transition shadow-2xs"
      >
        <span className="flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>이 방식으로 5개 뽑기</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[#E2E8F0] dark:bg-slate-700 text-[#475569] dark:text-slate-300 font-bold text-[11px]">
          무료
        </span>
      </button>

      {/* AI Background Image Accordion */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
        <button
          onClick={() => setIsImageAccordionOpen(!isImageAccordionOpen)}
          className="w-full p-3.5 flex items-center justify-between font-extrabold text-xs text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 transition"
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm">🖼️</span>
            <span>현재 카드({state.activeCardIndex + 1}) 배경 이미지</span>
          </div>
          {isImageAccordionOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isImageAccordionOpen && (
          <div className="p-3.5 space-y-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-500">
              현재 선택된 카드 {state.activeCardIndex + 1}의 배경 이미지를 생성하거나 교체합니다.
            </p>

            {/* Photo Adjust & Subtitle Crop Controls */}
            {(activeCard?.photo.hasPhoto && (activeCard?.photo.originalUploadUrl || state.sourceInput.referenceImageUrl || activeCard?.photo.url)) && (
              <div className="p-3.5 rounded-2xl bg-[#FFF9F5] dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-orange-950 dark:text-orange-200">
                  <span>사진 글씨 제거 & 선명도 조절</span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                    {activeCard?.photo.scale}% 비율 · {activeCard?.gradient.enabled ? `어둡기 ${activeCard.gradient.heightPercent}%` : '밝은 원본'}
                  </span>
                </div>

                {/* 1. AI Text Removal & Restore Actions */}
                <div className="space-y-1.5">
                  {/* 원본 사진 복원 버튼 (엉뚱한 사진이 나왔을 때 즉시 원래 인물로 되돌리기) */}
                  {(activeCard?.photo.originalUploadUrl || state.sourceInput.referenceImageUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        const original = activeCard?.photo.originalUploadUrl || state.sourceInput.referenceImageUrl;
                        if (original) {
                          updateCardPhoto({ url: original, scale: 100, offsetY: 0, hasPhoto: true });
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/60 dark:hover:bg-orange-900 border border-orange-300 dark:border-orange-800 text-orange-950 dark:text-orange-200 font-extrabold text-xs shadow-2xs flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-orange-700" />
                      <span>⏪ 원래 인물 사진으로 즉시 복원하기</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeTextFromCardPhoto()}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>🪄 사진 속 자막/글씨 AI로 지우기</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => generateCleanPhotoForCard()}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center space-x-1.5 transition"
                  >
                    <ImageIcon className="w-3 h-3 text-slate-400" />
                    <span>새로운 가상 인물로 AI 사진 새로 그리기</span>
                  </button>
                </div>

                {/* 2. Gradient Brightness Switch (화면이 심하게 어두워지는 현상 방지) */}
                <div className="space-y-1 pt-1 border-t border-orange-100 dark:border-orange-900/40">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>사진 밝기 & 선명도 (그라데이션 조절)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => updateCardGradient({ enabled: true, heightPercent: 28, opacity: 0.55 })}
                      className={`py-1.5 px-1 rounded-lg border text-center transition ${
                        activeCard?.gradient.enabled && activeCard?.gradient.heightPercent <= 30
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-black'
                          : 'border-slate-200 bg-white dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      <span>☀️ 밝고 선명하게</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCardGradient({ enabled: true, heightPercent: 38, opacity: 0.72 })}
                      className={`py-1.5 px-1 rounded-lg border text-center transition ${
                        activeCard?.gradient.enabled && activeCard?.gradient.heightPercent > 30 && activeCard?.gradient.heightPercent <= 45
                          ? 'border-orange-500 bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 font-black'
                          : 'border-slate-200 bg-white dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      <span>🌤️ 보통 (기본)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCardGradient({ enabled: false })}
                      className={`py-1.5 px-1 rounded-lg border text-center transition ${
                        !activeCard?.gradient.enabled
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-black'
                          : 'border-slate-200 bg-white dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      <span>🚫 어둡기 끔</span>
                    </button>
                  </div>
                </div>

                {/* 3. Scale & Position */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      updateCardPhoto({ scale: 100, offsetY: 0, offsetX: 0 });
                    }}
                    className={`py-2 px-2 rounded-xl border text-center transition flex items-center justify-center space-x-1 ${
                      activeCard?.photo.scale === 100 && activeCard?.photo.offsetY === 0
                        ? 'border-orange-500 bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 shadow-xs font-black'
                        : 'border-slate-200 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>🔄 원본 비율 (100%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateCardPhoto({ scale: 125, offsetY: 25, offsetX: 0 });
                    }}
                    className={`py-2 px-2 rounded-xl border text-center transition flex items-center justify-center space-x-1 ${
                      activeCard?.photo.scale > 100
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 shadow-xs'
                        : 'border-slate-200 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>✂️ 하단 자막 가리기 (확대)</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  💡 제미나이 웹(gemini.google.com)에서 자막을 지운 사진을 [원문] 탭에서 업로드하시면 상단 사진이 어두워지지 않고 100% 선명하게 표시됩니다.
                </p>
              </div>
            )}

            {/* Prompt Mode Toggle (2-columns) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPromptMode('auto');
                  updateCardPhoto({ promptMode: 'auto' });
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                  promptMode === 'auto'
                    ? 'border-[#EF4444] bg-[#FFF5F5] text-slate-900 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                자동 분석
              </button>
              <button
                type="button"
                onClick={() => {
                  setPromptMode('custom');
                  updateCardPhoto({ promptMode: 'custom' });
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                  promptMode === 'custom'
                    ? 'border-[#EF4444] bg-[#FFF5F5] text-slate-900 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                직접 입력
              </button>
            </div>

            {/* Image Style Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                이미지 스타일 (선택)
              </label>
              <input
                type="text"
                value={styleHint}
                onChange={(e) => {
                  setStyleHint(e.target.value);
                  updateCardPhoto({ styleHint: e.target.value });
                }}
                placeholder="예: 사진풍, 미니멀 일러스트, 3D 렌더"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#EF4444] outline-none"
              />
            </div>

            {/* 3-Tier Image Generation Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => runGenerateImage()}
                className="w-full py-2.5 rounded-xl bg-[#E12D2D] hover:bg-[#EF4444] text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md shadow-red-500/20 active:scale-[0.98] transition"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>AI 이미지 생성</span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-white font-bold text-[10px]">
                  3
                </span>
              </button>

              <button
                type="button"
                onClick={() => runGenerateImage()}
                className="w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
              >
                <RotateCw className="w-3 h-3 text-slate-500" />
                <span>같은 설명으로 다시 생성</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#E2E8F0] dark:bg-slate-700 text-[#475569] dark:text-slate-300 font-bold text-[10px]">
                  3
                </span>
              </button>

              <button
                type="button"
                onClick={() => runGenerateAllImages()}
                className="w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
              >
                <Layers className="w-3 h-3 text-slate-500" />
                <span>사진 없는 카드 모두 생성</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#E2E8F0] dark:bg-slate-700 text-[#475569] dark:text-slate-300 font-bold text-[10px]">
                  3
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
