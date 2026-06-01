import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import api from '../../../services/api';
import type { User } from '../../../types/User';
import '../styles/login-form.css';

const UserIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="login-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

interface CreateUserFormProps {
  onSwitchToLogin: () => void;
}

type FormField = 'name' | 'surname' | 'email' | 'username' | 'password' | 'phone_number' | 'postal_code' | 'birthDate';

interface FormErrors extends Partial<Record<FormField, string>> {
  general?: string;
}

type FormTouched = Partial<Record<FormField, boolean>>;

const REQUIRED_FIELDS: FormField[] = ['name', 'email', 'password', 'username', 'birthDate'];

type UserFormData = Omit<User, 'user_id' | 'role' | 'is_banned' | 'created_at'>;

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const createHandleChange = (
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>,
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>
) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value } as UserFormData));
  setErrors(prev => {
    if (!prev[name as FormField]) return prev;
    const next = { ...prev };
    delete next[name as FormField];
    return next;
  });
};

const createHandleBlur = (
  setTouched: React.Dispatch<React.SetStateAction<FormTouched>>,
  formData: UserFormData,
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>,
  t: TranslateFn
) => (e: React.FocusEvent<HTMLInputElement>) => {
  const { name } = e.target;
  setTouched(prev => ({ ...prev, [name]: true }));
  validateUserField(name as FormField, formData[name as FormField], setErrors, t);
};

const validateUserField = (
  fieldName: FormField,
  value: string | undefined,
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>,
  t: TranslateFn
): boolean => {
  if (REQUIRED_FIELDS.includes(fieldName) && (!value || !value.trim())) {
    setErrors(prev => ({ ...prev, [fieldName]: t('login.requiredField') }));
    return false;
  }
  if (fieldName === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    setErrors(prev => ({ ...prev, [fieldName]: t('login.invalidEmail') }));
    return false;
  }
  if (fieldName === 'birthDate' && value) {
    const birthDate = new Date(value);
    const today = new Date();
    if (birthDate >= today) {
      setErrors(prev => ({ ...prev, [fieldName]: t('login.invalidBirthDate') }));
      return false;
    }
  }
  return true;
};

const validateAllFields = (
  formData: UserFormData,
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>,
  setTouched: React.Dispatch<React.SetStateAction<FormTouched>>,
  t: TranslateFn
): boolean => {
  let isValid = true;
  const nextErrors: FormErrors = {};
  REQUIRED_FIELDS.forEach(field => {
    const val = formData[field];
    if (!val || !val.trim()) {
      nextErrors[field] = t('login.requiredField');
      isValid = false;
    }
  });
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    nextErrors.email = t('login.invalidEmail');
    isValid = false;
  }
  setErrors(nextErrors);
  setTouched(REQUIRED_FIELDS.reduce((acc, field) => ({ ...acc, [field]: true }), {} as Record<FormField, boolean>));
  return isValid;
};

const submitCreateUserForm = async (
  formData: UserFormData,
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>,
  setTouched: React.Dispatch<React.SetStateAction<FormTouched>>,
  setSuccess: React.Dispatch<React.SetStateAction<string>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  onSwitchToLogin: () => void,
  t: TranslateFn
) => {
  setSuccess('');
  if (!validateAllFields(formData, setErrors, setTouched, t)) return;
  setLoading(true);
  try {
    const payload = {
      name: formData.name,
      surname: formData.surname?.trim() || null,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phone_number?.trim() || null,
      postalCode: formData.postal_code?.trim() || null,
      birthDate: formData.birthDate,
      username: formData.username
    };
    await api.post('/usuarios', payload);
    setSuccess(t('login.successCreateAccount'));
    setTimeout(() => onSwitchToLogin(), 2000);
  } catch (err) {
    const axiosError = err as AxiosError;
    const errorMsg = axiosError.response?.data || t('login.errorCreateAccount');
    setErrors({ general: typeof errorMsg === 'string' ? errorMsg : t('login.errorCreateAccount') });
  } finally {
    setLoading(false);
  }
};

