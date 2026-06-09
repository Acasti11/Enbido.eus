import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/shared/lib/api';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { useChatWebSocket } from '@/features/chat/hooks/ChatWebSocketContext';
import type { LocalMeetupAd } from '../types/MeetupTypes';

export const useMeetupCard = (ad: LocalMeetupAd, onDelete?: (adId: number) => void) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.userId || 0;
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [adState, setAdState] = useState<LocalMeetupAd>(ad);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  const { joinMeetup, leaveMeetup, registerMeetupCallback, unregisterMeetupCallback, sendMeetupMessage } = useChatWebSocket();

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await api.get(`/meetups/${adState.adId}/participants`);
      setParticipants(res.data);
      const joined = res.data.some((p: any) => p.userId === currentUserId);
      setHasJoined(joined);
    } catch (err) {
      console.error(t('meetup.errorFetchParticipants'), err);
    }
  }, [adState.adId, currentUserId, t]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/meetups/${adState.adId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(t('meetup.errorFetchMessages'), err);
    }
  }, [adState.adId, t]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useEffect(() => {
    if (isChatOpen) {
      fetchParticipants();
      fetchMessages();
      joinMeetup(adState.adId);

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
  }, [isChatOpen, adState.adId, joinMeetup, leaveMeetup, registerMeetupCallback, unregisterMeetupCallback, fetchParticipants, fetchMessages]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      if (onDelete) onDelete(adState.adId);
    } catch (err: any) {
      console.error(t('meetup.errorDelete'), err);
      alert(t('meetup.errorDelete'));
    }
  };

  const handleShare = () => {
    const text = t('meetup.shareText', {
      location: adState.location,
      date: adState.scheduledAt || t('meetup.dateTBD'),
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

  return {
    adState,
    isChatOpen,
    setIsChatOpen,
    participants,
    messages,
    newMessageText,
    setNewMessageText,
    hasJoined,
    currentUserId,
    isAuthenticated,
    isCreator,
    isFull,
    chatEndRef,
    handleContactOrganizer,
    handleJoin,
    handleLeave,
    handleDelete,
    handleShare,
    handleSendMessage,
  };
};
