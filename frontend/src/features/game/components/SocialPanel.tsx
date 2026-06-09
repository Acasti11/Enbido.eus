import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Friend, PendingRequest, SearchUserDto } from '@/features/game/domain/lobby.types';

interface SocialPanelProps {
  socialTab: 'friends' | 'search' | 'requests' | 'blocked';
  onSetSocialTab: (tab: 'friends' | 'search' | 'requests' | 'blocked') => void;
  friends: Friend[];
  requests: PendingRequest[];
  blockedUsers: Friend[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchResults: SearchUserDto[];
  onSearchUsers: () => void;
  onOpenChat: (friend: Friend) => void;
  onSelectProfileUser: (friend: Friend) => void;
  onDeleteFriend: (friend: Friend) => void;
  onBlockUser: (friend: Friend) => void;
  onUnblockUser: (blockedUser: Friend) => void;
  onSendFriendRequest: (targetUser: { username: string }) => void;
  onAcceptRequest: (req: PendingRequest) => void;
  onDeclineRequest: (req: PendingRequest) => void;
}

const SocialPanel: React.FC<SocialPanelProps> = ({
  socialTab,
  onSetSocialTab,
  friends,
  requests,
  blockedUsers,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  onSearchUsers,
  onOpenChat,
  onSelectProfileUser,
  onDeleteFriend,
  onBlockUser,
  onUnblockUser,
  onSendFriendRequest,
  onAcceptRequest,
  onDeclineRequest,
}) => {
  const { t } = useTranslation();

  return (
    <section className="social-panel" aria-label="Social y Amigos">
      <div className="social-header-box">
        <span className="panel-icon panel-icon--sm">👥</span>
        <h2>{t('premiumLobby.communityFriends')}</h2>
      </div>

      {/* TABS HEADER */}
      <div className="social-tabs">
        <button
          className={`social-tab-btn ${socialTab === 'friends' ? 'social-tab-btn--active' : ''}`}
          onClick={() => onSetSocialTab('friends')}
        >
          {t('premiumLobby.friendsCount', { count: friends.length })}
        </button>
        <button
          className={`social-tab-btn ${socialTab === 'search' ? 'social-tab-btn--active' : ''}`}
          onClick={() => onSetSocialTab('search')}
        >
          {t('premiumLobby.search')}
        </button>
        <button
          className={`social-tab-btn ${socialTab === 'requests' ? 'social-tab-btn--active' : ''}`}
          onClick={() => onSetSocialTab('requests')}
        >
          {t('premiumLobby.requestsCount', { count: requests.length })}
        </button>
        <button
          className={`social-tab-btn ${socialTab === 'blocked' ? 'social-tab-btn--active' : ''}`}
          onClick={() => onSetSocialTab('blocked')}
        >
          {t('premiumLobby.blockedCount', { count: blockedUsers.length })}
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="social-content-area">

        {/* TAB 1: FRIENDS LIST */}
        {socialTab === 'friends' && (
          friends.length === 0 ? (
            <div className="social-empty-state social-empty-state--large">
              {t('premiumLobby.noFriends')}
            </div>
          ) : (
            friends.map(friend => (
              <div key={friend.id} className="friend-item">
                <div className="friend-info-block">
                  <div className="friend-avatar-circle">
                    {friend.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="friend-details">
                    <span className="friend-name">{friend.username}</span>
                    <span className="friend-meta-status">
                      <span className={`status-dot ${friend.status === 'online' ? 'status-dot--online' : 'status-dot--offline'}`} />
                      {friend.status === 'online' ? t('premiumLobby.online') : t('premiumLobby.offline')}
                    </span>
                  </div>
                </div>

                <div className="friend-actions-btns">
                  <button
                    className="btn-social-mini btn-chat-mini"
                    onClick={() => onOpenChat(friend)}
                    title={t("premiumLobby.openChat")}
                  >
                    💬
                  </button>
                  <button
                    className="btn-social-mini btn-profile-mini"
                    onClick={() => onSelectProfileUser(friend)}
                    title={t("premiumLobby.viewProfile")}
                  >
                    👁️
                  </button>
                  {!friend.isBot && (
                    <>
                      <button
                        className="btn-social-mini btn-delete-mini"
                        onClick={() => onDeleteFriend(friend)}
                        title={t("premiumLobby.deleteFriend")}
                      >
                        ❌
                      </button>
                      <button
                        className="btn-social-mini btn-block-mini"
                        onClick={() => onBlockUser(friend)}
                        title={t("premiumLobby.blockUser")}
                      >
                        🚫
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )
        )}

        {/* TAB 2: USER SEARCH */}
        {socialTab === 'search' && (
          <>
            <div className="social-search-row">
              <input
                type="text"
                placeholder={t("premiumLobby.usernamePlaceholder")}
                className="social-search-input"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
              <button className="btn-search-trigger" onClick={onSearchUsers}>
                {t('premiumLobby.search')}
              </button>
            </div>
            <div className="search-results-list">
              {searchResults.length === 0 ? (
                <div className="social-empty-state social-empty-state--small">
                  {t('premiumLobby.searchPrompt')}
                </div>
              ) : (
                searchResults.map(user => (
                  <div key={user.user_id} className="user-search-item">
                    <span className="search-result-username">
                      {user.username}
                    </span>
                    <button
                      className="btn-social-mini btn-add-friend-mini"
                      onClick={() => onSendFriendRequest(user)}
                    >
                      {t('premiumLobby.add')}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* TAB 3: PENDING REQUESTS */}
        {socialTab === 'requests' && (
          requests.length === 0 ? (
            <div className="social-empty-state social-empty-state--large">
              {t('premiumLobby.noRequests')}
            </div>
          ) : (
            requests.map(req => (
              <div
                key={req.friendshipId}
                className="friend-item friend-item--request"
              >
                <div className="request-header">
                  <span className="request-username">{req.username}</span>
                  <span className="request-status">
                    {req.type === 'received' ? t('premiumLobby.sentRequest') : t('premiumLobby.requestSent')}
                  </span>
                </div>
                {req.type === 'received' ? (
                  <div className="request-actions">
                    <button
                      className="btn-action-request btn-accept-req request-btn"
                      onClick={() => onAcceptRequest(req)}
                    >
                      {t('premiumLobby.accept')}
                    </button>
                    <button
                      className="btn-action-request btn-decline-req request-btn"
                      onClick={() => onDeclineRequest(req)}
                    >
                      {t('premiumLobby.decline')}
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-action-request btn-decline-req request-btn-full request-btn-cancel"
                    onClick={() => onDeclineRequest(req)}
                  >
                    {t('premiumLobby.cancelRequest')}
                  </button>
                )}
              </div>
            ))
          )
        )}

        {/* TAB 4: BLOCKED USERS */}
        {socialTab === 'blocked' && (
          blockedUsers.length === 0 ? (
            <div className="social-empty-state social-empty-state--large">
              {t('premiumLobby.noBlocked')}
            </div>
          ) : (
            blockedUsers.map(blocked => (
              <div key={blocked.id} className="friend-item">
                <div className="friend-info-block">
                  <div className="friend-avatar-circle friend-avatar-circle--blocked">
                    🚫
                  </div>
                  <div className="friend-details">
                    <span className="friend-name">{blocked.username}</span>
                    <span className="friend-meta-status">{t('premiumLobby.blockedTab')}</span>
                  </div>
                </div>
                <div className="friend-actions-btns">
                  <button
                    className="btn-social-mini btn-unblock-mini"
                    onClick={() => onUnblockUser(blocked)}
                  >
                    {t('premiumLobby.unblockUser')}
                  </button>
                </div>
              </div>
            ))
          )
        )}

      </div>
    </section>
  );
};

export default SocialPanel;
