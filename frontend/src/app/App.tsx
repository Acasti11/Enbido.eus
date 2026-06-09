import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '@/shared/components/layout/Navbar';
import GlobalChatWindow from '@/features/chat/components/GlobalChatWindow';
import { AppProviders } from './providers';
import { AppRouter } from './router';

const App: React.FC = (): React.JSX.Element => {
  return (
    <BrowserRouter>
      <AppProviders>
        <div className="app">
          <Navbar />
          <main className="app__main">
            <AppRouter />
          </main>
          <GlobalChatWindow />
        </div>
      </AppProviders>
    </BrowserRouter>
  );
};

export default App;
