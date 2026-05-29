import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import '../styles/meetup-ad-card.css';

export interface LocalMeetupAd {
  adId: number;
  creatorId: number;
  creatorName: string;
  location: string;
  missingPlayers: number;
  description: string;
  isActive: boolean;
}

interface MeetupCardProps {
  ad: LocalMeetupAd;
}

const MeetupAdCard: React.FC<MeetupCardProps> = ({ ad }): React.JSX.Element => {
  const [adState, setAdState] = useState<LocalMeetupAd>(ad);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  const currentUserId = Number(localStorage.getItem('userId') || '0');
  const currentUsername = localStorage.getItem('username') || 'Usuario';
  const isLoggedIn = !!localStorage.getItem('token');

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const fetchParticipants = async () => {
    try {
      const res = await api.get(`/meetups/${adState.adId}/participants`);
      setParticipants(res.data);
      const joined = res.data.some((p: any) => p.userId === currentUserId);
      setHasJoined(joined);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/meetups/${adState.adId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    let intervalId: any;
    if (isChatOpen) {
      fetchParticipants();
      fetchMessages();
      intervalId = setInterval(fetchMessages, 2500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      alert('Debes iniciar sesión para unirte a una mesa');
      return;
    }
    try {
      const res = await api.post(`/meetups/${adState.adId}/join`);
      setAdState(res.data);
      setHasJoined(true);
      fetchParticipants();
    } catch (err: any) {
      console.error('Error joining meetup:', err);
      alert(err.response?.data || 'Error al unirse');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    try {
      const res = await api.post(`/meetups/${adState.adId}/messages`, { content: newMessageText });
      setMessages((prev) => [...prev, {
        ...res.data,
        user: { username: currentUsername }
      }]);
      setNewMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const isCreator = adState.creatorId === currentUserId;
  const isFull = adState.missingPlayers <= 0;

  return (
    <article className="ad-card">
      <div className="ad-card__header">
        <h3 className="ad-card__location">{adState.location}</h3>
        <p className="ad-card__creator">
          Organizado por: <strong>{adState.creatorName}</strong>
        </p>
      </div>
      
      <div className="ad-card__body">
        <span className="ad-card__players">
          {isFull ? '✅ Mesa Completa' : `⚠️ Faltan ${adState.missingPlayers} jugadores`}
        </span>
        <p className="ad-card__desc">{adState.description}</p>
      </div>

      <div className="ad-card__actions">
        <button 
          className="btn-join" 
          onClick={handleJoin}
          disabled={hasJoined || isCreator || isFull || !isLoggedIn}
        >
          {hasJoined 
            ? '✓ Te has unido' 
            : isCreator 
              ? 'Organizador' 
              : isFull 
                ? 'Mesa Completa' 
                : 'Unirse a la mesa'}
        </button>
        {(hasJoined || isCreator) && (
          <button 
            className="btn-chat-toggle"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            💬 Chat {isChatOpen ? '▲' : '▼'}
          </button>
        )}
      </div>

      {isChatOpen && (hasJoined || isCreator) && (
        <section className="meetup-chat-section">
          <h5 className="meetup-chat-title">👥 Jugadores en esta mesa:</h5>
          <div className="meetup-participants-list">
            <span className="participant-chip participant-chip--creator">
              👑 {adState.creatorName} (Creador)
            </span>
            {participants.map((p) => (
              <span key={p.id} className="participant-chip">
                👤 {p.user ? p.user.name : `Usuario #${p.userId}`}
              </span>
            ))}
          </div>

          <h5 className="meetup-chat-title">💬 Chat en Vivo:</h5>
          <div className="meetup-chat-window">
            {messages.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '0.8rem', textAlign: 'center', margin: 'auto' }}>
                No hay mensajes aún. ¡Di algo para empezar!
              </div>
            ) : (
              messages.map((m) => {
                const isMsgFromMe = m.userId === currentUserId;
                const isMsgFromCreator = m.userId === adState.creatorId;
                const senderName = isMsgFromMe 
                  ? 'Tú' 
                  : m.user ? m.user.name : `Usuario #${m.userId}`;

                return (
                  <div 
                    key={m.messageId} 
                    className={`meetup-message-row ${isMsgFromMe ? 'meetup-message-row--me' : ''}`}
                  >
                    <span className={`meetup-message-sender ${isMsgFromCreator ? 'meetup-message-sender--creator' : ''}`}>
                      {senderName} {isMsgFromCreator ? '(Creador)' : ''}
                    </span>
                    <span className="meetup-message-text">{m.content}</span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {isLoggedIn ? (
            <form onSubmit={handleSendMessage} className="meetup-chat-form">
              <input 
                type="text" 
                className="meetup-chat-input"
                placeholder="Escribe un mensaje..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                maxLength={250}
              />
              <button type="submit" className="btn-send-message">Enviar</button>
            </form>
          ) : (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>
              Inicia sesión para poder chatear
            </div>
          )}
        </section>
      )}
    </article>
  );
};

export default MeetupAdCard;