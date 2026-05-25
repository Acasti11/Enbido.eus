import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
// Fíjate en la palabra "type" que he añadido dentro de las llaves en estas dos líneas:
import MeetupAdCard, { type LocalMeetupAd } from './components/MeetupAdCard';
import CreateAdPage, { type CreateAdFormState } from './components/CreateAdPage';
import './styles/meetup-page.css';

const CONST_CURRENT_USER_ID = 999; 

const CONST_INITIAL_ADS: LocalMeetupAd[] = [
  { adId: 1, creatorId: 101, creatorName: 'Juan Perez', location: 'Taverna El Botxo', missingPlayers: 2, description: 'Buscamos 2 personas para jugar. Pagamos cañas.', isActive: true },
  { adId: 2, creatorId: 102, creatorName: 'Maria Garcia', location: 'Bar Zabaleta', missingPlayers: 1, description: 'Falta uno para cerrar la mesa.', isActive: true }
];

const MeetupPage: React.FC = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [ads, setAds] = useState<LocalMeetupAd[]>(CONST_INITIAL_ADS);

  const handleNavigateToCreate = (): void => setCurrentView('create');
  const handleNavigateToList = (): void => setCurrentView('list');

  const handleSaveNewAd = (formData: CreateAdFormState): void => {
    const newAd: LocalMeetupAd = {
      adId: Math.floor(Math.random() * 1000),
      creatorId: CONST_CURRENT_USER_ID,
      creatorName: 'Tú (Jugador Actual)',
      location: formData.location,
      missingPlayers: Number(formData.missingPlayers),
      description: formData.description,
      isActive: true
    };
    
    setAds([newAd, ...ads]);
    handleNavigateToList();
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