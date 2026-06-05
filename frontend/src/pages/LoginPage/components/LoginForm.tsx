import React from 'react';
import LoginFormComponent from '../../../components/auth/LoginForm';

interface LoginFormProps {
  onSwitchToRecover: () => void;
  on2FaStatusChange?: (isActive: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRecover, on2FaStatusChange }): React.JSX.Element => {
  return (
    <LoginFormComponent
      onSwitchToRecover={onSwitchToRecover}
      on2FaStatusChange={on2FaStatusChange}
    />
  );
};

export default LoginForm;
