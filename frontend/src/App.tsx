import React from 'react';
import LoginPage from './pages/LoginPage/LoginPage';
import './App.css';

const App: React.FC = (): React.JSX.Element => {
  return (
    <div className="app">
      <LoginPage />
    </div>
  );
};

export default App;