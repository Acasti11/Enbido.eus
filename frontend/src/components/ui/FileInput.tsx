import React from 'react';

interface FileInputProps {
  label: string;
  name: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isRequired?: boolean;
}

const FileInput = ({ label, name, onChange, isRequired }: FileInputProps): React.JSX.Element => {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      // Creates a synthetic event object to match the expected format
      const syntheticEvent = {
        target: { name, value: reader.result as string }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <input
        className="form-input"
        type="file"
        name={name}
        accept="image/*"
        onChange={handleFileSelect}
        required={isRequired}
      />
    </div>
  );
};

export default FileInput;