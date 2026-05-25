import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import LoginPage from './pages/LoginPage/LoginPage';
import MeetupPage from './pages/MeetUp/MeetupPage';
import TournamentPage from './pages/TournamentPage/TournamentPage';
import MusGamePage from './pages/MusGamePage/MusGamePage';

const NotFound: React.FC = () => <div className="page"><h1>404 - Página no encontrada</h1></div>;

const App: React.FC = (): React.JSX.Element => {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="app__main">
          <Routes>
            <Route path="/" element={<MusGamePage/>} />
            <Route path="/jugar" element={<MusGamePage />} />
            <Route path="/torneos" element={<TournamentPage />} />
            <Route path="/quedadas" element={<MeetupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;