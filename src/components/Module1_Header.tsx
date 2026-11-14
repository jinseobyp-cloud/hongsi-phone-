import React, { useState, useEffect } from 'react';
import { useHongsiPhone } from '../context/HongsiPhoneContext';
import { MainTab } from '../types/hongsiphone';
import { Moon, Sun, ChevronDown, Sparkles, Smartphone, Key, Maximize, Minimize, Lock } from 'lucide-react';
import { MobileQrModal } from './MobileQrModal';
import { ApiKeyModal } from './ApiKeyModal';
import { InstallAppModal } from './InstallAppModal';
import hongsiAvatar from '../assets/hongsi_avatar.png';

export const Module1_Header: React.FC = () => {
  const { state, setActiveMainTab, isDarkMode, toggleDarkMode, logout } = useHongsiPhone();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mobileUrl = typeof window !== 'undefined' && window.location.origin.startsWith('http')
    ? window.location.origin
    : 'https://racks-thriller-atlas-player.trycloudflare.com';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen request denied or not supported:', e);
    }
  };

  const tabs: { key: MainTab; label: string }[] = [
    { key: 'source', label: '원문' },
    { key: 'card', label: '카드' },
    { key: 'style', label: '스타일' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#F8FAFC]/95 dark:bg-slate-900/95 backdrop-blur-md pt-3 pb-2 px-4 border-b border-slate-200 dark:border-slate-800">
      {/* 1.1 Global Header */}
      <div className="flex items-center justify-between mb-3">
        {/* Left: Hongsi Character Avatar Logo + Title */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#FFF8F1] dark:bg-slate-800 border border-orange-200 dark:border-orange-800/60 p-0.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden ring-1 ring-orange-300/50">
            <img
              src={hongsiAvatar}
              alt="홍시"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
            홍시폰
          </span>
          <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-1.5 py-0.5 rounded-full">
            V3.5
          </span>
        </div>

        {/* Right: Fullscreen + API Key + Phone QR Icon + DarkMode Moon */}
        <div className="flex items-center space-x-1.5">
          {/* Fullscreen Button for Samsung S22 & Mobile */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? '전체화면 종료' : '전체화면으로 보기'}
            className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs hover:bg-slate-50 transition"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-[#EF4444]" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* API Key Settings Button */}
          <button
            onClick={() => setIsApiKeyOpen(true)}
            title="Gemini API 키 설정"
            className={`px-2 py-1 rounded-full border text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition ${
              state.apiKey
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{state.apiKey ? 'AI 연결됨' : 'API 키'}</span>
          </button>

          {/* QR Phone Button */}
          <button
            onClick={() => setIsQrOpen(true)}
            title="스마트폰에서 열기 (QR 코드)"
            className="px-2 py-1 rounded-full border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-[#EF4444] font-bold text-[11px] flex items-center space-x-1 shadow-2xs hover:bg-red-100 transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>폰으로</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title="다크 모드 전환"
            className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-50 transition"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Lock / Logout Button */}
          <button
            onClick={() => {
              if (window.confirm('스튜디오를 잠그시겠습니까? 다시 접근하려면 비밀번호를 입력해야 합니다.')) {
                logout();
              }
            }}
            title="스튜디오 잠금 (비밀번호 화면으로 전환)"
            className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 shadow-xs hover:bg-slate-50 transition"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1.2 Main 3-Tab Bar (원문 | 카드 | 스타일) */}
      <nav className="w-full bg-[#F1F5F9] dark:bg-slate-800 p-1 rounded-[10px] grid grid-cols-3 gap-1">
        {tabs.map((tab) => {
          const isActive = state.activeMainTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveMainTab(tab.key)}
              className={`py-1.5 rounded-[8px] font-bold text-xs transition text-center select-none ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <MobileQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        mobileUrl={mobileUrl}
        onOpenInstall={() => setIsInstallOpen(true)}
      />
      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
      />
      <InstallAppModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />
    </header>
  );
};
