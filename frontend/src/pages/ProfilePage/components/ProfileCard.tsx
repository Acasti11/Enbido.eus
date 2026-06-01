import React from 'react';
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

const ProfileCard: React.FC<ProfileCardProps> = ({
  username,
  initials,
  stats,
  equippedAvatarItemId,
  equippedTitleItemId,
  twoFactorEnabled = false,
  loading2Fa = false,
  updating2Fa = false,
  onToggle2Fa,
  error2Fa,
  success2Fa
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

        {/* Sección Premium de Seguridad y Doble Factor */}
        <div
          className="profile-security-section"
        >
          <h3 className="profile-security-title">
            🔑 Seguridad de la Cuenta
          </h3>

          <div
            className="profile-security-card"
          >
            <div className="profile-security-content">
              <h4 className="profile-security-card-title">
                Autenticación de Doble Factor (2FA por Email)
              </h4>
              <p className="profile-security-card-description">
                Protege tu cuenta requiriendo un código de verificación de 6 dígitos enviado a tu correo cada vez que inicies sesión.
              </p>
            </div>

            <div>
              {loading2Fa ? (
                <div className="profile-security-loading"
                />
              ) : (
                <label
                  className="switch"
                >
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
      </div>
    </div>
  );
};

export default ProfileCard;
