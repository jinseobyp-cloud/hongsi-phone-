import React, { useState, useRef } from 'react';
import { useHongsiPhone } from '../context/HongsiPhoneContext';
import hongsiAvatar from '../assets/hongsi_avatar.png';
import {
  Upload,
  ChevronDown,
  ChevronRight,
  Check,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Globe,
  FileText,
  RotateCw,
  Layers,
  Languages,
  Copy,
  Download,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEFAULT_SOURCE_TEXT } from '../services/mockAiService';

export const Module3_SourceTab: React.FC = () => {
  const {
    state,
    setGuideline,
    setSourceInputType,
    setSourceText,
    setSourceUrl,
    setTargetCardCount,
    setReferenceImage,
    removeReferenceImage,
    runSourceAnalysis,
    selectRecommendedTitle,
    runGenerateImage,
    runGenerateAllImages,
    updateCardPhoto,
    translateLanguage,
    generateCaption,
    exportZip,
    loadSampleProject,
    clearAllContent,
    isLinkFetching,
    fetchAndApplyLinkSource,
  } = useHongsiPhone();

  // Accordion open/close state (1: 원문 넣기, 2: AI 추천 제목, 3: AI 배경 이미지, 4: 번역 & 내보내기)
  const [openAccordions, setOpenAccordions] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
    4: false,
  });

  const toggleAccordion = (index: number) => {
    setOpenAccordions((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Accordion 2: Regeneration controls
  const [extraGuideline, setExtraGuideline] = useState('');
  const [hookingFormula, setHookingFormula] = useState('대비(비교) + 핵심 키워드');

  // Accordion 3: AI Background image options
  const [promptMode, setPromptMode] = useState<'auto' | 'custom'>('auto');
  const [useReferenceImage, setUseReferenceImage] = useState(true);
  const [imagePrompt, setImagePrompt] = useState('');
  const [styleHint, setStyleHint] = useState('사진풍');

  // Accordion 4: Translation & Export state
  const [selectedLang, setSelectedLang] = useState('한국어 (원문)');
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReferenceImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const loadSampleStory = () => {
    loadSampleProject();
    setOpenAccordions((prev) => ({ ...prev, 1: true, 2: true }));
  };

  const handleAnalysis = async () => {
    await runSourceAnalysis();
    // Auto-expand Accordion 2 (AI 추천 제목)
    setOpenAccordions((prev) => ({ ...prev, 1: true, 2: true }));
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(state.exportAndTranslate.captionText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleZipDownload = async () => {
    try {
      setIsExporting(true);
      await exportZip();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      console.error('Export failed:', e);
      alert('ZIP 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 space-y-3.5 bg-[#FAF8F5] dark:bg-slate-950 pb-16 font-sans">
      {/* Top Banner: 이야기의 시작은 여기서 */}
      <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#EFECE6] dark:border-slate-800 shadow-2xs">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-orange-200 dark:border-orange-900/40 shadow-xs shrink-0 bg-[#FFF8F1] dark:bg-slate-800 p-0.5 flex items-center justify-center">
          <img
            src={hongsiAvatar}
            alt="홍시"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-[#2D241E] dark:text-white">
            이야기의 시작은 여기서
          </h2>
          <p className="text-[11px] text-[#7A7167] dark:text-slate-400">
            내용만 넣으면 홍시봇이 정리해 드려요.
          </p>
        </div>
      </div>

      {/* ========================================== */}
      {/* [아코디언 1] 1 원문 넣기 */}
      {/* ========================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#EBE6DF] dark:border-slate-800 shadow-xs overflow-hidden transition-all">
        {/* Accordion Header */}
        <button
          type="button"
          onClick={() => toggleAccordion(1)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-[#5C4028] text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <span className="text-sm font-extrabold text-[#2D241E] dark:text-white">
              원문 넣기
            </span>
          </div>
          {openAccordions[1] ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openAccordions[1] && (
          <div className="p-4 pt-1 space-y-4 border-t border-[#F5F2EC] dark:border-slate-800">
            {/* Guide text & Sample loader */}
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-[#7A7167] dark:text-slate-400 leading-relaxed max-w-[260px]">
                글을 붙여 넣거나 뉴스·블로그·인스타그램 링크를 가져올 수 있어요. 어느 나라 말이든 괜찮아요, 결과물은 한국어로 나옵니다.
              </p>
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  type="button"
                  onClick={loadSampleStory}
                  className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[#5C4028] dark:text-amber-400 text-[11px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition flex items-center space-x-1"
                >
                  <span>🌱 샘플 사연 불러오기</span>
                </button>
                <button
                  type="button"
                  onClick={clearAllContent}
                  className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[#EF4444] text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>지우기</span>
                </button>
              </div>
            </div>

            {/* 지침 (문체·번역·규칙, 선택) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#4A4036] dark:text-slate-200">
                  지침 (문체·번역·규칙, 선택)
                </label>
                {state.sourceInput.guideline && (
                  <button
                    type="button"
                    onClick={() => setGuideline('')}
                    className="text-[10px] text-slate-400 hover:text-red-500 font-semibold"
                  >
                    지침 지우기
                  </button>
                )}
              </div>
              <textarea
                value={state.sourceInput.guideline}
                onChange={(e) => setGuideline(e.target.value)}
                rows={2}
                placeholder="말투나 꼭 지켜야 할 조건을 적어 두면 모든 단계에 함께 적용됩니다."
                className="w-full p-3 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-[#FAF7F2] dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 leading-relaxed focus:border-[#5C4028] outline-none transition resize-none placeholder:text-slate-400"
              />
              <p className="text-[10px] text-[#9E958B] dark:text-slate-500">
                팁: 카드 제목에 숫자를 넣어주세요 / 반말로 친근하게 / 인용문은 그대로 유지
              </p>
            </div>

            {/* 원문 소스 선택 탭: [ 글 붙여넣기 ] | [ 링크로 가져오기 ] */}
            <div className="space-y-2">
              <div className="bg-[#EFEBE4] dark:bg-slate-800 p-0.5 rounded-xl grid grid-cols-2 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSourceInputType('paste')}
                  className={`py-2 rounded-lg text-center transition flex items-center justify-center space-x-1.5 ${state.sourceInput.inputType === 'paste'
                      ? 'bg-white dark:bg-slate-900 text-[#2D241E] dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>글 붙여넣기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceInputType('link')}
                  className={`py-2 rounded-lg text-center transition flex items-center justify-center space-x-1.5 ${state.sourceInput.inputType === 'link'
                      ? 'bg-white dark:bg-slate-900 text-[#2D241E] dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>링크로 가져오기</span>
                </button>
              </div>

              {state.sourceInput.inputType === 'paste' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {state.sourceInput.rawText.length > 0
                        ? `${state.sourceInput.rawText.length.toLocaleString()}자 입력됨`
                        : ''}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {state.sourceInput.rawText.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSourceText('')}
                          className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[#EF4444] text-[11px] font-bold flex items-center space-x-1 shadow-2xs hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>글 지우기</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const clipText = await navigator.clipboard.readText();
                            if (clipText) setSourceText(clipText);
                          } catch {
                            const manual = prompt('붙여넣을 글을 입력하세요:');
                            if (manual !== null) setSourceText(manual);
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center space-x-1 hover:bg-slate-200 transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>붙여넣기</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={state.sourceInput.rawText}
                    onChange={(e) => setSourceText(e.target.value)}
                    rows={4}
                    placeholder="어떤 이야기를 전하고 싶나요? 기사, 메모, 게시물의 본문을 여기에 붙여넣으세요."
                    className="w-full p-3 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs leading-relaxed focus:border-[#5C4028] outline-none transition resize-none placeholder:text-slate-400"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="url"
                      value={state.sourceInput.sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://www.yna.co.kr/view/..."
                      className="w-full pr-16 px-3 py-2.5 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:border-[#5C4028] outline-none"
                    />
                    {state.sourceInput.sourceUrl && (
                      <button
                        type="button"
                        onClick={() => setSourceUrl('')}
                        className="absolute right-2 top-2 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold hover:text-red-500"
                      >
                        지우기
                      </button>
                    )}
                  </div>

                  {/* 링크에서 사진 & 본문 실시간 가져오기 버튼 */}
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await fetchAndApplyLinkSource();
                      if (success) {
                        alert('✨ 링크에서 상단 대표 사진과 본문 글을 성공적으로 가져왔습니다!\n아래 [원본 이미지]와 [분석하고 카드 생성]을 확인해 보세요.');
                      }
                    }}
                    disabled={isLinkFetching || !state.sourceInput.sourceUrl.trim()}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs ${
                      isLinkFetching || !state.sourceInput.sourceUrl.trim()
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                        : 'bg-[#5C4028] hover:bg-[#47301C] text-white active:scale-[0.99]'
                    }`}
                  >
                    {isLinkFetching ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                        <span>링크 사진 & 본문 가져오는 중...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>📥 링크에서 사진 & 본문 글 가져오기</span>
                      </>
                    )}
                  </button>

                  {/* 가져온 본문 글 미리보기 배너 */}
                  {state.sourceInput.rawText && state.sourceInput.inputType === 'link' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                      <div className="truncate flex-1 pr-2">
                        <span className="font-extrabold mr-1">✅ 추출된 본문:</span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          {state.sourceInput.rawText.slice(0, 40)}... ({state.sourceInput.rawText.length.toLocaleString()}자)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSourceInputType('paste')}
                        className="underline text-[11px] text-emerald-800 dark:text-emerald-200 font-bold shrink-0 hover:text-emerald-950"
                      >
                        본문 확인
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-[#9E958B] dark:text-slate-500 leading-relaxed">
                    뉴스·블로그 글이나 웹 링크 주소를 넣고 <b>[분석하고 카드 생성]</b>을 누르면 상단 사진은 <b>원본 이미지</b>에, 아래 본문 글은 <b>글 붙여넣기</b>와 <b>본문 핵심 요약 및 5개 추천 제목</b>으로 자동 처리됩니다.
                  </p>
                </div>
              )}
            </div>

            {/* 원본 이미지 (선택) 업로더 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A4036] dark:text-slate-200">
                원본 이미지 (선택)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {state.sourceInput.referenceImageUrl ? (
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                    <img
                      src={state.sourceInput.referenceImageUrl}
                      alt="참고 이미지"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-[#EFECE6] text-xs font-bold text-slate-700"
                  >
                    사진 변경
                  </button>
                  <button
                    type="button"
                    onClick={removeReferenceImage}
                    className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-500 text-xs font-bold"
                  >
                    제거
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-[#EFECE6] dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-[#E8E4DD] transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>사진 올리기</span>
                </button>
              )}
              <p className="text-[10px] text-[#9E958B] dark:text-slate-500">
                원문 캡처나 쓰고 싶은 사진을 올려 두면 카드에 바로 넣을 수 있습니다.
              </p>
            </div>

            {/* 만들 카드 수 */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-bold text-[#4A4036] dark:text-slate-200">
                만들 카드 수
              </label>
              <div className="relative">
                <select
                  value={state.sourceInput.targetCardCount}
                  onChange={(e) => setTargetCardCount(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 pr-7 appearance-none outline-none"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}장
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 메인 실행 버튼: [ ✨ 분석하고 카드 생성 ⚡ 1 ] */}
            <button
              type="button"
              onClick={handleAnalysis}
              className="w-full py-3.5 rounded-xl bg-[#5C4028] hover:bg-[#4D3521] text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md shadow-[#5C4028]/20 transition active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>분석하고 카드 생성</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] flex items-center space-x-0.5">
                <span>⚡</span>
                <span>1</span>
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* [아코디언 2] 2 AI 추천 제목 */}
      {/* ========================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#EBE6DF] dark:border-slate-800 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleAccordion(2)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-[#5C4028] text-white text-[11px] font-bold flex items-center justify-center">
              2
            </span>
            <span className="text-sm font-extrabold text-[#2D241E] dark:text-white">
              AI 추천 제목
            </span>
          </div>
          {openAccordions[2] ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openAccordions[2] && (
          <div className="p-4 pt-1 space-y-4 border-t border-[#F5F2EC] dark:border-slate-800">
            <p className="text-[11px] text-[#7A7167] dark:text-slate-400">
              누르면 선택된 카드에 바로 적용됩니다.
            </p>

            {/* 5종 추천 제목 카드 리스트 */}
            <div className="space-y-2">
              {state.aiRecommendedTitles.map((item) => {
                const isSelected = item.isSelected;
                return (
                  <div
                    key={item.id}
                    onClick={() => selectRecommendedTitle(item.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition select-none ${isSelected
                        ? 'border-2 border-[#5C4028] bg-[#FAF7F2] dark:bg-amber-950/20 shadow-2xs'
                        : 'border-[#EBE6DF] dark:border-slate-800 bg-[#F2ECE1]/60 dark:bg-slate-800/50 hover:border-[#D6CFBE]'
                      }`}
                  >
                    <div className="text-xs font-extrabold text-[#2D241E] dark:text-white leading-relaxed mb-1 whitespace-pre-line">
                      {item.rawTitle.replace(/\[|\]/g, '')}
                    </div>
                    <div className="text-[10px] leading-tight text-[#7A7167] dark:text-slate-400 flex items-start space-x-1">
                      <span className="font-extrabold text-[#5C4028] dark:text-amber-400 shrink-0">
                        {item.score}
                      </span>
                      <span>·</span>
                      <span className="line-clamp-2">{item.reason}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 본문 핵심 요약 박스 */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-[#4A4036] dark:text-slate-200">
                본문 핵심 요약
              </label>
              <textarea
                value={state.articleSummary}
                rows={3}
                readOnly
                className="w-full p-3 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-[#FAF7F2] dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 leading-relaxed outline-none resize-none"
              />
            </div>

            {/* 맞춤형 제목 다시 뽑기 컨트롤러 */}
            <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-slate-800 border border-[#E6E1D8] dark:border-slate-700 space-y-2.5">
              <div>
                <div className="text-xs font-bold text-[#2D241E] dark:text-white">
                  맞춤형 제목 다시 뽑기
                </div>
                <p className="text-[10px] text-[#7A7167] dark:text-slate-400">
                  마음에 드는 제목이 없으면 지시 문구나 접근 방식을 바꿔 보세요.
                </p>
              </div>

              <input
                type="text"
                value={extraGuideline}
                onChange={(e) => setExtraGuideline(e.target.value)}
                placeholder="추가 지침 (예: 20대 타깃, 숫자 꼭 포함)"
                className="w-full px-3 py-2 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#5C4028]"
              />

              <button
                type="button"
                onClick={() => runSourceAnalysis()}
                className="w-full py-2 rounded-xl border border-[#5C4028] text-[#5C4028] dark:text-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-[#5C4028]/5 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>제목 5개 다시 생성 (무료)</span>
              </button>

              {/* 후킹 공식 선택 */}
              <div className="pt-1 space-y-1.5">
                <div className="relative">
                  <select
                    value={hookingFormula}
                    onChange={(e) => setHookingFormula(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 appearance-none outline-none pr-7"
                  >
                    <option value="대비(비교) + 핵심 키워드">대비(비교) + 핵심 키워드</option>
                    <option value="숫자 + 기간 + 결과">숫자 + 기간 + 결과</option>
                    <option value="의문형 + 반전 결말">의문형 + 반전 결말</option>
                    <option value="인용구 + 감정 극대화">인용구 + 감정 극대화</option>
                    <option value="속보/근황형">속보/근황형</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => runSourceAnalysis()}
                  className="w-full py-2 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition"
                >
                  이 방식으로 5개 뽑기 (무료)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* [아코디언 3] 3 AI 배경 이미지 */}
      {/* ========================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#EBE6DF] dark:border-slate-800 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleAccordion(3)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-[#5C4028] text-white text-[11px] font-bold flex items-center justify-center">
              3
            </span>
            <span className="text-sm font-extrabold text-[#2D241E] dark:text-white">
              AI 배경 이미지
            </span>
          </div>
          {openAccordions[3] ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openAccordions[3] && (
          <div className="p-4 pt-1 space-y-3.5 border-t border-[#F5F2EC] dark:border-slate-800">
            <p className="text-[11px] text-[#7A7167] dark:text-slate-400">
              선택된 카드의 배경을 만듭니다. 글자가 없는 사진으로 나오며 표정·구도를 조절합니다.
            </p>

            {/* 모드 스위치 (2-Tab) */}
            <div className="bg-[#EFEBE4] dark:bg-slate-800 p-0.5 rounded-xl grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setPromptMode('auto');
                  updateCardPhoto({ promptMode: 'auto' });
                }}
                className={`py-1.5 rounded-lg text-center transition ${promptMode === 'auto'
                    ? 'bg-white dark:bg-slate-900 text-[#2D241E] dark:text-white shadow-xs'
                    : 'text-slate-500'
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
                className={`py-1.5 rounded-lg text-center transition ${promptMode === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-[#2D241E] dark:text-white shadow-xs'
                    : 'text-slate-500'
                  }`}
              >
                직접 입력
              </button>
            </div>

            {/* 원본 이미지 참고 위젯 (Reference Image Card) */}
            <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-slate-800/80 border border-[#E6E1D8] dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2D241E] dark:text-white">
                    원본 이미지 참고
                  </div>
                  <p className="text-[10px] text-[#7A7167] dark:text-slate-400 max-w-[180px] leading-tight">
                    구도와 분위기를 참고해 새로 그립니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUseReferenceImage(!useReferenceImage)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${useReferenceImage
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-500'
                  }`}
              >
                {useReferenceImage ? '참고 중' : '참고 안 함'}
              </button>
            </div>

            {/* 이미지 프롬프트 (Textarea) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4036] dark:text-slate-200">
                이미지 프롬프트
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={2}
                placeholder="현재 카드의 제목과 본문을 읽고 어울리는 이미지를 만들어 제안해 드립니다."
                className="w-full p-2.5 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none resize-none focus:border-[#5C4028]"
              />
            </div>

            {/* 이미지 스타일 (선택) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4A4036] dark:text-slate-200">
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
                className="w-full px-3 py-2 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#5C4028]"
              />
            </div>

            {/* 생성 액션 버튼 3종 */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => runGenerateImage()}
                className="w-full py-3 rounded-xl bg-[#5C4028] hover:bg-[#4D3521] text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md shadow-[#5C4028]/20 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI 이미지 생성</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] flex items-center space-x-0.5">
                  <span>⚡</span>
                  <span>1</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => runGenerateImage()}
                className="w-full py-2 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>같은 설명으로 다시 생성 (1차감)</span>
              </button>

              <button
                type="button"
                onClick={() => runGenerateAllImages()}
                className="w-full py-2 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>사진 없는 카드 모두 자동 생성 (무료)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* [아코디언 4] 4 번역 & 내보내기 */}
      {/* ========================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#EBE6DF] dark:border-slate-800 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleAccordion(4)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-[#5C4028] text-white text-[11px] font-bold flex items-center justify-center">
              4
            </span>
            <span className="text-sm font-extrabold text-[#2D241E] dark:text-white">
              번역 & 내보내기
            </span>
          </div>
          {openAccordions[4] ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openAccordions[4] && (
          <div className="p-4 pt-1 space-y-4 border-t border-[#F5F2EC] dark:border-slate-800">
            {/* 언어 선택 드롭다운 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A4036] dark:text-slate-200">
                언어 선택
              </label>

              <div className="relative">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 appearance-none outline-none"
                >
                  <option value="한국어 (원문)">한국어 (원문)</option>
                  <option value="日本語">日本語 (일본어)</option>
                  <option value="English">English (영어)</option>
                  <option value="繁體中文">繁體中文 (중국어 번체)</option>
                  <option value="Español">Español (스페인어)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>

              <p className="text-[10px] text-[#9E958B] dark:text-slate-500">
                카드의 모든 글자와 아래 캡션을 함께 옮깁니다. 강조 표시나 줄바꿈, 해시태그도 그 언어에 맞게 다시 다듬습니다.
              </p>

              <button
                type="button"
                onClick={() => translateLanguage(selectedLang)}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-[#EFECE6] dark:bg-slate-800 hover:bg-[#E8E4DD] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition"
              >
                <span className="flex items-center space-x-1.5">
                  <Languages className="w-3.5 h-3.5 text-slate-600" />
                  <span>이 언어로 번역</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-[#5C4028] dark:text-amber-300 font-bold text-[10px]">
                  무료
                </span>
              </button>
            </div>

            {/* 업로드용 캡션 생성 및 편집기 */}
            <div className="space-y-1.5 pt-1 border-t border-[#F5F2EC] dark:border-slate-800">
              <label className="text-xs font-bold text-[#4A4036] dark:text-slate-200">
                업로드용 캡션
              </label>

              <textarea
                rows={4}
                value={state.exportAndTranslate.captionText}
                placeholder="인스타그램 게시물 본문에 올릴 캡션과 해시태그입니다."
                readOnly
                className="w-full p-3 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-[#FAF7F2] dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs leading-relaxed outline-none resize-none"
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={generateCaption}
                  className="col-span-2 py-2 px-3 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>캡션 만들기 (무료)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="col-span-1 py-2 px-3 rounded-xl border border-[#E6E1D8] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1 transition"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">복사됨!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 최종 일괄 다운로드 버튼: [ 📥 전체 내려받기 (ZIP) ] */}
            <div className="pt-2 border-t border-[#F5F2EC] dark:border-slate-800">
              <button
                type="button"
                onClick={handleZipDownload}
                disabled={isExporting}
                className="w-full py-3.5 rounded-xl bg-[#5C4028] hover:bg-[#4D3521] text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md shadow-[#5C4028]/20 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>
                  {isExporting ? '고화질 ZIP 압축 생성 중...' : '전체 내려받기 (ZIP)'}
                </span>
              </button>

              <p className="text-[10px] text-[#9E958B] dark:text-slate-500 text-center mt-2">
                카드 {state.cards.length}장을 압축해 내려받습니다. 파일 이름은 순서대로 번호가 붙어 올라갑니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
