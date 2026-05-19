import React from 'react';
import Navbar from '../../components/layout/Navbar';
import ProfileCard from './components/ProfileCard';
import BackgroundCards from './components/BackgroundCards';
import ChatWidget from './components/ChatWidget';
import './profile-page.css';

const ProfilePage: React.FC = (): React.JSX.Element => {
  return (
    <div className="profile-page">
      <BackgroundCards />
      <Navbar />
      <main className="profile-page__main">
        <ProfileCard />
      </main>
      <ChatWidget />
    </div>
  );
};

export default ProfilePage;
