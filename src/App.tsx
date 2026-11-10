import React from 'react';
import { useHongsiPhone } from './context/HongsiPhoneContext';
import { PasswordGate } from './components/PasswordGate';
import { Module0_Landing } from './components/Module0_Landing';
import { Module1_Header } from './components/Module1_Header';
import { Module2_CanvasViewport } from './components/Module2_CanvasViewport';
import { Module3_SourceTab } from './components/Module3_SourceTab';
import { Module4_CardTab } from './components/Module4_CardTab';
import { Module5_StyleTab } from './components/Module5_StyleTab';
import { Module7_ProgressModal } from './components/Module7_ProgressModal';
import { ColorPickerModal } from './components/ColorPickerModal';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLanding, state } = useHongsiPhone();
  const isKakao = typeof navigator !== 'undefined' && /kakaotalk/i.test(navigator.userAgent);

  // 1. Password Access Gate (접근 제어 잠금 화면)
  if (!isAuthenticated) {
    return <PasswordGate />;
  }

  // 2. Landing Screen
  if (isLanding) {
    return <Module0_Landing />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center">
      {/* Mobile-first Viewport (max-width: 430px) */}
      <div className="w-full max-w-[430px] min-h-screen bg-white dark:bg-slate-900 shadow-2xl flex flex-col relative pb-8">
        {/* KakaoTalk In-App Browser Escape Banner */}
        {isKakao && (
          <div className="bg-[#FEE500] text-[#191919] px-3.5 py-2 text-xs font-bold flex items-center justify-between border-b border-amber-300 shadow-xs z-50">
            <span className="truncate pr-2">💡 상하단 검은 바 없이 전체화면으로 실행</span>
            <button
              type="button"
              onClick={() => {
                window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
              }}
              className="px-2.5 py-1 rounded-lg bg-[#191919] text-white text-[11px] font-black shrink-0 active:scale-95 shadow-xs"
            >
              기본 브라우저로 열기
            </button>
          </div>
        )}

        {/* Module 1: Sticky Top Header & 3-Tab Bar (원문 | 카드 | 스타일) */}
        <Module1_Header />

        {/* Module 2: Live Canvas Viewport (원문 탭에서는 숨김, 카드/스타일 탭에서만 상단 표시) */}
        {state.activeMainTab !== 'source' && <Module2_CanvasViewport />}

        {/* Dynamic Tab Content (원문 | 카드 | 스타일) */}
        <main className="flex-1">
          {state.activeMainTab === 'source' && <Module3_SourceTab />}
          {state.activeMainTab === 'card' && <Module4_CardTab />}
          {state.activeMainTab === 'style' && <Module5_StyleTab />}
        </main>

        {/* Module 7: AI Progress Modals */}
        <Module7_ProgressModal />

        {/* Sub-module 5.4: Color Picker Modal */}
        <ColorPickerModal />
      </div>
    </div>
  );
};
