import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHongsiPhone } from '../context/HongsiPhoneContext';
import { Key, X, Check, Eye, EyeOff, ExternalLink, AlertCircle, Lock } from 'lucide-react';
import { testGeminiApiKey } from '../services/geminiService';
import { updateServerPassword } from '../config/authConfig';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { state, setApiKey } = useHongsiPhone();
  const [inputKey, setInputKey] = useState(state.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = typeof window !== 'undefined' ? (localStorage.getItem('hongsiphone_gemini_api_key') || state.apiKey || '') : state.apiKey;
      setInputKey(stored);
      setTestResult(null);
    }
  }, [isOpen, state.apiKey]);

  // Access Password change state (Admin only)
  const [adminKey, setAdminKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passSaveResult, setPassSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (inputKey.trim() && inputKey.trim() !== state.apiKey) {
      setApiKey(inputKey.trim());
      localStorage.setItem('hongsiphone_gemini_api_key', inputKey.trim());
    }
    onClose();
  };

  const handleSave = () => {
    setApiKey(inputKey.trim());
    localStorage.setItem('hongsiphone_gemini_api_key', inputKey.trim());
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    setApiKey('');
    localStorage.removeItem('hongsiphone_gemini_api_key');
    setTestResult(null);
  };

  const handleSavePassword = async () => {
    const res = await updateServerPassword(adminKey, newPassword);
    setPassSaveResult(res);
    if (res.success) {
      setNewPassword('');
      setAdminKey('');
      setTimeout(() => setPassSaveResult(null), 4000);
    }
  };

  const handleTestKey = async () => {
    if (!inputKey.trim()) {
      setTestResult({ success: false, message: 'API 키를 먼저 입력해 주세요.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testGeminiApiKey(inputKey.trim());
    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      setApiKey(inputKey.trim());
      localStorage.setItem('hongsiphone_gemini_api_key', inputKey.trim());
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-[360px] bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-extrabold text-sm">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Key className="w-4 h-4" />
            </div>
            <span>Gemini AI API 키 설정</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          {state.apiKey ? (
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>실제 Gemini AI 활성화됨</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
              <span>로컬 분석 모드 (입력한 원문과 사진으로 직접 생성)</span>
            </div>
          )}
        </div>

        {/* API Key Input Field - ALWAYS PROMINENT AND VISIBLE */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Google Gemini API 키 입력
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#EF4444] font-semibold hover:underline inline-flex items-center space-x-0.5"
            >
              <span>키 발급</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy... 키를 여기에 붙여넣으세요"
              className="w-full pr-10 pl-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none focus:border-[#EF4444] transition"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Test Result Message Box */}
        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs mb-3 flex items-start space-x-2 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {testResult.success ? (
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            )}
            <span className="leading-tight break-all font-medium">{testResult.message}</span>
          </div>
        )}

        {/* Buttons (연결 테스트 / 저장 및 적용) */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={isTesting}
            className="py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs"
          >
            {isTesting ? '연결 확인 중...' : '연결 테스트'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-3 rounded-xl bg-[#EF4444] hover:bg-[#E12D2D] text-white font-extrabold text-xs shadow-md shadow-red-500/25 transition active:scale-[0.98]"
          >
            저장 및 적용
          </button>
        </div>

        {/* Delete key option */}
        {state.apiKey && (
          <button
            type="button"
            onClick={handleClear}
            className="mt-3 text-center text-xs text-slate-400 hover:text-red-500 py-1 transition"
          >
            키 삭제 (시뮬레이션 모드로 전환)
          </button>
        )}

        {/* Admin Only Password Management Section */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-left bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-red-500" />
              <span>접속 비밀번호 변경 (관리자 전용)</span>
            </label>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              마스터 키 필요
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 leading-tight">
            일반 사용자는 변경할 수 없으며, <strong>관리자 마스터 키</strong>를 입력해야만 새 비밀번호를 설정할 수 있습니다.
          </p>

          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">① 관리자 마스터 키</span>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="관리자 마스터 키 입력"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-red-500"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">② 일반 사용자에게 부여할 새 비밀번호</span>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 일반 비밀번호 입력"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleSavePassword}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black text-xs transition shrink-0 active:scale-95"
                >
                  변경 저장
                </button>
              </div>
            </div>
          </div>

          {passSaveResult && (
            <div
              className={`mt-2 p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 ${
                passSaveResult.success
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {passSaveResult.success ? (
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              )}
              <span>{passSaveResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
