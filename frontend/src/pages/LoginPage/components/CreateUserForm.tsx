import React from 'react';
import RegisterForm from '../../../components/auth/RegisterForm';

interface CreateUserFormProps {
  onSwitchToLogin: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  return <RegisterForm onSwitchToLogin={onSwitchToLogin} />;
};

export default CreateUserForm;
