import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import WorkspacePage from './pages/WorkspacePage';

type Page = 'landing' | 'workspace';

export default function App() {
  const [page, setPage] = useState<Page>('landing');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', '/');
      setPage('workspace');
    }
  }, []);

  if (page === 'landing') {
    return <LandingPage onLogin={() => setPage('workspace')} />;
  }

  return <WorkspacePage onLogout={() => setPage('landing')} onHome={() => setPage('landing')} />;
}
