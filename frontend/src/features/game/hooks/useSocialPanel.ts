import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/shared/lib/api';
import { useChatWebSocket } from '@/features/chat/hooks/ChatWebSocketContext';
import type { Friend, PendingRequest, SearchUserDto } from '@/features/game/domain/lobby.types';

const defaultBots: Friend[] = [
  { id: -1, username: 'MusLar-99', elo: 1420, totalGamesPlayed: 120, totalGamesWon: 74, status: 'online', isBot: true },
  { id: -2, username: 'AnderMus', elo: 1100, totalGamesPlayed: 45, totalGamesWon: 20, status: 'online', isBot: true },
  { id: -3, username: 'AmaiaTxapeldun', elo: 1650, totalGamesPlayed: 250, totalGamesWon: 160, status: 'offline', isBot: true }
];

export function useSocialPanel(_currentUserId: number) {
  const { t } = useTranslation();
  const { registerFriendshipCallback, unregisterFriendshipCallback } = useChatWebSocket();

  const [socialTab, setSocialTab] = useState<'friends' | 'search' | 'requests' | 'blocked'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserDto[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
  const [selectedProfileUser, setSelectedProfileUser] = useState<Friend | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await api.get('/friendships');
      setFriends([...defaultBots, ...res.data]);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriends(defaultBots);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/friendships/pending');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  }, []);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const res = await api.get('/friendships/blocked');
      setBlockedUsers(res.data);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
  }, []);

  const handleDeleteFriend = useCallback(async (friend: Friend) => {
    const confirmMsg = t('premiumLobby.confirmDelete', { username: friend.username });
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/friendships/${friend.friendshipId}`);
      fetchFriends();
    } catch (err: any) {
      console.error('Error deleting friend:', err);
      alert(err.response?.data?.error || t('premiumLobby.errorDeleteFriend'));
    }
  }, [t, fetchFriends]);

  const handleBlockUser = useCallback(async (friend: Friend) => {
    const confirmMsg = t('premiumLobby.confirmBlock', { username: friend.username });
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post(`/friendships/block/${friend.id}`);
      fetchFriends();
    } catch (err: any) {
      console.error('Error blocking user:', err);
      alert(err.response?.data?.error || t('premiumLobby.errorBlockUser'));
    }
  }, [t, fetchFriends]);

  const handleUnblockUser = useCallback(async (blockedUser: Friend) => {
    try {
      await api.post(`/friendships/unblock/${blockedUser.id}`);
      fetchBlockedUsers();
    } catch (err: any) {
      console.error('Error unblocking user:', err);
      alert(err.response?.data?.error || t('premiumLobby.errorUnblockUser'));
    }
  }, [t, fetchBlockedUsers]);

  const handleSearchUsers = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get('/usuarios/search', {
        params: { query: searchQuery.trim() }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Error searching registered users:', err);
    }
  }, [searchQuery]);

  const handleSendFriendRequest = useCallback(async (targetUser: { username: string }) => {
    const isAlreadyFriend = friends.some(f => f.username === targetUser.username);
    if (isAlreadyFriend) {
      alert(t('premiumLobby.alreadyFriend'));
      return;
    }

    try {
      const res = await api.post(`/friendships/request/${targetUser.username}`);
      alert(res.data.message || t('premiumLobby.friendRequestSent'));
      fetchRequests();
      fetchFriends();
    } catch (err: unknown) {
      console.error('Error sending friend request:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || t('premiumLobby.errorSendRequest'));
    }
  }, [friends, t, fetchRequests, fetchFriends]);

  const handleAcceptRequest = useCallback(async (req: PendingRequest) => {
    try {
      await api.post(`/friendships/accept/${req.friendshipId}`);
      alert(t('premiumLobby.friendRequestAccepted'));
      fetchFriends();
      fetchRequests();
    } catch (err: unknown) {
      console.error('Error accepting friend request:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || t('premiumLobby.errorAcceptRequest'));
    }
  }, [t, fetchFriends, fetchRequests]);

  const handleDeclineRequest = useCallback(async (req: PendingRequest) => {
    try {
      await api.post(`/friendships/decline/${req.friendshipId}`);
      alert(t('premiumLobby.requestDeclined'));
      fetchRequests();
    } catch (err: unknown) {
      console.error('Error declining request:', err);
      const axiosError = err as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || t('premiumLobby.errorDeclineRequest'));
    }
  }, [t, fetchRequests]);

  // Handle friendship and presence WebSocket events in real-time
  useEffect(() => {
    registerFriendshipCallback((event: any) => {
      const { type } = event;
      if (type === 'PRESENCE_CHANGE') {
        const { userId, status } = event;
        setFriends(prev => prev.map(f => {
          if (f.id === userId) {
            return { ...f, status };
          }
          return f;
        }));
      }
      else if (type === 'FRIEND_REQUEST_RECEIVED') {
        fetchRequests();
      }
      else if (type === 'FRIEND_REQUEST_ACCEPTED') {
        fetchFriends();
        fetchRequests();
      }
      else if (type === 'FRIEND_DELETED') {
        fetchFriends();
        fetchRequests();
      }
      else if (type === 'FRIEND_BLOCKED') {
        fetchFriends();
        fetchRequests();
        fetchBlockedUsers();
      }
      else if (type === 'FRIEND_UNBLOCKED') {
        fetchFriends();
        fetchBlockedUsers();
      }
    });

    return () => {
      unregisterFriendshipCallback();
    };
  }, [
    registerFriendshipCallback,
    unregisterFriendshipCallback,
    fetchFriends,
    fetchRequests,
    fetchBlockedUsers
  ]);

  // Load blocked users when blocked tab is active
  useEffect(() => {
    if (socialTab === 'blocked') {
      fetchBlockedUsers();
    }
  }, [socialTab, fetchBlockedUsers]);

  return {
    socialTab,
    searchQuery,
    searchResults,
    friends,
    requests,
    blockedUsers,
    selectedProfileUser,
    setSocialTab,
    setSearchQuery,
    setSearchResults,
    setSelectedProfileUser,
    fetchFriends,
    fetchRequests,
    handleDeleteFriend,
    handleBlockUser,
    handleUnblockUser,
    handleSearchUsers,
    handleSendFriendRequest,
    handleAcceptRequest,
    handleDeclineRequest,
  };
}
