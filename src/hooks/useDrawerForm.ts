import { useState, useCallback, useEffect, useRef } from 'react';
import { getErrorMessage } from '../types/common';

/**
 * Validation function type
 */
export type ValidationFunction<T> = (value: T, formData?: any) => string | null;

/**
 * Field configuration for form management
 */
export interface FieldConfig<T = any> {
  /** Initial value for the field */
  initialValue: T;
  /** Validation function */
  validate?: ValidationFunction<T>;
  /** Whether the field is required */
  required?: boolean;
  /** Custom required message */
  requiredMessage?: string;
  /** Whether to validate on change (default: true) */
  validateOnChange?: boolean;
  /** Whether to validate on blur (default: true) */
  validateOnBlur?: boolean;
}

/**
 * Form configuration options
 */
export interface UseDrawerFormOptions<T> {
  /** Initial form data */
  initialData: T;
  /** Field configurations */
  fields?: Partial<Record<keyof T, FieldConfig>>;
  /** Global validation function */
  validate?: (data: T) => Record<keyof T, string> | null;
  /** Submit handler */
  onSubmit: (data: T) => Promise<void> | void;
  /** Success callback */
  onSuccess?: (data: T) => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Auto-save configuration */
  autoSave?: {
    /** Enable auto-save */
    enabled: boolean;
    /** Delay in milliseconds (default: 2000) */
    delay?: number;
    /** Auto-save handler */
    onAutoSave: (data: T) => Promise<void> | void;
  };
  /** Custom equality function for dirty checking */
  isEqual?: (a: T, b: T) => boolean;
  /** Whether to reset form after successful submit */
  resetOnSubmit?: boolean;
}

/**
 * Form state interface
 */
export interface FormState<T> {
  /** Current form data */
  data: T;
  /** Field errors */
  errors: Partial<Record<keyof T, string>>;
  /** Global form error */
  globalError: string | null;
  /** Whether form is currently submitting */
  loading: boolean;
  /** Whether form has been modified */
  isDirty: boolean;
  /** Which fields have been touched */
  touched: Partial<Record<keyof T, boolean>>;
  /** Whether form is valid */
  isValid: boolean;
  /** Auto-save status */
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  /** Whether form has been submitted at least once */
  hasSubmitted: boolean;
}

/**
 * Default equality function for dirty checking
 */
const defaultIsEqual = <T>(a: T, b: T): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

/**
 * useDrawerForm - Advanced form state management hook for drawer components
 * 
 * This hook provides comprehensive form management including:
 * - Field-level and global validation
 * - Auto-save functionality with debouncing
 * - Dirty state tracking and touch management
 * - Loading states and error handling
 * - Easy field binding with getFieldProps
 * 
 * @example
 * ```tsx
 * const form = useDrawerForm({
 *   initialData: { name: '', email: '', port: 80 },
 *   fields: {
 *     name: { initialValue: '', required: true },
 *     email: { 
 *       initialValue: '', 
 *       validate: (value) => {
 *         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 *         return emailRegex.test(value) ? null : 'Invalid email address';
 *       }
 *     },
 *     port: {
 *       initialValue: 80,
 *       validate: (value) => {
 *         return value >= 1 && value <= 65535 ? null : 'Port must be between 1-65535';
 *       }
 *     }
 *   },
 *   onSubmit: async (data) => {
 *     await api.saveData(data);
 *   },
 *   autoSave: {
 *     enabled: true,
 *     delay: 3000,
 *     onAutoSave: async (data) => {
 *       await api.autosave(data);
 *     }
 *   }
 * });
 * 
 * // In component
 * <TextField
 *   {...form.getFieldProps('name')}
 *   label="Name"
 *   required
 * />
 * ```
 */
