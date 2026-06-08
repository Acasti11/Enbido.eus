import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import BackgroundCards from '../ProfilePage/components/BackgroundCards';
import ProfileHeader from '../ProfilePage/components/ProfileHeader';
import './styles/account-page.css';

interface UserData {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber?: string;
  postalCode?: string;
  twoFactorEnabled: boolean;
}

interface UserProfile {
  elo: number;
  coins: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  equippedAvatarItemId?: number;
  equippedTitleItemId?: number;
}


const AccountPage: React.FC = (): React.JSX.Element => {
  const { t } = useTranslation();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating2Fa, setUpdating2Fa] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [userRes, profileRes] = await Promise.all([
          api.get('/usuarios/me'),
          api.get('/usuarios/me/profile').catch(() => null)
        ]);
        setUserData(userRes.data);
        setName(userRes.data.name || '');
        setSurname(userRes.data.surname || '');
        if (profileRes) {
          setProfile(profileRes.data);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setErrorMsg(t('account.updateError'));
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [t]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const res = await api.put('/usuarios/me', {
        name: name.trim(),
        surname: surname.trim(),
        phoneNumber: userData.phoneNumber,
        postalCode: userData.postalCode,
      });
      
      setUserData(res.data);
      setName(res.data.name || '');
      setSurname(res.data.surname || '');
      setSuccessMsg(t('account.updateSuccess'));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMsg(t('account.updateError'));
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2Fa = async (enabled: boolean) => {
    if (!userData) return;
    
    setUpdating2Fa(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const res = await api.post('/usuarios/me/2fa/toggle', { enabled });
      setUserData(prev => prev ? { ...prev, twoFactorEnabled: res.data.twoFactorEnabled } : null);
      setSuccessMsg(enabled ? t('profile.twoFactorEnabled') : t('profile.twoFactorDisabled'));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      const apiError = err as { response?: { data?: { error?: string } } };
      console.error('Error updating 2FA:', err);
      setErrorMsg(apiError.response?.data?.error || t('profile.twoFactorError'));
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setUpdating2Fa(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!userData) return;
    
    setSendingReset(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    const protocol = window.location.protocol;
    const host = window.location.host;
    const frontendUrl = `${protocol}//${host}/recuperar-password`;
    
    try {
      const res = await api.post('/usuarios/login/recover-password', {
        email: userData.email.trim(),
        frontendUrl
      });
      setSuccessMsg(res.data.message || t('account.resetSuccess'));
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      const apiError = err as { response?: { data?: { error?: string } } };
      console.error('Error triggering password reset:', err);
      setErrorMsg(apiError.response?.data?.error || t('account.resetError'));
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setSendingReset(false);
    }
  };

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
            
            <form className="account-form" onSubmit={handleSaveChanges}>
              
              {/* Field group: Personal Details */}
              <div className="account-form-section">
                <h2 className="account-form-section-title">👤 {t('account.personalDetails')}</h2>
                
                <div className="account-form-grid">
                  <div className="account-form-field">
                    <label className="account-form-label">{t('account.name')}</label>
                    <input
                      type="text"
                      className="account-form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John"
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="account-form-field">
                    <label className="account-form-label">{t('account.surname')}</label>
                    <input
                      type="text"
                      className="account-form-input"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="e.g. Doe"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Field group: Read-only Access details */}
              <div className="account-form-section">
                <h2 className="account-form-section-title">🔑 {t('account.accountDetails')}</h2>
                
                <div className="account-form-grid">
                  <div className="account-form-field">
                    <label className="account-form-label">{t('account.username')}</label>
                    <input
                      type="text"
                      className="account-form-input account-form-input--readonly"
                      value={userData?.username || ''}
                      readOnly
                      title="Username cannot be changed"
                    />
                  </div>
                  
                  <div className="account-form-field">
                    <label className="account-form-label">{t('account.email')}</label>
                    <input
                      type="text"
                      className="account-form-input account-form-input--readonly"
                      value={userData?.email || ''}
                      readOnly
                      title="Email cannot be changed"
                    />
                  </div>
                </div>
              </div>

              {/* Feedback messages */}
              {successMsg && <div className="account-alert account-alert--success">✓ {successMsg}</div>}
              {errorMsg && <div className="account-alert account-alert--error">⚠️ {errorMsg}</div>}

              <div className="account-form-actions">
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={saving}
                >
                  {saving ? t('account.saving') : t('account.saveChanges')}
                </button>
              </div>
            </form>
            
            <div className="account-divider" />
            
            {/* Password Reset Section */}
            <div className="account-action-section">
              <div className="account-action-content">
                <h4 className="account-action-title">🔐 {t('account.passwordReset')}</h4>
                <p className="account-action-desc">{t('account.passwordResetDesc')}</p>
              </div>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handlePasswordReset}
                disabled={sendingReset}
              >
                {sendingReset ? '...' : t('account.sendResetBtn')}
              </button>
            </div>
            
            <div className="account-divider" />
            
            {/* 2FA Toggle Section */}
            <div className="account-action-section">
              <div className="account-action-content">
                <h4 className="account-action-title">🛡️ {t('account.twoFactorTitle')}</h4>
                <p className="account-action-desc">{t('account.twoFactorDesc')}</p>
              </div>
              
              <div className="account-switch-container">
                {updating2Fa ? (
                  <div className="account-switch-loading" />
                ) : (
                  <label className="switch">
                    <input
                      type="checkbox"
                      className="switch-input"
                      checked={userData?.twoFactorEnabled || false}
                      onChange={(e) => handleToggle2Fa(e.target.checked)}
                      disabled={updating2Fa}
                    />
                    <span className={`slider round ${userData?.twoFactorEnabled ? 'slider--active' : ''}`}>
                      <span className={`slider-knob ${userData?.twoFactorEnabled ? 'slider-knob--active' : ''}`} />
                    </span>
                  </label>
                )}
              </div>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
