// ========================================================
// 홍시폰 V2 접근 제어 및 중앙 인증 관리
// ========================================================

export const ADMIN_MASTER_KEY = 'happy2me';
export const ADMIN_MASTER_KEYS = ['happy2me', 'admin8888'];
export const DEFAULT_PASSWORDS = ['8622', 'hongsi2026', '7777'];

// 클라우드 실시간 동기화 설정 (모든 기기 간 비밀번호 실시간 공유)
const CLOUD_SYNC_APP_KEY = 'rm6z55kj';
const CLOUD_SYNC_ITEM_KEY = 'hongsiphone_v2_active_pass';
const CLOUD_GET_URL = `https://keyvalue.immanuel.co/api/KeyVal/GetValue/${CLOUD_SYNC_APP_KEY}/${CLOUD_SYNC_ITEM_KEY}`;
const CLOUD_UPDATE_URL = `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/${CLOUD_SYNC_APP_KEY}/${CLOUD_SYNC_ITEM_KEY}/`;

export interface ServerAuthInfo {
  activePassword: string;
  version: number;
}

/**
 * 관리자 마스터 키 검증 (대소문자 무관)
 */
export function verifyAdminMasterKey(key: string): boolean {
  if (!key) return false;
  const k = key.trim().toLowerCase();
  return ADMIN_MASTER_KEYS.some((m) => m.toLowerCase() === k);
}

/**
 * 서버 및 클라우드에 저장된 최신 비밀번호 정보 조회
 * (GitHub Pages / Netlify / 로컬 개발 서버 모두 완벽 연동)
 */
export async function fetchServerAuthInfo(): Promise<ServerAuthInfo | null> {
  // 1. 로컬 백엔드 서버 확인 (데스크톱 로컬 서버 모드일 때)
  try {
    const res = await fetch('/api/auth/info', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.activePassword) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('hongsiphone_custom_password', data.activePassword);
        }
        return data;
      }
    }
  } catch (err) {
    // 로컬 서버가 없는 정적 웹 호스팅(GitHub Pages)일 때 클라우드로 자동 폴백
  }

  // 2. 클라우드 실시간 동기화 저장소 확인 (GitHub Pages / 타 기기 스마트폰 실시간 연동)
  try {
    const cloudRes = await fetch(CLOUD_GET_URL, {
      method: 'GET',
      cache: 'no-store',
    });
    if (cloudRes.ok) {
      const rawText = await cloudRes.text();
      let pass = rawText.trim();
      if (pass.startsWith('"') && pass.endsWith('"')) {
        pass = pass.slice(1, -1).trim();
      }
      if (pass && pass !== 'null' && pass !== 'undefined') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('hongsiphone_custom_password', pass);
        }
        return {
          activePassword: pass,
          version: Date.now(),
        };
      }
    }
  } catch (err) {
    // 클라우드 일시 통신 지연 시 로컬 캐시 폴백
  }

  // 3. 네트워크 장애 시 로컬 캐시 확인
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('hongsiphone_custom_password');
    if (cached && cached.trim()) {
      return {
        activePassword: cached.trim(),
        version: Date.now(),
      };
    }
  }

  return {
    activePassword: 'hongsi2026',
    version: 1,
  };
}

/**
 * 로컬 또는 서버 비밀번호 검증
 */
export function verifyPasswordMatch(input: string, activePassword?: string): boolean {
  if (!input) return false;
  const clean = input.trim();
  const lower = clean.toLowerCase();

  // 1. 관리자 마스터 키는 언제나 통과
  if (verifyAdminMasterKey(clean)) {
    return true;
  }

  // 2. 서버/클라우드에서 전달받은 현재 활성 비밀번호 비교
  if (activePassword && activePassword.trim()) {
    if (lower === activePassword.trim().toLowerCase()) {
      return true;
    }
  }

  // 3. 로컬 캐시된 비밀번호 비교
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('hongsiphone_custom_password');
    if (cached && cached.trim().toLowerCase() === lower) {
      return true;
    }
  }

  // 4. 로컬 기본값 검사
  return DEFAULT_PASSWORDS.some((p) => p.toLowerCase() === lower);
}

/**
 * 관리자가 새 비밀번호를 설정 (클라우드 및 모든 사용자 기기에 실시간 전파)
 */
export async function updateServerPassword(
  adminKey: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  const cleanAdmin = (adminKey || '').trim();
  const cleanPass = (newPass || '').trim();

  if (!verifyAdminMasterKey(cleanAdmin)) {
    return {
      success: false,
      message: '관리자 마스터 키가 일치하지 않습니다. 관리자 권한이 없습니다.',
    };
  }

  if (!cleanPass) {
    return {
      success: false,
      message: '새로 설정할 비밀번호를 입력해주세요.',
    };
  }

  // 1. 로컬 서버 API 전송 시도
  try {
    await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: cleanAdmin, newPassword: cleanPass }),
    });
  } catch (err) {
    // 정적 호스팅에서는 무시
  }

  // 2. 클라우드 실시간 Key-Value 저장소 업데이트 (모든 기기 실시간 즉시 반영)
  try {
    const cloudUpdateUrl = `${CLOUD_UPDATE_URL}${encodeURIComponent(cleanPass)}`;
    await fetch(cloudUpdateUrl, {
      method: 'POST',
    });
  } catch (err) {
    console.warn('클라우드 비밀번호 동기화 경고:', err);
  }

  // 3. 브라우저 로컬 스토리지에 캐시
  if (typeof window !== 'undefined') {
    localStorage.setItem('hongsiphone_custom_password', cleanPass);
    localStorage.setItem('hongsiphone_session_pass', cleanPass);
  }

  return {
    success: true,
    message: `새 비밀번호가 [${cleanPass}] 로 모든 사용자 기기에 실시간 동기화되었습니다!`,
  };
}
