import React from 'react';
import { useTranslation } from 'react-i18next';
import BackgroundCards from '../ProfilePage/components/BackgroundCards';
import ProfileHeader from '../ProfilePage/components/ProfileHeader';
import { useAccountData } from './hooks/useAccountData';
import AccountSettingsForm from './components/AccountSettingsForm';
import './styles/account-page.css';

const AccountPage: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();
  const data = useAccountData();

  const { userData, profile, loading } = data;

  if (loading) {
    return (
      <div className="account-page">
        <BackgroundCards />
        <div className="account-page__loading">
          <div className="account-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <BackgroundCards />

      <div className="account-page__main">
        <div className="account-layout">

          {/* LEFT COLUMN: Summary card */}
          <div className="account-card account-card--summary">
            <ProfileHeader
              username={userData?.username}
              equippedAvatarItemId={profile?.equippedAvatarItemId}
              equippedTitleItemId={profile?.equippedTitleItemId}
            />
            <p className="account-profile-email">{userData?.email}</p>

            <div className="account-badge-container">
              <span className={`account-badge ${userData?.twoFactorEnabled ? 'account-badge--secure' : ''}`}>
                {userData?.twoFactorEnabled ? '🔑 2FA Active' : '🔓 2FA Inactive'}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Details & Settings Form */}
          <div className="account-card account-card--details">
            <div className="account-card__header">
              <h1 className="account-card__title">{t('account.title')}</h1>
              <p className="account-card__subtitle">{t('account.subtitle')}</p>
            </div>

            <AccountSettingsForm data={data} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccountPage;
