import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import WorkspacePage from './pages/WorkspacePage';

type Page = 'landing' | 'workspace';

export default function App() {
  const [page, setPage] = useState<Page>('landing');

  if (page === 'landing') {
    return <LandingPage onLogin={() => setPage('workspace')} />;
  }

  return <WorkspacePage onLogout={() => setPage('landing')} />;
}
