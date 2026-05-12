import React from 'react';
import { useUsuarios } from '../../hooks/useUsuarios';

export const UsuariosList = (): React.JSX.Element => {
  const { usuarios, loading, error } = useUsuarios();

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h1>Usuarios</h1>
      {usuarios.length === 0 ? (
        <p>No hay usuarios registrados</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {usuarios.map(usuario => (
            <li 
              key={usuario.id} 
              style={{ 
                padding: '1rem', 
                margin: '0.5rem 0', 
                background: '#f5f5f5', 
                borderRadius: '8px',
                borderLeft: '4px solid #646cff'
              }}
            >
              <strong>{usuario.nombre}</strong>
              <span style={{ color: '#666', marginLeft: '1rem' }}>{usuario.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};