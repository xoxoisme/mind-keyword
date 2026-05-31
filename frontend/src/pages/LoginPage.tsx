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
        const token = await login(email, password);
        localStorage.setItem('token', token);
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
      </div>
    </div>
  );
}
