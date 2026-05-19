import React from 'react';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label: string;
  name: string;
  value: string;
  options: RadioOption[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isRequired?: boolean;
}

const RadioGroup = ({ label, name, value, options, onChange, isRequired }: RadioGroupProps): React.JSX.Element => {
  const renderOptions = (): React.JSX.Element[] => {
    return options.map((option) => (
      <label key={option.value} className="radio-option">
        <input 
          type="radio" 
          name={name} 
          value={option.value} 
          checked={value === option.value} 
          onChange={onChange} 
          required={isRequired} 
        />
        {option.label}
      </label>
    ));
  };

  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="radio-group-box">
        {renderOptions()}
      </div>
    </div>
  );
};

export default RadioGroup;