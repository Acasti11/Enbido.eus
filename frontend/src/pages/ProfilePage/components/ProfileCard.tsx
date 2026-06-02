import React from 'react';
import { useTranslation } from 'react-i18next';
import ProfileHeader from './ProfileHeader';
import StatsGrid from './StatsGrid';
import '../styles/profile-card.css';

interface ProfileCardProps {
  username?: string;
  initials?: string;
  stats?: { label: string; value: number | string; icon: string }[];
  equippedAvatarItemId?: number;
  equippedTitleItemId?: number;
  twoFactorEnabled?: boolean;
  loading2Fa?: boolean;
  updating2Fa?: boolean;
  onToggle2Fa?: (enabled: boolean) => void;
  error2Fa?: string;
  success2Fa?: string;
}

interface SecuritySectionProps {
  twoFactorEnabled?: boolean;
  loading2Fa?: boolean;
  updating2Fa?: boolean;
  onToggle2Fa?: (enabled: boolean) => void;
  error2Fa?: string;
  success2Fa?: string;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
  twoFactorEnabled,
  loading2Fa,
  updating2Fa,
  onToggle2Fa,
  error2Fa,
  success2Fa,
}): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className="profile-security-section">
      <h3 className="profile-security-title">
        🔑 {t('profile.accountSecurity')}
      </h3>

      <div className="profile-security-card">
        <div className="profile-security-content">
          <h4 className="profile-security-card-title">
            {t('profile.twoFactorTitle')}
          </h4>
          <p className="profile-security-card-description">
            {t('profile.twoFactorDescription')}
          </p>
        </div>

        <div>
          {loading2Fa ? (
            <div className="profile-security-loading" />
          ) : (
            <label className="switch">
              <input
                className="switch-input"
                type="checkbox"
                checked={twoFactorEnabled}
                disabled={updating2Fa}
                onChange={(e) => onToggle2Fa?.(e.target.checked)}
              />
              <span
                className={`slider round ${twoFactorEnabled ? 'slider--active' : ''
                  } ${updating2Fa ? 'slider--disabled' : ''
                  }`}
              >
                <span
                  className={`slider-knob ${twoFactorEnabled ? 'slider-knob--active' : ''
                    }`}
                />
              </span>
            </label>
          )}
        </div>
      </div>

      {success2Fa && (
        <p className="profile-security-success">
          ✓ {success2Fa}
        </p>
      )}

      {error2Fa && (
        <p className="profile-security-error">
          ⚠️ {error2Fa}
        </p>
      )}
    </div>
  );
};

const ProfileCard: React.FC<ProfileCardProps> = ({
  username,
  initials,
  stats,
  equippedAvatarItemId,
  equippedTitleItemId,
  twoFactorEnabled,
  loading2Fa,
  updating2Fa,
  onToggle2Fa,
  error2Fa,
  success2Fa,
}): React.JSX.Element => {
  return (
    <div className="profile-card">
      <div className="profile-card__container">
        <ProfileHeader
          username={username}
          initials={initials}
          equippedAvatarItemId={equippedAvatarItemId}
          equippedTitleItemId={equippedTitleItemId}
        />
        <StatsGrid stats={stats} />

        <SecuritySection
          twoFactorEnabled={twoFactorEnabled}
          loading2Fa={loading2Fa}
          updating2Fa={updating2Fa}
          onToggle2Fa={onToggle2Fa}
          error2Fa={error2Fa}
          success2Fa={success2Fa}
        />
      </div>
    </div>
  );
};

export default ProfileCard;
