import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import '../styles/meetup-ad-card.css';
import { useChatWebSocket } from '../../../context/ChatWebSocketContext';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';

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

  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.userId || 0;
  const { t } = useTranslation();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // WebSocket Chat Context
  const { joinMeetup, leaveMeetup, registerMeetupCallback, unregisterMeetupCallback, sendMeetupMessage } = useChatWebSocket();

  const handleContactOrganizer = () => {
    if (!isAuthenticated) {
      alert(t('meetup.loginToContact'));
      return;
    }
    const target = {
      id: adState.creatorId,
      username: adState.creatorName,
      elo: 1000 + Math.floor(Math.random() * 400),
      totalGamesPlayed: 12,
      totalGamesWon: 5
    };
    sessionStorage.setItem('enbido_open_dm_target', JSON.stringify(target));
    navigate('/jugar');
  };

  const fetchParticipants = async () => {
    try {
      const res = await api.get(`/meetups/${adState.adId}/participants`);
      setParticipants(res.data);
      const joined = res.data.some((p: any) => p.userId === currentUserId);
      setHasJoined(joined);
    } catch (err) {
      console.error(t('meetup.errorFetchParticipants'), err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/meetups/${adState.adId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(t('meetup.errorFetchMessages'), err);
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
    if (!isAuthenticated) {
      alert(t('meetup.loginToJoin'));
      return;
    }
    try {
      const res = await api.post(`/meetups/${adState.adId}/join`);
      setAdState(res.data);
      setHasJoined(true);
      fetchParticipants();
    } catch (err: any) {
      console.error(t('meetup.errorJoin'), err);
      alert(err.response?.data || t('meetup.errorJoin'));
    }
  };

  const handleLeave = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.post(`/meetups/${adState.adId}/leave`);
      setAdState(res.data);
      setHasJoined(false);
      fetchParticipants();
    } catch (err: any) {
      console.error(t('meetup.errorLeave'), err);
      alert(err.response?.data || t('meetup.errorLeave'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('meetup.confirmDelete'))) return;
    try {
      await api.delete(`/meetups/${adState.adId}`);
      if (onDelete) {
        onDelete(adState.adId);
      }
    } catch (err: any) {
      console.error(t('meetup.errorDelete'), err);
      alert(t('meetup.errorDelete'));
    }
  };

  const handleShare = () => {
    const dateFormatted = adState.scheduledAt
      ? formatScheduledDate(adState.scheduledAt)
      : t('meetup.dateTBD');
    const text = t('meetup.shareText', {
      location: adState.location,
      date: dateFormatted,
      count: adState.missingPlayers,
      url: `${window.location.origin}/meetups`
    });

    navigator.clipboard.writeText(text)
      .then(() => alert(t('meetup.shareCopied')))
      .catch(() => alert(t('meetup.shareCopyError')));
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
      case 'TXOKO': return t('meetup.txoko');
      case 'CAFE': return t('meetup.cafe');
      case 'OUTDOOR': return t('meetup.outdoor');
      case 'BAR':
      default:
        return t('meetup.bar');
    }
  };

  const formatScheduledDate = (dateStr: string | undefined) => {
    if (!dateStr) return t('meetup.dateTBD');
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
          <h2 className="ad-card__location">
            <span>{getEstablishmentIcon(adState.establishmentType)}</span>
            <span>{adState.location}</span>
          </h2>
          <span className="establishment-type-tag">
            {getEstablishmentLabel(adState.establishmentType)}
          </span>
        </div>

        <div className="ad-card__meta-info">
          <span>{t('meetup.organizedBy', { name: adState.creatorName })}</span>
          {adState.scheduledAt && (
            <span className="ad-card__date-tag">
              📅 {formatScheduledDate(adState.scheduledAt)}
            </span>
          )}
        </div>
      </div>

      <div className="ad-card__body">
        <span className="ad-card__players">
          {isFull ? t('meetup.tableFull') : t('meetup.missingPlayers', { count: adState.missingPlayers })}
        </span>
        <p className="ad-card__desc">{adState.description}</p>
      </div>

      <div className="ad-card__actions">
        {hasJoined ? (
          <>
            <button className="btn-join btn-joined" disabled>
              {t('meetup.joined')}
            </button>
            <button className="btn-leave-meetup" onClick={handleLeave}>
              {t('meetup.leaveTable')}
            </button>
          </>
        ) : (
          <button
            className="btn-join"
            onClick={handleJoin}
            disabled={isCreator || isFull || !isAuthenticated}
          >
            {isCreator
              ? t('meetup.organizer')
              : isFull
                ? t('meetup.tableFull')
                : t('meetup.joinTable')}
          </button>
        )}

        {isCreator && (
          <button className="btn-delete-meetup" onClick={handleDelete} title={t('meetup.confirmDelete')}>
            {t('meetup.delete')}
          </button>
        )}

        {adState.latitude && adState.longitude && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${adState.latitude},${adState.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-maps-link"
            title={t('meetup.howToGetThere')}
          >
            {t('meetup.howToGetThere')}
          </a>
        )}

        <button className="btn-chat-toggle btn-share-link" onClick={handleShare} title={t('meetup.share')}>
          {t('meetup.share')}
        </button>

        {!isCreator && (
          <button
            type="button"
            className="btn-chat-toggle btn-chat-contact"
            onClick={handleContactOrganizer}
            title={t('meetup.contact')}
          >
            {t('meetup.contact')}
          </button>
        )}
        {(hasJoined || isCreator) && (
          <button
            className="btn-chat-toggle"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            {t('meetup.chat')} {isChatOpen ? '▲' : '▼'}
          </button>
        )}
      </div>

      {isChatOpen && (hasJoined || isCreator) && (
        <div className="meetup-chat-section">
          <h5 className="meetup-chat-title">{t('meetup.playersInTable')}</h5>
          <div className="meetup-participants-list">
            <span className="participant-chip participant-chip--creator">
              👑 {adState.creatorName} ({t('meetup.creator')})
            </span>
            {participants.map((p) => (
              <span key={p.id} className="participant-chip">
                👤 {p.user ? p.user.name : t('meetup.userNumber', { num: p.userId })}
              </span>
            ))}
          </div>

          <h5 className="meetup-chat-title">{t('meetup.liveChat')}</h5>
          <div className="meetup-chat-window">
            {messages.length === 0 ? (
              <div className="meetup-chat-empty">
                {t('meetup.noMessages')}
              </div>
            ) : (
              messages.map((m) => {
                const isMsgFromMe = m.userId === currentUserId;
                const isMsgFromCreator = m.userId === adState.creatorId;
                const senderName = isMsgFromMe
                  ? t('meetup.you')
                  : m.user ? m.user.name : t('meetup.userNumber', { num: m.userId });

                return (
                  <div
                    key={m.messageId}
                    className={`meetup-message-row ${isMsgFromMe ? 'meetup-message-row--me' : ''}`}
                  >
                    <span className={`meetup-message-sender ${isMsgFromCreator ? 'meetup-message-sender--creator' : ''}`}>
                      {senderName} {isMsgFromCreator ? `(${t('meetup.creator')})` : ''}
                    </span>
                    <span className="meetup-message-text">{m.content}</span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {isAuthenticated ? (
            <form onSubmit={handleSendMessage} className="meetup-chat-form">
              <input
                type="text"
                className="meetup-chat-input"
                placeholder={t('meetup.writeMessage')}
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                maxLength={250}
              />
              <button type="submit" className="btn-send-message">{t('meetup.send')}</button>
            </form>
          ) : (
            <div className="meetup-chat-login-warning">
              {t('meetup.loginToChat')}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default MeetupAdCard;