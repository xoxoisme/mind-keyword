import { useState, useEffect } from 'react';
import LoginPage from './LoginPage';

interface Props {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: Props) {
  const [showLogin, setShowLogin] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPatchNote, setShowPatchNote] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setShowUserMenu(false);
  };

  if (showLogin) {
    return <LoginPage onLogin={onLogin} onBack={() => setShowLogin(false)} />;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 우상단 - 로그인 상태에 따라 다르게 표시 */}
      <div style={{ position: 'absolute', top: 24, right: 32 }}>
        {isLoggedIn ? (
          <>
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px solid #ddd', background: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#555'; }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="7" r="3.5"/>
                <path d="M2 18c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </button>
            {showUserMenu && (
              <div
                onMouseLeave={() => setShowUserMenu(false)}
                style={{ position: 'absolute', top: 44, right: 0, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 120, padding: '4px 0', fontFamily: 'Paperlogy, sans-serif', zIndex: 100 }}
              >
                <div
                  onClick={handleLogout}
                  style={{ padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: '#e53935', textAlign: 'center' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >로그아웃</div>
              </div>
            )}
          </>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            style={{
              border: '1.5px solid #ddd', borderRadius: 20,
              background: '#fff', cursor: 'pointer',
              padding: '7px 16px', fontSize: 13, color: '#555',
              fontFamily: 'Paperlogy, sans-serif',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#555'; }}
          >로그인</button>
        )}
      </div>

      {/* 왼쪽 패치노트 */}
      <div style={{
        position: 'absolute',
        left: 40,
        bottom: 40,
        fontFamily: 'Paperlogy, sans-serif',
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.2s ease 0.8s',
      }}>
        <button
          onClick={() => setShowPatchNote((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: '1px solid #e0e0e0', borderRadius: 20,
            padding: '6px 14px', cursor: 'pointer', color: '#888',
            fontSize: 12, fontFamily: 'Paperlogy, sans-serif',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#888'; }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>PATCH NOTE</span>
          <span style={{ fontSize: 10, background: '#000', color: '#fff', borderRadius: 3, padding: '1px 6px', fontWeight: 600 }}>v0.1.0</span>
        </button>

        {showPatchNote && (
          <div style={{
            position: 'absolute', bottom: 40, left: 0,
            background: '#fff', border: '1px solid #e8e8e8',
            borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            padding: '18px 20px', width: 220,
          }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#aaa' }}>v0.1.0 — 현재 기능</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                '폴더로 파일 분류',
                '키워드 마인드맵 작성',
                '키보드 단축키 지원',
                'AI PDF → 마인드맵 변환',
              ].map((text) => (
                <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#bbb', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#555', lineHeight: 1.4 }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 중앙 타이틀 */}
      <div style={{
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease',
      }}>
        <h1 style={{
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: '-2px',
          color: '#000',
          margin: 0,
          lineHeight: 1.1,
          fontFamily: 'Paperlogy, sans-serif',
        }}>
          Mind
        </h1>
        <h1 style={{
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: '-2px',
          color: '#000',
          margin: 0,
          lineHeight: 1.1,
          fontFamily: 'Paperlogy, sans-serif',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.9s ease 0.3s, transform 0.9s ease 0.3s',
        }}>
          Keyword
        </h1>
        <p style={{
          marginTop: 20,
          fontSize: 16,
          color: '#888',
          fontFamily: 'Paperlogy, sans-serif',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.9s ease 0.6s',
        }}>
          생각을 연결하세요
        </p>
      </div>

      {/* presented by */}
      <p style={{
        position: 'absolute',
        bottom: 40,
        right: 40,
        margin: 0,
        fontSize: 11,
        color: '#bbb',
        fontFamily: 'Paperlogy, sans-serif',
        letterSpacing: 0.5,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.2s ease 0.8s',
      }}>presented by Kwontae</p>

      {/* → 버튼 - 하단 */}
      <button
        onClick={() => isLoggedIn ? onLogin() : setShowLogin(true)}
        style={{
          position: 'absolute',
          bottom: 60,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '1.5px solid #000',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          transition: 'background 0.2s, color 0.2s',
          opacity: visible ? 1 : 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </button>
    </div>
  );
}
