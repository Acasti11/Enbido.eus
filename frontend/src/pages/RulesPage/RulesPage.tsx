import React from 'react';
import './rules.css';

const RulesPage: React.FC = (): React.JSX.Element => {
  return (
    <div className="rules-container">
      <header className="rules-header">
        <h1 className="rules-title">Mus Jokoaren Arauak</h1>
        <span className="rules-subtitle">Reglas oficiales y guía de aprendizaje para jugar al Mus</span>
      </header>

      {/* INTRODUCCIÓN */}
      <section className="rules-section" aria-labelledby="intro-title">
        <h2 id="intro-title" className="rules-section-title">
          <span>🃏</span> Zer da Mus-a? / ¿Qué es el Mus?
        </h2>
        <p className="rules-intro-text">
          El Mus es un juego de cartas tradicional de origen vasco, ampliamente jugado en toda España y partes de Hispanoamérica. 
          Se juega por parejas (4 jugadores en total) utilizando la baraja española de 40 cartas. El objetivo es llegar antes que la pareja rival a un número determinado de puntos (usualmente 30 u 40 puntos).
        </p>
        <p className="rules-intro-text">
          Musa bikoteka jokatu beharreko karta joko tradizionala da. Hogeita hamar edo berrogei puntutara jokatu ohi da, eta bikote bakoitzeko kideen arteko komunikazio isila (keinuak) funtsezkoa da garaipena lortzeko.
        </p>
      </section>

      {/* LOS CUATRO LANCES */}
      <section className="rules-section" aria-labelledby="lances-title">
        <h2 id="lances-title" className="rules-section-title">
          <span>⚔️</span> Jokoaren Lantaldeak / Los 4 Lances de la Mano
        </h2>
        <p className="rules-intro-text">
          Cada mano de Mus consta de 4 fases o lances consecutivos en los que los jugadores apuestan fichas (llamadas "amarracos" y "piedras"). El valor de las cartas de mayor a menor es: Rey (10 puntos), Tres (10 puntos), Caballo (9 puntos), Sota (8 puntos), Siete, Seis, Cinco, Cuatro, Dos (1 punto), As (1 punto).
        </p>

        <div className="lances-grid">
          
          <div className="lance-card">
            <div className="lance-num">1</div>
            <h3 className="lance-title">Handia / La Grande</h3>
            <p className="lance-desc">
              Gana la pareja que tenga las cartas de mayor valor. Se comparan primero las cartas más altas de cada jugador, luego las segundas, etc.
              Los Reyes, Treses (en la variante de 8 reyes) y Caballos son las cartas más fuertes.
            </p>
          </div>

          <div className="lance-card">
            <div className="lance-num">2</div>
            <h3 className="lance-title">Txikia / La Chica</h3>
            <p className="lance-desc">
              Se juega al revés que a la Grande: gana la pareja que tenga las cartas de menor valor. 
              Los Ases y los Dues (en la variante de 8 reyes) son las mejores cartas para esta ronda.
            </p>
          </div>

          <div className="lance-card">
            <div className="lance-num">3</div>
            <h3 className="lance-title">Pareak / Los Pares</h3>
            <p className="lance-desc">
              Ronda donde se premia tener cartas del mismo valor. Antes de apostar, cada jugador anuncia si tiene pares. Si nadie tiene, se salta la ronda.
              Los tipos de pares de menor a mayor son:
            </p>
            <ul style={{ fontSize: '0.85rem', color: 'var(--color-text-white-70)', paddingLeft: '20px', marginTop: '5px' }}>
              <li><strong>Par (Pareak):</strong> Dos cartas iguales.</li>
              <li><strong>Medias (Erdikoak):</strong> Tres cartas iguales.</li>
              <li><strong>Duples (Bikoitzak):</strong> Dos parejas de cartas iguales o cuatro cartas iguales.</li>
            </ul>
          </div>

          <div className="lance-card">
            <div className="lance-num">4</div>
            <h3 className="lance-title">Jokoa edo Puntua / El Juego o Punto</h3>
            <p className="lance-desc">
              Se suma el valor de las 4 cartas. Si algún jugador suma 31 o más, hay "Juego". Si nadie llega, se juega al "Punto".
              El mejor juego es 31 (llamado "Joko Nagusia"), seguido de 40, 36, 37, 35, 34, 33 y 32. 
              En caso de jugar al Punto, gana el jugador que sume un valor lo más cercano posible a 31 (siendo 30 el mejor punto).
            </p>
          </div>

        </div>
      </section>

      {/* GUÍA DE SEÑAS */}
      <section className="rules-section" aria-labelledby="senas-title">
        <h2 id="senas-title" className="rules-section-title">
          <span>🤫</span> Keinu Gida / Guía de Señas Permitidas
        </h2>
        <p className="rules-intro-text">
          En el Mus está permitido (y es parte clave del juego) pasar información confidencial de tus cartas a tu compañero mediante gestos o señas preestablecidas. ¡Ojo! Si los rivales te pillan haciéndolas, descubrirán tu estrategia. No se permite mentir con las señas.
        </p>

        <div className="senas-grid">
          
          <div className="sena-card">
            <span className="sena-emoji">👄</span>
            <div className="sena-info">
              <span className="sena-name">Morder Labio Inferior</span>
              <span className="sena-meaning">Bi Errege / Dos Reyes</span>
              <span className="sena-desc">Indica que tienes dos Reyes en la mano.</span>
            </div>
          </div>

          <div className="sena-card">
            <span className="sena-emoji">👅</span>
            <div className="sena-info">
              <span className="sena-name">Punta de la Lengua</span>
              <span className="sena-meaning">Bi As / Dos Ases</span>
              <span className="sena-desc">Indica que tienes dos Ases en la mano.</span>
            </div>
          </div>

          <div className="sena-card">
            <span className="sena-emoji">😉</span>
            <div className="sena-info">
              <span className="sena-name">Guiño de un Ojo</span>
              <span className="sena-meaning">Erdikoak / Medias (3 iguales)</span>
              <span className="sena-desc">Indica tres cartas del mismo valor.</span>
            </div>
          </div>

          <div className="sena-card">
            <span className="sena-emoji">🤨</span>
            <div className="sena-info">
              <span className="sena-name">Elevar las Cejas</span>
              <span className="sena-meaning">Bikoitzak / Duples (2 parejas)</span>
              <span className="sena-desc">Indica que tienes duples en la mano.</span>
            </div>
          </div>

          <div className="sena-card">
            <span className="sena-emoji">🤫</span>
            <div className="sena-info">
              <span className="sena-name">Ladear la Cabeza</span>
              <span className="sena-meaning">31 Puntura (Jokoa)</span>
              <span className="sena-desc">Indica que tienes la suma ideal de 31 puntos para Juego.</span>
            </div>
          </div>

          <div className="sena-card">
            <span className="sena-emoji">😑</span>
            <div className="sena-info">
              <span className="sena-name">Cerrar los Ojos</span>
              <span className="sena-meaning">Itsua / Ciego (Sin Juego)</span>
              <span className="sena-desc">Indica que no tienes juego (menos de 31 puntos) o estás "ciego".</span>
            </div>
          </div>

        </div>
      </section>

      {/* VARIANTES DE JUEGO */}
      <section className="rules-section" aria-labelledby="variations-title">
        <h2 id="variations-title" className="rules-section-title">
          <span>⚙️</span> Arau Bertsioak / 4 Reyes vs 8 Reyes
        </h2>
        
        <div className="variations-box">
          <div className="variation-item">
            <span className="variation-title">8 Reyes (Variante estándar de Enbido.eus)</span>
            <p className="variation-desc">
              Es la modalidad más jugada en Vizcaya y Guipúzcoa. Los **Treses** equivalen a Reyes, y los **Dues** equivalen a Ases. 
              Esto hace que haya 8 Reyes y 8 Ases en la baraja, provocando muchas más manos con parejas altas, juego fuerte y duples, lo que agiliza y aumenta la emoción de la partida.
            </p>
          </div>

          <div className="variation-item" style={{ marginTop: '10px' }}>
            <span className="variation-title">4 Reyes (Variante clásica castellana o de Álava)</span>
            <p className="variation-desc">
              Los Treses y Dues son cartas numéricas normales con su valor de 3 y 2 puntos respectivamente. 
              En esta variante los pares altos y las manos de 31 son mucho más escasas, obligando a jugar un mus táctico y de mayor control.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RulesPage;
