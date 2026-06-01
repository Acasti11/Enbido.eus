import React from 'react';
import { useUsuarios } from '../../hooks/useUsuarios';

export const UsuariosList = (): React.JSX.Element => {
  const { usuarios, loading, error } = useUsuarios();

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="usuarios-list-error">Error: {error}</p>;

  return (
    <div>
      <h1>Usuarios</h1>
      {usuarios.length === 0 ? (
        <p>No hay usuarios registrados</p>
      ) : (
        <ul className="usuarios-list-container">
          {usuarios.map(usuario => (
            <li
              key={usuario.userId || usuario.user_id}
              className="usuarios-list-item"
            >
              <strong>{usuario.name}</strong>
              <span className="usuarios-list-item-email">{usuario.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};