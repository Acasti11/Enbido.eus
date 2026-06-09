import { useState, useCallback } from 'react';

export type FieldValidator<T> = (value: T) => string | undefined;

export interface UseFormValidationOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validators: Partial<Record<keyof T, FieldValidator<T[keyof T]>>>;
  validateOnChange?: boolean;
}

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setTouched: <K extends keyof T>(field: K, value?: boolean) => void;
  validateField: <K extends keyof T>(field: K, value?: T[K]) => boolean;
  validateAll: () => boolean;
  resetForm: () => void;
  getFieldError: <K extends keyof T>(field: K) => string | undefined;
  getFieldState: <K extends keyof T>(field: K) => 'default' | 'error' | 'success';
}

export function useFormValidation<T extends Record<string, unknown>>(
  options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
  const { initialValues, validators, validateOnChange = true } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (validateOnChange && touched[field]) {
      const validator = validators[field];
      if (validator) {
        const error = validator(value);
        setErrors((prev) => {
          const next = { ...prev };
          if (error) {
            next[field] = error;
          } else {
            delete next[field];
          }
          return next;
        });
      }
    }
  }, [validators, touched, validateOnChange]);

  const setTouched = useCallback(<K extends keyof T>(field: K, value: boolean = true) => {
    setTouchedState((prev) => ({ ...prev, [field]: value }));
    if (validateOnChange && value) {
      const validator = validators[field];
      if (validator) {
        const error = validator(values[field]);
        setErrors((prev) => {
          const next = { ...prev };
          if (error) {
            next[field] = error;
          } else {
            delete next[field];
          }
          return next;
        });
      }
    }
  }, [validators, values, validateOnChange]);

  const validateField = useCallback(<K extends keyof T>(field: K, value?: T[K]): boolean => {
    const validator = validators[field];
    if (!validator) return true;
    const val = value !== undefined ? value : values[field];
    const error = validator(val);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
    return !error;
  }, [validators, values]);

  const validateAll = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    (Object.keys(validators) as Array<keyof T>).forEach((field) => {
      const validator = validators[field];
      if (validator) {
        const error = validator(values[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    setTouchedState(
      (Object.keys(values) as Array<keyof T>).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      )
    );
    return isValid;
  }, [validators, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldError = useCallback(<K extends keyof T>(field: K): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  }, [errors, touched]);

  const getFieldState = useCallback(<K extends keyof T>(field: K): 'default' | 'error' | 'success' => {
    if (!touched[field]) return 'default';
    if (errors[field]) return 'error';
    return 'success';
  }, [errors, touched]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    setValue,
    setTouched,
    validateField,
    validateAll,
    resetForm,
    getFieldError,
    getFieldState,
  };
}
