import React from 'react';
import type { AppNotification } from '../SettingsContext';

interface NotificationToastProps {
  notification: AppNotification | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  if (!notification) return null;

  return (
    <div
      className="toast-notification"
      onClick={() => {
        if (notification.type === 'message' && notification.meta) {
          window.dispatchEvent(new CustomEvent('enbido_open_chat', {
            detail: {
              friendId: notification.meta.friendId,
              username: notification.meta.username
            }
          }));
        } else if (notification.type === 'friend') {
          window.location.href = '/jugar';
        }
        onDismiss();
      }}
    >
      <div className="toast-header">
        <span className="toast-title">
          {notification.type === 'message' ? '💬 Nuevo Mensaje' : '👥 Petición Amistad'}
        </span>
        <button
          className="toast-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          ✕
        </button>
      </div>
      <div className="toast-body">
        {notification.title}
      </div>
      <div className="toast-message">
        {notification.message}
      </div>
    </div>
  );
};
