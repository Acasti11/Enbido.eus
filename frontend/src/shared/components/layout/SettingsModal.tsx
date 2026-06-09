import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface Settings {
  musicEnabled: boolean;
  musicVolume: number;
  soundEnabled: boolean;
  soundVolume: number;
  viewMode: '2d' | '3d';
  notificationsEnabled: boolean;
  language: 'es' | 'eu' | 'en';
}

interface SettingsModalProps {
  isOpen: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: () => void;
  onUpdateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  playSfx: (sound: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
  onUpdateSetting,
  playSfx,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return createPortal(
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <header className="settings-modal-header">
          <h2>{t('settings.title')}</h2>
          <button
            className="settings-close-btn"
            onClick={onClose}
          >
            {t('settings.close')}
          </button>
        </header>

        <div className="settings-modal-body">
          <div className="settings-section">
            <h3>{t('settings.audioSection')}</h3>
            <div className="settings-row">
              <label>{t('settings.music')}</label>
              <input
                type="checkbox"
                className="settings-toggle"
                checked={settings.musicEnabled}
                onChange={(e) => {
                  playSfx('click');
                  onUpdateSetting('musicEnabled', e.target.checked);
                }}
              />
            </div>
            {settings.musicEnabled && (
              <div className="settings-row flex-column">
                <div className="flex-row-spaced">
                  <label>{t('settings.musicVolume')}</label>
                  <span className="settings-val-lbl">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => {
                    onUpdateSetting('musicVolume', parseFloat(e.target.value));
                  }}
                  className="settings-slider"
                />
              </div>
            )}
            <div className="settings-row">
              <label>{t('settings.soundEffects')}</label>
              <input
                type="checkbox"
                className="settings-toggle"
                checked={settings.soundEnabled}
                onChange={(e) => {
                  playSfx('click');
                  onUpdateSetting('soundEnabled', e.target.checked);
                }}
              />
            </div>
            {settings.soundEnabled && (
              <div className="settings-row flex-column">
                <div className="flex-row-spaced">
                  <label>{t('settings.soundVolume')}</label>
                  <span className="settings-val-lbl">{Math.round(settings.soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => {
                    onUpdateSetting('soundVolume', parseFloat(e.target.value));
                  }}
                  className="settings-slider"
                />
              </div>
            )}
          </div>

          <div className="settings-section">
            <h3>{t('settings.notifSection')}</h3>
            <div className="settings-row">
              <label>{t('settings.notifications')}</label>
              <input
                type="checkbox"
                className="settings-toggle"
                checked={settings.notificationsEnabled}
                onChange={(e) => {
                  playSfx('click');
                  onUpdateSetting('notificationsEnabled', e.target.checked);
                }}
              />
            </div>
          </div>
        </div>

        <footer className="settings-modal-footer">
          <button
            className="settings-save-btn"
            onClick={onSave}
          >
            {t('settings.save')}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};
