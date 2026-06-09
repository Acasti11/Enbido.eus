import React from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/shared/lib/api';
import type { UseAccountDataReturn } from '../hooks/useAccountData';

interface AccountSettingsFormProps {
  data: UseAccountDataReturn;
}

const AccountSettingsForm: React.FC<AccountSettingsFormProps> = ({ data }): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    userData,
    name,
    setName,
    surname,
    setSurname,
    saving,
    setSaving,
    updating2Fa,
    setUpdating2Fa,
    sendingReset,
    setSendingReset,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    refetch,
  } = data;

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.put('/usuarios/me', {
        name: name.trim(),
        surname: surname.trim(),
        phoneNumber: userData.phoneNumber,
        postalCode: userData.postalCode,
      });

      setSuccessMsg(t('account.updateSuccess'));
      setTimeout(() => setSuccessMsg(''), 4000);
      refetch();
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
      await api.post('/usuarios/me/2fa/toggle', { enabled });
      setSuccessMsg(enabled ? t('profile.twoFactorEnabled') : t('profile.twoFactorDisabled'));
      setTimeout(() => setSuccessMsg(''), 4000);
      refetch();
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

  return (
    <>
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
    </>
  );
};

export default AccountSettingsForm;
