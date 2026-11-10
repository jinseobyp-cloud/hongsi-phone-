import React, { useState, useRef } from 'react';
import { useHongsiPhone } from '../context/HongsiPhoneContext';
import { renderBracketText } from '../utils/textParser';
import {
  Save,
  Crop,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  ArrowLeft,
  ArrowRight,
  Trash2,
  ChevronDown,
} from 'lucide-react';

export const Module2_CanvasViewport: React.FC = () => {
  const {
    state,
    setAspectRatio,
    setProjectTitle,
    saveProject,
    toggleCropMode,
    isCropMode,
    setActiveCardIndex,
    addCard,
    duplicateCard,
    removeCard,
    moveCardForward,
    moveCardBackward,
    updateCardPhoto,
  } = useHongsiPhone();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const activeCard = state.cards[state.activeCardIndex];

  // Pinch-to-zoom interactive spring state (Instagram style)
  const [isPinching, setIsPinching] = useState(false);
  const [pinchScale, setPinchScale] = useState(1);
  const [pinchTranslate, setPinchTranslate] = useState({ x: 0, y: 0 });

  const touchStartDistRef = useRef<number | null>(null);
  const touchStartCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Single finger photo drag in Crop Mode
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Two-finger pinch-to-zoom for entire card box
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };

      touchStartDistRef.current = dist;
      touchStartCenterRef.current = center;
      setIsPinching(true);
    } else if (e.touches.length === 1 && isCropMode) {
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current && touchStartCenterRef.current) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };

      const scale = Math.max(0.7, Math.min(3.5, dist / touchStartDistRef.current));
      const dx = center.x - touchStartCenterRef.current.x;
      const dy = center.y - touchStartCenterRef.current.y;

      setPinchScale(scale);
      setPinchTranslate({ x: dx, y: dy });
    } else if (e.touches.length === 1 && isCropMode && dragStart && activeCard) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      updateCardPhoto({
        offsetX: Math.max(-100, Math.min(100, activeCard.photo.offsetX + dx * 0.5)),
        offsetY: Math.max(-100, Math.min(100, activeCard.photo.offsetY + dy * 0.5)),
      });
    }
  };

  // On release, snap back to original size smoothly
  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    touchStartCenterRef.current = null;
    setIsPinching(false);
    setPinchScale(1);
    setPinchTranslate({ x: 0, y: 0 });
    setDragStart(null);
  };

  // Mouse drag in Crop Mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCropMode) return;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCropMode || !dragStart || !activeCard) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    updateCardPhoto({
      offsetX: Math.max(-100, Math.min(100, activeCard.photo.offsetX + dx * 0.5)),
      offsetY: Math.max(-100, Math.min(100, activeCard.photo.offsetY + dy * 0.5)),
    });
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  return (
    <section className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* 2.1 Project Title & Save Status Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 mr-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={state.projectTitle}
              autoFocus
              onBlur={() => setIsEditingTitle(false)}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="text-base font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-red-300 w-full outline-none"
            />
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              title="클릭하여 제목 변경"
              className="text-base font-extrabold text-slate-900 dark:text-white truncate cursor-pointer hover:text-[#EF4444] transition flex items-center space-x-1"
            >
              <span>{state.projectTitle}</span>
              <span className="text-[10px] text-slate-400 font-normal">✏️</span>
            </h2>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400">
            {state.isSaved ? '저장됨' : '저장되지 않음'}
          </span>
          <button
            onClick={saveProject}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>저장</span>
          </button>
        </div>
      </div>

      {/* 2.2 Canvas Dimension & Template Controls (3 rows) */}
      <div className="space-y-2 mb-3">
        {/* Row 1: Aspect Ratio Tabs */}
        <div className="w-full bg-[#F1F5F9] dark:bg-slate-800 p-0.5 rounded-lg grid grid-cols-2 text-xs font-semibold">
          <button
            onClick={() => setAspectRatio('post_1080_1350')}
            className={`py-1.5 rounded-md text-center transition ${
              state.aspectRatio === 'post_1080_1350'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500'
            }`}
          >
            게시물 <span className="text-[10px] text-slate-400">1080×1350</span>
          </button>
          <button
            onClick={() => setAspectRatio('reels_1080_1920')}
            className={`py-1.5 rounded-md text-center transition ${
              state.aspectRatio === 'reels_1080_1920'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500'
            }`}
          >
            릴스 <span className="text-[10px] text-slate-400">1080×1920</span>
          </button>
        </div>

        {/* Row 2: Layout Template & Card Type Dropdowns */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50">
            <span className="truncate">사진 전면 + 그라데이션</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
          </button>
          <button className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50">
            <span>{activeCard?.role || '표지'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
          </button>
        </div>

        {/* Row 3: Photo Position Crop Mode Toggle */}
        <button
          onClick={toggleCropMode}
          className={`w-full py-1.5 rounded-full border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
            isCropMode
              ? 'border-[#EF4444] bg-[#FFF5F5] text-[#EF4444]'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>{isCropMode ? '사진 위치 조정 중 (드래그하여 이동)' : '사진 위치 조정'}</span>
        </button>
      </div>

      {/* 2.3 Checkerboard Container with Two-finger Pinch Zoom (Instagram snap-back style) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full rounded-2xl p-4 sm:p-5 flex justify-center items-center shadow-inner relative min-h-[350px] touch-none"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #E2E8F0 25%, transparent 25%),
            linear-gradient(-45deg, #E2E8F0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #E2E8F0 75%),
            linear-gradient(-45deg, transparent 75%, #E2E8F0 75%)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          backgroundColor: '#F8FAFC',
        }}
      >
        {/* Subtle Pinch Guide */}
        <div className="absolute top-2.5 left-3 text-[10px] text-slate-400 font-semibold flex items-center space-x-1 pointer-events-none">
          <span>🤏 두 손가락으로 화면 줌인/줌아웃</span>
        </div>

        {/* Card Canvas Frame (Whole box scales and moves on pinch, snaps back to 1.0 on release) */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative w-full max-w-[280px] rounded-xl overflow-hidden shadow-2xl bg-black select-none ${
            isCropMode ? 'cursor-grab active:cursor-grabbing ring-2 ring-[#EF4444]' : ''
          }`}
          style={{
            aspectRatio: state.aspectRatio === 'reels_1080_1920' ? '9/16' : '4/5',
            transform: `scale(${pinchScale}) translate(${pinchTranslate.x / pinchScale}px, ${
              pinchTranslate.y / pinchScale
            }px)`,
            transition: isPinching
              ? 'none'
              : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.3s',
            zIndex: isPinching ? 40 : 1,
            boxShadow: isPinching
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Background Photo */}
          {activeCard?.photo.hasPhoto && activeCard.photo.url ? (
            <div
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                backgroundImage: `url(${activeCard.photo.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `scale(${activeCard.photo.scale / 100}) translate(${
                  activeCard.photo.offsetX
                }px, ${activeCard.photo.offsetY}px)`,
                filter: activeCard.photo.isGrayscale ? 'grayscale(100%)' : undefined,
                transition: dragStart ? 'none' : 'transform 0.15s ease-out',
              }}
            />
          ) : null}

          {/* Linear Gradient Overlay: 상단 피사체는 100% 투명하게 보존하고 하단 텍스트 영역만 부드럽게 암전 */}
          {activeCard?.gradient.enabled && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, transparent 0%, transparent ${Math.max(
                  0,
                  100 - activeCard.gradient.heightPercent
                )}%, rgba(0,0,0,${
                  activeCard.gradient.opacity * 0.45
                }) ${Math.max(
                  0,
                  100 - activeCard.gradient.heightPercent * 0.5
                )}%, rgba(0,0,0,${activeCard.gradient.opacity}) 100%)`,
              }}
            />
          )}

          {/* Headline Text Overlay */}
          {activeCard ? (
            <div
              className={`absolute inset-0 flex flex-col justify-end p-5 pointer-events-none ${
                activeCard.typography.align === 'center'
                  ? 'text-center items-center'
                  : activeCard.typography.align === 'right'
                  ? 'text-right items-end'
                  : 'text-left items-start'
              }`}
            >
              <div
                style={{
                  fontSize: `${activeCard.typography.fontSizePx * 0.75}px`,
                  lineHeight: `${activeCard.typography.lineHeightPercent}%`,
                  letterSpacing: `${activeCard.typography.letterSpacingPercent}%`,
                  fontWeight: 900,
                }}
                className="w-full leading-tight drop-shadow-md whitespace-pre-line"
              >
                {renderBracketText(
                  activeCard.titleText,
                  activeCard.typography.baseColorHex,
                  activeCard.typography.accentColorHex,
                  activeCard.typography.strokeWidthPx
                )}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <span className="text-white font-bold text-sm mb-2">아직 비어 있는 카드입니다</span>
              <p className="text-[11px] leading-relaxed">
                원문을 붙여넣고 분석하고 카드 생성을 누르면 제목과 카드가 한 번에 만들어집니다.
              </p>
            </div>
          )}

          {/* Crop Mode Indicator Overlay */}
          {isCropMode && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600/90 text-white font-bold text-[10px] pointer-events-none flex items-center space-x-1 animate-pulse">
              <Crop className="w-3 h-3" />
              <span>사진 이동 모드</span>
            </div>
          )}
        </div>
      </div>

      {/* 2.4 Pagination & Card Management Toolbar */}
      <div className="mt-3 space-y-2">
        {/* Row 1: Page Numbers Navigation */}
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setActiveCardIndex(state.activeCardIndex - 1)}
            disabled={state.activeCardIndex === 0}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1.5">
            {state.cards.map((card, idx) => {
              const isSelected = idx === state.activeCardIndex;
              return (
                <button
                  key={card.cardId}
                  onClick={() => setActiveCardIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    isSelected
                      ? 'bg-[#EF4444] text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setActiveCardIndex(state.activeCardIndex + 1)}
            disabled={state.activeCardIndex === state.cards.length - 1}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Action Toolbar */}
        <div className="flex items-center justify-between pt-1">
          {/* Left: Add Card & Duplicate */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={addCard}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>장 추가</span>
            </button>
            <button
              onClick={() => duplicateCard(state.activeCardIndex)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>복제</span>
            </button>
          </div>

          {/* Center: Reorder */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => moveCardForward(state.activeCardIndex)}
              disabled={state.activeCardIndex === 0}
              className="px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-medium disabled:opacity-30 hover:bg-slate-100 flex items-center space-x-0.5"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>앞으로</span>
            </button>
            <button
              onClick={() => moveCardBackward(state.activeCardIndex)}
              disabled={state.activeCardIndex === state.cards.length - 1}
              className="px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-medium disabled:opacity-30 hover:bg-slate-100 flex items-center space-x-0.5"
            >
              <span>뒤로</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Right: Delete (Pink BG + Red Trash) */}
          <button
            onClick={() => removeCard(state.activeCardIndex)}
            title="현재 카드 삭제"
            className="w-8 h-8 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444] flex items-center justify-center hover:bg-red-100 transition shadow-2xs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
