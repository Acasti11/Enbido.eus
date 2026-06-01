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
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(212, 175, 55, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <h3 
            style={{
              margin: 0,
              fontSize: '1.1rem',
              color: '#fff',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🔑 Seguridad de la Cuenta
          </h3>
          
          <div 
            style={{
              background: 'rgba(212, 175, 55, 0.03)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1.5rem',
              backdropFilter: 'blur(10px)',
              boxShadow: 'inset 0 0 12px rgba(212,175,55,0.03)'
            }}
          >
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#d4af37', fontSize: '0.95rem', fontWeight: 'bold' }}>
                Autenticación de Doble Factor (2FA por Email)
              </h4>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem', lineHeight: '1.4' }}>
                Protege tu cuenta requiriendo un código de verificación de 6 dígitos enviado a tu correo cada vez que inicies sesión.
              </p>
            </div>
            
            <div>
              {loading2Fa ? (
                <div 
                  style={{
                    width: '50px',
                    height: '26px',
                    borderRadius: '13px',
                    background: 'rgba(255,255,255,0.05)',
                    opacity: 0.5
                  }}
                />
              ) : (
                <label 
                  className="switch" 
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '50px',
                    height: '26px'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={twoFactorEnabled}
                    disabled={updating2Fa}
                    onChange={(e) => onToggle2Fa?.(e.target.checked)}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span 
                    className="slider round" 
                    style={{
                      position: 'absolute',
                      cursor: updating2Fa ? 'not-allowed' : 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: twoFactorEnabled ? '#d4af37' : 'rgba(255,255,255,0.1)',
                      transition: '.4s',
                      borderRadius: '34px',
                      boxShadow: twoFactorEnabled ? '0 0 10px rgba(212,175,55,0.4)' : 'none'
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
                        transform: twoFactorEnabled ? 'translateX(24px)' : 'translateX(0)'
                      }}
                    />
                  </span>
                </label>
              )}
            </div>
          </div>

          {success2Fa && (
            <p 
              style={{ 
                margin: 0, 
                color: '#4ade80', 
                fontSize: '0.8rem', 
                fontWeight: 'bold',
                textAlign: 'left'
              }}
            >
              ✓ {success2Fa}
            </p>
          )}
          
          {error2Fa && (
            <p 
              style={{ 
                margin: 0, 
                color: '#f87171', 
                fontSize: '0.8rem', 
                fontWeight: 'bold',
                textAlign: 'left'
              }}
            >
              ⚠️ {error2Fa}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
