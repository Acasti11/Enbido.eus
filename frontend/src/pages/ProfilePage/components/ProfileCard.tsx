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

interface ToggleSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, disabled, onChange }): React.JSX.Element => (
  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      style={{ opacity: 0, width: 0, height: 0 }}
    />
    <span
      className="slider round"
      style={{
        position: 'absolute',
        cursor: disabled ? 'not-allowed' : 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: checked ? '#d4af37' : 'rgba(255,255,255,0.1)',
        transition: '.4s',
        borderRadius: '34px',
        boxShadow: checked ? '0 0 10px rgba(212,175,55,0.4)' : 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          content: '""',
          height: '18px',
          width: '18px',
          left: '4px',
          bottom: '4px',
          backgroundColor: '#fff',
          transition: '.4s',
          borderRadius: '50%',
          transform: checked ? 'translateX(24px)' : 'translateX(0)',
        }}
      />
    </span>
  </label>
);

interface StatusMessageProps {
  type: 'success' | 'error';
  message: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ type, message }): React.JSX.Element => {
  const color = type === 'success' ? '#4ade80' : '#f87171';
  const icon = type === 'success' ? '✓' : '⚠️';
  return (
    <p style={{ margin: 0, color, fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'left' }}>
      {icon} {message}
    </p>
  );
};

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
