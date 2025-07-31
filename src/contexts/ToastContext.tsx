import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material';

/**
 * Entity types for toast messages
 */
export type EntityType = 
  | 'proxy-host'
  | 'redirection-host'
  | 'dead-host'
  | 'stream'
  | 'certificate'
  | 'access-list'
  | 'user'
  | 'settings'
  | 'audit-log';

/**
 * Toast message configuration
 */
export interface ToastMessage {
  id: string;
  message: string;
  severity: AlertColor;
  entityType?: EntityType;
  entityName?: string;
  entityId?: number | string;
  duration?: number;
}

/**
 * Toast context value
 */
interface ToastContextValue {
  showToast: (message: Omit<ToastMessage, 'id'>) => void;
  showSuccess: (entityType: EntityType, action: string, entityName?: string, entityId?: number | string) => void;
  showError: (entityType: EntityType, action: string, error?: string, entityName?: string, entityId?: number | string) => void;
  showInfo: (message: string, entityType?: EntityType, entityName?: string) => void;
  showWarning: (message: string, entityType?: EntityType, entityName?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Slide transition for toast
 */
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

/**
 * Format entity type for display
 */
function formatEntityType(entityType: EntityType): string {
  const formats: Record<EntityType, string> = {
    'proxy-host': 'Proxy Host',
    'redirection-host': 'Redirection Host',
    'dead-host': '404 Host',
    'stream': 'Stream',
    'certificate': 'Certificate',
    'access-list': 'Access List',
    'user': 'User',
    'settings': 'Settings',
    'audit-log': 'Audit Log',
  };
  return formats[entityType] || entityType;
}

/**
 * Toast provider component
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);

  // Process next toast in queue
  const processNextToast = useCallback(() => {
    setToasts((prev) => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        setCurrentToast(next);
        return rest;
      }
      return prev;
    });
  }, []);

  // Show generic toast
  const showToast = useCallback((config: Omit<ToastMessage, 'id'>) => {
    const toast: ToastMessage = {
      ...config,
      id: `${Date.now()}-${Math.random()}`,
      duration: config.duration || 6000,
    };

    if (!currentToast) {
      setCurrentToast(toast);
    } else {
      setToasts((prev) => [...prev, toast]);
    }
  }, [currentToast]);

  // Show success toast
  const showSuccess = useCallback((
    entityType: EntityType,
    action: string,
    entityName?: string,
    entityId?: number | string
  ) => {
    let message = `${formatEntityType(entityType)} ${action} successfully`;
    if (entityName) {
      message = `${formatEntityType(entityType)} "${entityName}" ${action} successfully`;
    } else if (entityId) {
      message = `${formatEntityType(entityType)} #${entityId} ${action} successfully`;
    }

    showToast({
      message,
      severity: 'success',
      entityType,
      entityName,
      entityId,
    });
  }, [showToast]);

  // Show error toast
  const showError = useCallback((
    entityType: EntityType,
    action: string,
    error?: string,
    entityName?: string,
    entityId?: number | string
  ) => {
    let message = `Failed to ${action} ${formatEntityType(entityType).toLowerCase()}`;
    if (entityName) {
      message = `Failed to ${action} ${formatEntityType(entityType).toLowerCase()} "${entityName}"`;
    } else if (entityId) {
      message = `Failed to ${action} ${formatEntityType(entityType).toLowerCase()} #${entityId}`;
    }
    
    if (error) {
      message += `: ${error}`;
    }

    showToast({
      message,
      severity: 'error',
      entityType,
      entityName,
      entityId,
      duration: 8000, // Longer duration for errors
    });
  }, [showToast]);

  // Show info toast
  const showInfo = useCallback((
    message: string,
    entityType?: EntityType,
    entityName?: string
  ) => {
    showToast({
      message,
      severity: 'info',
      entityType,
      entityName,
    });
  }, [showToast]);

  // Show warning toast
  const showWarning = useCallback((
    message: string,
    entityType?: EntityType,
    entityName?: string
  ) => {
    showToast({
      message,
      severity: 'warning',
      entityType,
      entityName,
    });
  }, [showToast]);

  const handleClose = useCallback(() => {
    setCurrentToast(null);
    // Process next toast after a short delay
    setTimeout(processNextToast, 100);
  }, [processNextToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
      {currentToast && (
        <Snackbar
          open={true}
          autoHideDuration={currentToast.duration}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          sx={{ mt: 8 }} // Add margin to avoid overlapping with header
        >
          <Alert
            onClose={handleClose}
            severity={currentToast.severity}
            variant="filled"
            sx={{ width: '100%', maxWidth: 500 }}
          >
            {currentToast.message}
          </Alert>
        </Snackbar>
      )}
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast functionality
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}