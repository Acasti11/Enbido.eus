import React, { useState, useEffect } from 'react';
// Fíjate en la palabra "type" que he añadido dentro de las llaves en estas dos líneas:
import MeetupAdCard, { type LocalMeetupAd } from './components/MeetupAdCard';
import CreateAdPage, { type CreateAdFormState } from './components/CreateAdPage';
import api from '../../services/api';
import './styles/meetup-page.css';

const MeetupPage: React.FC = (): React.JSX.Element => {
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [ads, setAds] = useState<LocalMeetupAd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Obtener datos del usuario real autenticado
  const username = localStorage.getItem('username') || 'Tú (Jugador Actual)';

  useEffect(() => {
    const fetchMeetups = async () => {
      try {
        setLoading(true);
        const res = await api.get('/meetups');
        const mapped = res.data.map((ad: any) => ({
          adId: ad.adId,
          creatorId: ad.creatorId,
          creatorName: ad.creator ? ad.creator.name : 'Usuario',
          location: ad.location,
          missingPlayers: ad.missingPlayers,
          description: ad.description,
          isActive: ad.isActive
        }));
        setAds(mapped);
      } catch (err) {
        console.error('Error fetching physical meetups:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetups();
  }, []);

  const handleNavigateToCreate = (): void => setCurrentView('create');
  const handleNavigateToList = (): void => setCurrentView('list');

  const handleSaveNewAd = async (formData: CreateAdFormState): Promise<void> => {
    try {
      const payload = {
        location: formData.location,
        missingPlayers: Number(formData.missingPlayers),
        description: formData.description,
      };

      const res = await api.post('/meetups', payload);
      const saved = res.data;

      const newAd: LocalMeetupAd = {
        adId: saved.adId,
        creatorId: saved.creatorId,
        creatorName: `${username} (Tú)`,
        location: saved.location,
        missingPlayers: saved.missingPlayers,
        description: saved.description,
        isActive: saved.isActive
      };
      
      setAds([newAd, ...ads]);
      handleNavigateToList();
    } catch (err) {
      console.error('Error saving meetup to DB:', err);
      alert('Inicia sesión para poder crear anuncios de quedadas');
    }
  };

  return (
    <div className="page-container">
      <main className="page-content">
        {loading ? (
          <div style={{ color: '#fff', textAlign: 'center', marginTop: '40px' }}>Kargatzen / Cargando...</div>
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  );
};

export default MeetupPage;