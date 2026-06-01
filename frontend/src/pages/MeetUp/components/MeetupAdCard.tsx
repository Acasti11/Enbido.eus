import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import '../styles/meetup-ad-card.css';
import { useChatWebSocket } from '../../../context/ChatWebSocketContext';

export interface LocalMeetupAd {
  adId: number;
  creatorId: number;
  creatorName: string;
  location: string;
  missingPlayers: number;
  description: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  scheduledAt?: string;
  establishmentType?: string;
}

interface MeetupCardProps {
  ad: LocalMeetupAd;
  isHighlighted?: boolean;
  onDelete?: (adId: number) => void;
}

const MeetupAdCard: React.FC<MeetupCardProps> = ({ ad, isHighlighted, onDelete }): React.JSX.Element => {
  const navigate = useNavigate();
  const [adState, setAdState] = useState<LocalMeetupAd>(ad);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  const currentUserId = Number(localStorage.getItem('userId') || '0');
  const isLoggedIn = !!localStorage.getItem('token');

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // WebSocket Chat Context
  const { joinMeetup, leaveMeetup, registerMeetupCallback, unregisterMeetupCallback, sendMeetupMessage } = useChatWebSocket();

  const handleContactOrganizer = () => {
    if (!isLoggedIn) {
      alert('Debes iniciar sesión para contactar en privado');
      return;
    }
    const target = {
      id: adState.creatorId,
      username: adState.creatorName,
      elo: 1000 + Math.floor(Math.random() * 400),
      totalGamesPlayed: 12,
      totalGamesWon: 5
    };
    localStorage.setItem('enbido_open_dm_target', JSON.stringify(target));
    navigate('/jugar');
  };

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
    if (isChatOpen) {
      fetchParticipants();
      fetchMessages();

      // Unirse a la sala de la quedada por WebSocket
      joinMeetup(adState.adId);

      // Registrar callback para recibir mensajes en tiempo real
      registerMeetupCallback((newMsg: any) => {
        if (newMsg.adId === adState.adId) {
          setMessages((prev) => {
            const exists = prev.some(m => m.messageId === newMsg.messageId);
            if (exists) return prev;
            return [...prev, newMsg];
          });
        }
      });
    } else {
      leaveMeetup(adState.adId);
      unregisterMeetupCallback();
    }

    return () => {
      leaveMeetup(adState.adId);
      unregisterMeetupCallback();
    };
  }, [isChatOpen, adState.adId, joinMeetup, leaveMeetup, registerMeetupCallback, unregisterMeetupCallback]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      alert('Debes iniciar sesión para unirse a una mesa');
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

  const handleLeave = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await api.post(`/meetups/${adState.adId}/leave`);
      setAdState(res.data);
      setHasJoined(false);
      fetchParticipants();
    } catch (err: any) {
      console.error('Error leaving meetup:', err);
      alert(err.response?.data || 'Error al abandonar la mesa');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que deseas cancelar y eliminar esta quedada?')) return;
    try {
      await api.delete(`/meetups/${adState.adId}`);
      if (onDelete) {
        onDelete(adState.adId);
      }
    } catch (err: any) {
      console.error('Error deleting meetup:', err);
      alert('Error al eliminar la quedada');
    }
  };

  const handleShare = () => {
    const dateFormatted = adState.scheduledAt
      ? formatScheduledDate(adState.scheduledAt)
      : 'Fecha por coordinar';
    const text = `¡Aupa! He organizado una quedada para jugar al Mus en ${adState.location} el ${dateFormatted}. ¡Faltan ${adState.missingPlayers} jugadores! Apúntate aquí en Enbido: ${window.location.origin}/meetups`;

    navigator.clipboard.writeText(text)
      .then(() => alert('¡Mensaje para compartir copiado al portapapeles!'))
      .catch(() => alert('No se pudo copiar al portapapeles'));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    sendMeetupMessage(adState.adId, newMessageText.trim());
    setNewMessageText('');
  };

  const isCreator = adState.creatorId === currentUserId;
  const isFull = adState.missingPlayers <= 0;

  const getEstablishmentIcon = (type: string | undefined) => {
    switch (type) {
      case 'TXOKO': return '🍽️';
      case 'CAFE': return '☕';
      case 'OUTDOOR': return '🌳';
      case 'BAR':
      default:
        return '🍻';
    }
  };

  const getEstablishmentLabel = (type: string | undefined) => {
    switch (type) {
      case 'TXOKO': return 'Sociedad / Txoko';
      case 'CAFE': return 'Cafetería';
      case 'OUTDOOR': return 'Exterior / Parque';
      case 'BAR':
      default:
        return 'Taberna / Bar';
    }
  };

  const formatScheduledDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Fecha por coordinar';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <article className={`ad-card ${isHighlighted ? 'map-highlighted' : ''}`} id={`ad-card-${adState.adId}`}>
      <div className="ad-card__header">
        <div className="ad-card__header-top">
          <h3 className="ad-card__location">
            <span>{getEstablishmentIcon(adState.establishmentType)}</span>
            <span>{adState.location}</span>
          </h3>
          <span className="establishment-type-tag">
            {getEstablishmentLabel(adState.establishmentType)}
          </span>
        </div>

        <div className="ad-card__meta-info">
          <span>Organizado por: <strong>{adState.creatorName}</strong></span>
          {adState.scheduledAt && (
            <span className="ad-card__date-tag">
              📅 {formatScheduledDate(adState.scheduledAt)}
            </span>
          )}
        </div>
      </div>

      <div className="ad-card__body">
        <span className="ad-card__players">
          {isFull ? '✅ Mesa Completa' : `⚠️ Faltan ${adState.missingPlayers} jugadores`}
        </span>
        <p className="ad-card__desc">{adState.description}</p>
      </div>

      <div className="ad-card__actions">
        {hasJoined ? (
          <>
            <button className="btn-join btn-joined" disabled>
              ✓ Te has unido
            </button>
            <button className="btn-leave-meetup" onClick={handleLeave}>
              ❌ Salir
            </button>
          </>
        ) : (
          <button
            className="btn-join"
            onClick={handleJoin}
            disabled={isCreator || isFull || !isLoggedIn}
          >
            {isCreator
              ? 'Organizador'
              : isFull
                ? 'Mesa Completa'
                : 'Unirse a la mesa'}
          </button>
        )}

        {isCreator && (
          <button className="btn-delete-meetup" onClick={handleDelete} title="Eliminar anuncio de quedada">
            ❌ Eliminar
          </button>
        )}

        {adState.latitude && adState.longitude && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${adState.latitude},${adState.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-maps-link"
            title="Abrir ruta en Google Maps"
          >
            📍 Cómo llegar
          </a>
        )}

        <button className="btn-chat-toggle btn-share-link" onClick={handleShare} title="Copiar invitación al portapapeles">
          🔗 Compartir
        </button>

        {!isCreator && (
          <button
            type="button"
            className="btn-chat-toggle btn-chat-contact"
            onClick={handleContactOrganizer}
            title="Escribir mensaje privado al organizador"
          >
            💬 Contactar
          </button>
        )}
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
              <div className="meetup-chat-empty">
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
            <div className="meetup-chat-login-warning">
              Inicia sesión para poder chatear
            </div>
          )}
        </section>
      )}
    </article>
  );
};

export default MeetupAdCard;