interface FormInputProps {
  name: string;
  type?: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  error?: string;
  required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  icon,
  error,
  required
}): React.JSX.Element => (
  <div className="login-form__field">
    <label className="login-form__label">
      {label}
      {required && <span> *</span>}
    </label>
    <div className={`login-form__input-wrapper ${error ? 'login-form__input-wrapper--error' : ''}`}>
      {icon}
      <input
        name={name}
        type={type}
        className="login-form__input"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
      />
    </div>
    {error && <span className="login-form__field-error">{error}</span>}
  </div>
);

const getFieldError = (
  fieldName: FormField,
  touched: FormTouched,
  errors: FormErrors
): string | undefined => touched[fieldName] ? errors[fieldName] : undefined;

interface CreateUserFieldsProps {
  formData: UserFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  fieldError: (field: FormField) => string | undefined;
  t: TranslateFn;
}

const CreateUserFields: React.FC<CreateUserFieldsProps> = ({ formData, handleChange, handleBlur, fieldError, t }): React.JSX.Element => (
  <>
    <FormInput name="name" label={t('login.name')} placeholder={t('login.placeholderName')} value={formData.name} onChange={handleChange} onBlur={handleBlur} icon={<UserIcon />} error={fieldError('name')} required />
    <FormInput name="surname" label={t('login.surname')} placeholder={t('login.placeholderSurname')} value={formData.surname} onChange={handleChange} icon={<UserIcon />} />
    <FormInput name="email" type="email" label={t('login.email')} placeholder={t('login.placeholderEmail')} value={formData.email} onChange={handleChange} onBlur={handleBlur} icon={<MailIcon />} error={fieldError('email')} required />
    <FormInput name="username" label={t('login.username')} placeholder={t('login.placeholderUsername')} value={formData.username} onChange={handleChange} onBlur={handleBlur} icon={<UserIcon />} error={fieldError('username')} required />
    <FormInput name="password" type="password" label={t('login.password')} placeholder={t('login.placeholderPassword')} value={formData.password} onChange={handleChange} onBlur={handleBlur} icon={<LockIcon />} error={fieldError('password')} required />
    <FormInput name="birthDate" type="date" label={t('login.birthDate')} placeholder="" value={formData.birthDate} onChange={handleChange} onBlur={handleBlur} icon={<CalendarIcon />} error={fieldError('birthDate')} required />
    <FormInput name="phone_number" label={t('login.phone')} placeholder={t('login.placeholderPhone')} value={formData.phone_number} onChange={handleChange} icon={<PhoneIcon />} />
    <FormInput name="postal_code" label={t('login.postalCode')} placeholder={t('login.placeholderPostalCode')} value={formData.postal_code} onChange={handleChange} icon={<MapPinIcon />} />
  </>
);

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSwitchToLogin }): React.JSX.Element => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    surname: '',
    email: '',
    username: '',
    password: '',
    phone_number: '',
    postal_code: '',
    birthDate: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const handleChange = createHandleChange(setFormData, setErrors);
  const handleBlur = createHandleBlur(setTouched, formData, setErrors, t);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCreateUserForm(formData, setErrors, setTouched, setSuccess, setLoading, onSwitchToLogin, t);
  };
  const fieldError = (field: FormField) => getFieldError(field, touched, errors);
  return (
    <form className="login-form" onSubmit={onSubmit} noValidate>
      <CreateUserFields formData={formData} handleChange={handleChange} handleBlur={handleBlur} fieldError={fieldError} t={t} />
      {errors.general && <p className="login-form__error">{errors.general}</p>}
      {success && <p className="login-form__success">{success}</p>}
      <button type="submit" className="login-form__submit" disabled={loading}>
        {loading ? t('login.creating') : t('login.createAccount')}
      </button>
      <p className="login-form__switch">
        {t('login.alreadyHaveAccount')}{' '}
        <button type="button" className="login-form__link-button" onClick={onSwitchToLogin} disabled={loading}>
          {t('login.signIn')}
        </button>
      </p>
    </form>
  );
};

export default CreateUserForm;
