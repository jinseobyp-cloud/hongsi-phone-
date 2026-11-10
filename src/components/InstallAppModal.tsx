import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Smartphone, CheckCircle, Share, PlusSquare, ExternalLink, AlertTriangle } from 'lucide-react';
import hongsiAvatar from '../assets/hongsi_avatar.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isKakao, setIsKakao] = useState<boolean>(false);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone app mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect User Agent
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    const isKakaoTalk = /kakaotalk/i.test(ua);
    setIsKakao(isKakaoTalk);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleOpenExternal = () => {
    const currentUrl = window.location.href;
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
  };

  const handleInstallClick = async () => {
    if (isKakao) {
      handleOpenExternal();
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          onClose();
        }
        setDeferredPrompt(null);
      } catch (err) {
        setShowManualGuide(true);
      }
    } else {
      setShowManualGuide(true);
    }
  };

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hongsi App Icon Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="relative">
            <img
              src={hongsiAvatar}
              alt="홍시폰 앱 아이콘"
              className="w-18 h-18 rounded-2xl shadow-lg ring-4 ring-orange-100 dark:ring-orange-950 mb-3 object-contain"
            />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-[#EF4444] text-white text-[10px] font-black rounded-md shadow-xs">
              V2.0
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
            홍시폰 스마트폰 앱 설치
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            와이파이·위치 상관없이 내 폰에서 바로 실행!
          </p>
        </div>

        {/* Benefits Checklist */}
        <div className="bg-orange-50/80 dark:bg-orange-950/40 rounded-2xl p-3.5 mb-5 space-y-2 border border-orange-100 dark:border-orange-900/40 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
            <CheckCircle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>주소창 없이 <strong>100% 전체화면 앱</strong>으로 구동</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
            <CheckCircle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>LTE/5G·오프라인에서도 <strong>홈 화면 아이콘</strong>으로 즉시 실행</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
            <CheckCircle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>앱스토어 승인 불필요, 터치 한 번으로 다운로드</span>
          </div>
        </div>

        {isInstalled ? (
          <div className="text-center py-3">
            <div className="inline-flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-4 h-4" />
              <span>이미 스마트폰에 설치된 앱입니다!</span>
            </div>
          </div>
        ) : isKakao ? (
          /* KakaoTalk In-App Browser Guide */
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center space-x-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>카카오톡 안에서는 앱 설치가 제한됩니다</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/80">
                카카오톡 브라우저에서는 스마트폰 앱 설치가 차단되어 있습니다. 아래 버튼을 눌러 <strong>삼성 인터넷 또는 크롬</strong>으로 열어주세요!
              </p>
            </div>

            <button
              onClick={handleOpenExternal}
              className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-slate-900 font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <ExternalLink className="w-4 h-4" />
              <span>크롬 / 삼성 인터넷으로 열고 설치</span>
            </button>

            <p className="text-[11px] text-center text-slate-400">
              또는 우측 하단 <strong>⋮(더보기)</strong> ➡️ <strong>'다른 브라우저로 열기'</strong> 터치
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Safari Guide */
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>🍎 아이폰(iOS) 설치 안내:</span>
              </p>
              <div className="flex items-start space-x-2">
                <span className="font-black text-orange-600">1.</span>
                <span>하단 도구막대의 <strong>공유 버튼</strong> (<Share className="inline w-3.5 h-3.5" />) 터치</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-black text-orange-600">2.</span>
                <span>스크롤을 내려 <strong>'홈 화면에 추가'</strong> (<PlusSquare className="inline w-3.5 h-3.5" />) 선택</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#5C4028] text-white font-bold text-xs shadow-md"
            >
              확인했습니다
            </button>
          </div>
        ) : (
          /* Android / Samsung Galaxy / Chrome */
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>내 스마트폰에 앱 다운로드 & 설치</span>
            </button>

            {showManualGuide && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/40 rounded-xl border border-orange-200 dark:border-orange-800 text-xs text-slate-700 dark:text-slate-200 space-y-2 animate-in fade-in slide-in-from-top-1">
                <p className="font-bold text-orange-800 dark:text-orange-300">
                  📱 수동 설치 안내 (1초 완료):
                </p>
                <p className="text-[11px] leading-relaxed">
                  브라우저 메뉴(우측 상단 <strong>⋮</strong> 또는 하단 <strong>☰</strong>)를 누르신 후 <strong>[홈 화면에 추가]</strong> 또는 <strong>[앱 설치]</strong>를 눌러주시면 즉시 홈 화면에 생성됩니다!
                </p>
              </div>
            )}

            <p className="text-[11px] text-center text-slate-400">
              삼성 인터넷 / 크롬 브라우저에서 '설치'를 누르면 즉시 완료됩니다.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

