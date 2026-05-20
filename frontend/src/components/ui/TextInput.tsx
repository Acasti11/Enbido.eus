import React from 'react';

interface TextInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isRequired?: boolean;
}

const TextInput = ({ label, name, type = 'text', value, onChange, isRequired }: TextInputProps): React.JSX.Element => {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <input
        className="form-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={isRequired}
      />
    </div>
  );
};

export default TextInput;