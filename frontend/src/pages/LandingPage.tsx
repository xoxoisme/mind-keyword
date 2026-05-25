import { useState, useEffect } from 'react';
import LoginPage from './LoginPage';

interface Props {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: Props) {
  const [showLogin, setShowLogin] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const isLoggedIn = !!localStorage.getItem('token');

  if (showLogin) {
    return <LoginPage onLogin={onLogin} onBack={() => setShowLogin(false)} />;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => isLoggedIn ? onLogin() : setShowLogin(true)}
        style={{
          position: 'absolute',
          top: 24,
          right: 32,
          padding: '10px 24px',
          border: '1.5px solid #000',
          borderRadius: 24,
          background: '#fff',
          fontSize: 14,
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = '#000';
          (e.target as HTMLButtonElement).style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = '#fff';
          (e.target as HTMLButtonElement).style.color = '#000';
        }}
      >
        {isLoggedIn ? '시작하기' : '로그인'}
      </button>

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
    </div>
  );
}
