import React, { useState, useEffect } from 'react';
import { UsuariosList } from './components/UsuariosList/UsuariosList';
import './App.css';

interface BackendStatus {
  conectado: boolean;
  mensaje: string;
  totalUsuarios: number;
}

function App(): React.JSX.Element {
  const [status, setStatus] = useState<BackendStatus>({
    conectado: false,
    mensaje: 'Cargando...',
    totalUsuarios: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/usuarios')
      .then(res => {
        if (!res.ok) throw new Error('Backend no responde');
        return res.json();
      })
      .then(data => {
        setStatus({
          conectado: true,
          mensaje: `Backend conectado. Usuarios: ${data.length}`,
          totalUsuarios: data.length
        });
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Error de conexión');
        setStatus({
          conectado: false,
          mensaje: 'Error de conexión',
          totalUsuarios: 0
        });
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 MUs Full Stack</h1>
        <h2>Frontend React + TypeScript + Vite + Nginx</h2>
      </header>
      
      <section className="status-section">
        <p>Estado del backend: <strong className={status.conectado ? 'ok' : 'error'}>{status.mensaje}</strong></p>
        {error && <p className="error-text">Error: {error}</p>}
      </section>

      <hr />

      <section className="usuarios-section">
        <UsuariosList />
      </section>

      <footer className="App-footer">
        <p>Esto es un frontend TypeScript para probar la arquitectura Docker.</p>
      </footer>
    </div>
  );
}

export default App;
