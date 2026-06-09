import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUsers } from '@/shared/hooks/useUsuarios';

export const UsuariosList = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { users, loading, error } = useUsers();

  if (loading) return <p>{t('common.loading')}</p>;
  if (error) return <p className="usuarios-list-error">{t('common.error')}: {error}</p>;

  return (
    <div>
      <h1>{t('usersList.title')}</h1>
      {users.length === 0 ? (
        <p>{t('usersList.empty')}</p>
      ) : (
        <ul className="usuarios-list-container">
          {users.map(user => (
            <li
              key={user.userId || user.user_id}
              className="usuarios-list-item"
            >
              <strong>{user.name}</strong>
              <span className="usuarios-list-item-email">{user.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
