import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/layout/Navbar';
import MeetupAdCard, { type LocalMeetupAd } from './components/MeetupAdCard';
import CreateAdPage, { type CreateAdFormState } from './components/CreateAdPage';
import './meetup-page.css';

const CONST_CURRENT_USER_ID = 1; // Assuming 1 for now or retrieve from auth context

const MeetupPage: React.FC = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [ads, setAds] = useState<LocalMeetupAd[]>([]);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/meetups');
      setAds(response.data);
    } catch (error) {
      console.error('Error fetching meetups', error);
    }
  };

  const handleNavigateToCreate = (): void => setCurrentView('create');
  const handleNavigateToList = (): void => setCurrentView('list');

  const handleSaveNewAd = async (formData: CreateAdFormState): Promise<void> => {
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).userId : CONST_CURRENT_USER_ID;

    const newAd = {
      creatorId: userId,
      location: formData.location,
      missingPlayers: Number(formData.missingPlayers),
      description: formData.description,
      isActive: true
    };
    
    try {
      await axios.post('http://localhost:8080/api/meetups', newAd);
      await fetchAds();
      handleNavigateToList();
    } catch (error) {
      console.error('Error creating meetup', error);
    }
  };

  return (
    <div className="page-container">
      <Navbar />

      <main className="page-content">
        {currentView === 'list' ? (
          <div>
            <header className="list-header">
              <div>
                <h1 className="list-title">Buscar Partida Física</h1>
                <p className="list-subtitle">Encuentra mesas con huecos libres cerca de ti</p>
              </div>
              <button className="btn-create-main" onClick={handleNavigateToCreate}>
                + Crear Anuncio
              </button>
            </header>
            
            <section className="grid-container">
              {ads.map((ad) => (
                <MeetupAdCard key={ad.adId} ad={ad} />
              ))}
            </section>
          </div>
        ) : (
          <CreateAdPage 
            onCancel={handleNavigateToList} 
            onSubmit={handleSaveNewAd} 
          />
        )}
      </main>
    </div>
  );
};

export default MeetupPage;