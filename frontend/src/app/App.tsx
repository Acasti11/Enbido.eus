import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '@/shared/components/layout/Navbar';
import GlobalChatWindow from '@/features/chat/components/GlobalChatWindow';
import { AppProviders } from './providers';
import { AppRouter } from './router';

const useGameActive = () => {
  const [isGameActive, setIsGameActive] = useState(false);
  useEffect(() => {
    const check = () => setIsGameActive(localStorage.getItem('isGameActive') === 'true');
    check();
    window.addEventListener('game_state_changed', check);
    return () => window.removeEventListener('game_state_changed', check);
  }, []);
  return isGameActive;
};

const App: React.FC = (): React.JSX.Element => {
  console.log('[App.tsx] rendering');
  const isGameActive = useGameActive();
  return (
    <BrowserRouter>
      <AppProviders>
        <div className="app">
          <Navbar />
          <main className="app__main">
            <AppRouter />
          </main>
          {!isGameActive && <GlobalChatWindow />}
        </div>
      </AppProviders>
    </BrowserRouter>
  );
};

export default App;
