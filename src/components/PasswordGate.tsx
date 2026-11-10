import React, { useState } from 'react';
import { useHongsiPhone } from '../context/HongsiPhoneContext';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import hongsiAvatar from '../assets/hongsi_avatar.png';

export const PasswordGate: React.FC = () => {
  const { authenticate } = useHongsiPhone();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(true);
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await authenticate(password);
      if (!success) {
        setError(true);
        setErrorMessage('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
      } else {
        setError(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center items-center p-5 selection:bg-orange-100 selection:text-orange-900 font-sans">
      <div className="w-full max-w-[390px] bg-white dark:bg-slate-900 rounded-3xl p-7 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        
        {/* Hongsi Avatar with Safe Padded Ring */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-[#FFF8F1] dark:bg-slate-800 border-2 border-orange-200 dark:border-orange-900/60 p-1 flex items-center justify-center shadow-lg ring-4 ring-orange-100 dark:ring-orange-950">
            <img
              src={hongsiAvatar}
              alt="홍시"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-md">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Security Badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 text-xs font-bold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>보안 인증 스튜디오</span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          홍시폰 V2 스튜디오
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          보안을 위해 인증된 사용자만 이용할 수 있습니다.<br />
          발급받으신 <strong>접속 비밀번호</strong>를 입력해주세요.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="접속 비밀번호 입력"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={`w-full px-4 py-3.5 pr-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-hidden transition shadow-2xs ${
                error
                  ? 'border-red-400 ring-2 ring-red-100 dark:ring-red-950'
                  : 'border-slate-200 dark:border-slate-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-1.5 text-xs text-red-500 font-semibold text-left px-1 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:scale-98 text-white font-black text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
          >
            <span>스튜디오 접속하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 w-full text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            💡 비밀번호를 모르시는 경우 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

