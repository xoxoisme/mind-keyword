import { useState } from 'react';
import { login, signup, sendVerificationCode, confirmVerificationCode } from '../api/auth';

interface Props {
  onLogin: () => void;
  onBack?: () => void;
}

const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  border: '1px solid #e0e0e0',
  borderRadius: 12,
  fontSize: 15,
  outline: 'none',
  fontFamily: 'Paperlogy, sans-serif',
  transition: 'border-color 0.2s',
  width: '100%',
  boxSizing: 'border-box',
};

export default function LoginPage({ onLogin, onBack }: Props) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 이메일 인증 상태
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);

  const resetSignupState = () => {
    setCodeSent(false);
    setCode('');
    setVerified(false);
    setSendingCode(false);
    setConfirmingCode(false);
  };

  const handleSendCode = async () => {
    if (!email) { setError('이메일을 입력해주세요.'); return; }
    setError('');
    setSendingCode(true);
    try {
      await sendVerificationCode(email);
      setCodeSent(true);
      setVerified(false);
      setCode('');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '인증 코드 전송에 실패했습니다.';
      setError(msg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!code) { setError('인증 코드를 입력해주세요.'); return; }
    setError('');
    setConfirmingCode(true);
    try {
      await confirmVerificationCode(email, code);
      setVerified(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '인증 코드가 올바르지 않습니다.';
      setError(msg);
    } finally {
      setConfirmingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignup) {
        await signup(email, password, nickname);
        resetSignupState();
        setIsSignup(false);
      } else {
        const { accessToken, refreshToken } = await login(email, password);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        onLogin();
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      if (isSignup) {
        setError(msg ?? '회원가입에 실패했습니다.');
      } else {
        setError('이메일 또는 비밀번호를 확인해주세요.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fff' }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute', top: 24, left: 32,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: '#aaa', lineHeight: 1,
          }}
        >
          ←
        </button>
      )}

      <div style={{
        margin: 'auto',
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 6px', letterSpacing: 1 }}>MIND KEYWORD</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#000', fontFamily: 'Paperlogy, sans-serif' }}>
            {isSignup ? '회원가입' : '로그인'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 이메일 + 인증 코드 발송 버튼 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="이메일"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (isSignup) { setCodeSent(false); setVerified(false); setCode(''); } }}
            />
            {isSignup && (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || !email}
                style={{
                  padding: '12px 14px',
                  background: verified ? '#e8f5e9' : '#000',
                  color: verified ? '#388e3c' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 13,
                  fontFamily: 'Paperlogy, sans-serif',
                  fontWeight: 600,
                  cursor: sendingCode || !email ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: sendingCode || !email ? 0.5 : 1,
                }}
              >
                {verified ? '인증완료' : codeSent ? '재발송' : '코드 발송'}
              </button>
            )}
          </div>

          {/* 인증 코드 입력 */}
          {isSignup && codeSent && !verified && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1, letterSpacing: 4 }}
                placeholder="인증 코드 6자리"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleConfirmCode}
                disabled={confirmingCode || code.length !== 6}
                style={{
                  padding: '12px 14px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 13,
                  fontFamily: 'Paperlogy, sans-serif',
                  fontWeight: 600,
                  cursor: confirmingCode || code.length !== 6 ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: confirmingCode || code.length !== 6 ? 0.5 : 1,
                }}
              >
                인증 확인
              </button>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <input
              style={inputStyle}
              placeholder="비밀번호"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 13, fontFamily: 'Paperlogy, sans-serif', padding: 0 }}
            >
              {showPassword ? '숨기기' : '보기'}
            </button>
          </div>
          {isSignup && (
            <input
              style={inputStyle}
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          )}
          {error && (
            <span style={{ fontSize: 13, color: '#e53e3e' }}>{error}</span>
          )}
          <button
            type="submit"
            disabled={isSignup && !verified}
            style={{
              marginTop: 8,
              padding: '13px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontFamily: 'Paperlogy, sans-serif',
              fontWeight: 600,
              cursor: isSignup && !verified ? 'not-allowed' : 'pointer',
              opacity: isSignup && !verified ? 0.4 : 1,
            }}
          >
            {isSignup ? '가입하기' : '로그인'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setIsSignup(!isSignup); setError(''); resetSignupState(); }}
          style={{
            marginTop: 16,
            background: 'none',
            border: 'none',
            fontSize: 13,
            color: '#888',
            cursor: 'pointer',
            fontFamily: 'Paperlogy, sans-serif',
          }}
        >
          {isSignup ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
          <div style={{ flex: 1, height: 1, background: '#eee' }} />
          <span style={{ fontSize: 12, color: '#ccc', fontFamily: 'Paperlogy, sans-serif' }}>또는</span>
          <div style={{ flex: 1, height: 1, background: '#eee' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
          <button
            type="button"
            title="Google로 로그인"
            onClick={() => { window.location.href = 'http://localhost:8080/oauth2/authorization/google'; }}
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#fff', border: '1px solid #ddd',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </button>

          <button
            type="button"
            title="네이버로 로그인"
            onClick={() => { window.location.href = 'http://localhost:8080/oauth2/authorization/naver'; }}
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#03C75A', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