export const useDrawerForm = <T extends Record<string, any>>({
  initialData,
  fields = {} as Partial<Record<keyof T, FieldConfig>>,
  validate,
  onSubmit,
  onSuccess,
  onError,
  autoSave,
  isEqual = defaultIsEqual,
  resetOnSubmit = false,
}: UseDrawerFormOptions<T>) => {
  // Form state
  const [formState, setFormState] = useState<FormState<T>>(() => ({
    data: { ...initialData },
    errors: {},
    globalError: null,
    loading: false,
    isDirty: false,
    touched: {},
    isValid: true,
    autoSaveStatus: 'idle',
    hasSubmitted: false,
  }));

  // Refs for managing side effects
  const initialDataRef = useRef(initialData);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const isSubmittingRef = useRef(false);

  /**
   * Validate a single field
   */
  const validateField = useCallback((key: keyof T, value: any, data?: T): string | null => {
    const fieldConfig = fields[key];
    
    // Required validation
    if (fieldConfig?.required && (value === '' || value == null)) {
      return fieldConfig.requiredMessage || `${String(key)} is required`;
    }
    
    // Custom validation
    if (fieldConfig?.validate) {
      return fieldConfig.validate(value, data || formState.data);
    }
    
    return null;
  }, [fields, formState.data]);

  /**
   * Validate all fields
   */
  const validateAllFields = useCallback((data: T): Record<keyof T, string> => {
    const errors: Partial<Record<keyof T, string>> = {};
    
    // Field-level validation
    Object.keys(data).forEach((key) => {
      const fieldKey = key as keyof T;
      const error = validateField(fieldKey, data[fieldKey], data);
      if (error) {
        errors[fieldKey] = error;
      }
    });
    
    // Global validation
    if (validate) {
      const globalErrors = validate(data);
      if (globalErrors) {
        Object.assign(errors, globalErrors);
      }
    }
    
    return errors as Record<keyof T, string>;
  }, [validateField, validate]);

  /**
   * Update form data
   */
  const setFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFormState((prev) => {
      const newData = typeof updates === 'function' 
        ? updates(prev.data)
        : { ...prev.data, ...updates };
      
      // Validate if form has been submitted before
      let errors = prev.errors;
      let isValid = prev.isValid;
      
      if (prev.hasSubmitted) {
        errors = validateAllFields(newData);
        isValid = Object.keys(errors).length === 0;
      }
      
      const isDirty = !isEqual(newData, initialDataRef.current);
      
      return {
        ...prev,
        data: newData,
        errors,
        isDirty,
        isValid,
        globalError: null,
      };
    });
  }, [isEqual, validateAllFields]);

  /**
   * Update a single field value
   */
  const setFieldValue = useCallback((key: keyof T, value: any) => {
    setFormState((prev) => {
      const newData = { ...prev.data, [key]: value };
      
      // Validate if form has been submitted before
      let errors = prev.errors;
      let isValid = prev.isValid;
      
      if (prev.hasSubmitted) {
        errors = validateAllFields(newData);
        isValid = Object.keys(errors).length === 0;
      }
      
      const isDirty = !isEqual(newData, initialDataRef.current);
      
      return {
        ...prev,
        data: newData,
        errors,
        isDirty,
        isValid,
        touched: { ...prev.touched, [key]: true },
        globalError: null,
      };
    });
  }, [isEqual, validateAllFields]);

  /**
   * Mark field as touched
   */
  const setFieldTouched = useCallback((key: keyof T, touched = true) => {
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [key]: touched },
    }));
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback((newInitialData?: T) => {
    const resetData = newInitialData || initialDataRef.current;
    if (newInitialData) {
      initialDataRef.current = newInitialData;
    }
    
    setFormState({
      data: { ...resetData },
      errors: {},
      globalError: null,
      loading: false,
      isDirty: false,
      touched: {},
      isValid: true,
      autoSaveStatus: 'idle',
      hasSubmitted: false,
    });
  }, []);

  /**
   * Mark form as clean by updating initial data reference
   */
  const markAsClean = useCallback(() => {
    initialDataRef.current = { ...formState.data };
    setFormState((prev) => ({ ...prev, isDirty: false }));
  }, [formState.data]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    if (isSubmittingRef.current) return;
    
    const errors = validateAllFields(formState.data);
    if (Object.keys(errors).length > 0) {
      setFormState((prev) => ({ ...prev, errors, isValid: false, hasSubmitted: true }));
      return;
    }
    
    isSubmittingRef.current = true;
    setFormState((prev) => ({ ...prev, loading: true, globalError: null }));
    
    try {
      await onSubmit(formState.data);
      
      if (resetOnSubmit) {
        resetForm(formState.data);
      } else {
        initialDataRef.current = { ...formState.data };
        setFormState((prev) => ({ ...prev, isDirty: false }));
      }
      
      onSuccess?.(formState.data);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setFormState((prev) => ({ ...prev, globalError: errorMessage }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      isSubmittingRef.current = false;
      setFormState((prev) => ({ ...prev, loading: false }));
    }
  }, [formState.data, validateAllFields, onSubmit, onSuccess, onError, resetOnSubmit, resetForm]);

  /**
   * Auto-save functionality
   */
  useEffect(() => {
    if (!autoSave?.enabled || !formState.isDirty || formState.loading) {
      return;
    }
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!formState.isValid) return;
      
      setFormState((prev) => ({ ...prev, autoSaveStatus: 'saving' }));
      
      try {
        await autoSave.onAutoSave(formState.data);
        setFormState((prev) => ({ ...prev, autoSaveStatus: 'saved' }));
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setFormState((prev) => ({ ...prev, autoSaveStatus: 'idle' }));
        }, 2000);
      } catch (error) {
        setFormState((prev) => ({ ...prev, autoSaveStatus: 'error' }));
        console.error('Auto-save failed:', error);
      }
    }, autoSave.delay || 2000);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formState.data, formState.isDirty, formState.isValid, formState.loading, autoSave]);

  /**
   * Get field props for easy binding to input components
   */
  const getFieldProps = useCallback((key: keyof T) => {
    const fieldConfig = fields[key];
    const hasError = Boolean(formState.errors[key] && formState.touched[key]);
    
    return {
      name: String(key),
      value: formState.data[key] ?? '',
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.type === 'number' 
          ? Number(event.target.value)
          : event.target.value;
        setFieldValue(key, value);
      },
      onBlur: () => {
        setFieldTouched(key, true);
        // Don't validate on blur
      },
      error: hasError,
      helperText: hasError ? formState.errors[key] : undefined,
      disabled: formState.loading,
    };
  }, [fields, formState.data, formState.errors, formState.touched, formState.loading, setFieldValue, setFieldTouched, validateField]);


  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    ...formState,
    
    // Actions
    setFormData,
    setFieldValue,
    setFieldTouched,
    resetForm,
    handleSubmit,
    markAsClean,
    
    // Helpers
    getFieldProps,
    validateField,
    validateAllFields,
  };
};

export default useDrawerForm;