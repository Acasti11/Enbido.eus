import React from 'react';
import '../styles/social-divider.css';
interface LoginFormProps {
  onSwitchToRegister: () => void; 
}
const SocialDivider: React.FC<LoginFormProps> = ({ onSwitchToRegister }): React.JSX.Element => {
  return (
    <div className="social-divider">
      <div className="social-divider__row">
        <div className="social-divider__line" />
        <span className="social-divider__text">Nuevo Jugador / Jokalari Berria</span>
        <div className="social-divider__line" />
      </div>
      <button type="button" className="social-divider__register" onClick={onSwitchToRegister}>
        Crear cuenta gratis / Sortu doako kontua
      </button>
    </div>
  );
};

export default SocialDivider;