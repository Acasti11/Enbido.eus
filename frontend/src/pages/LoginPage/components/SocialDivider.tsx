import React from 'react';
import './social-divider.css';
interface LoginFormProps {
  onSwitchToRegister: () => void; 
}
const SocialDivider: React.FC<LoginFormProps> = ({ onSwitchToRegister }): React.JSX.Element => {
  return (
    <div className="social-divider">
      <div className="social-divider__row">
        <div className="social-divider__line" />
        <span className="social-divider__text">New Player</span>
        <div className="social-divider__line" />
      </div>
      <button type="button" className="social-divider__register" onClick={onSwitchToRegister}>
        Create free account
      </button>
    </div>
  );
};

export default SocialDivider;