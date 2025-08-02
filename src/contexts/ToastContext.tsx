import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertColor, 
  Slide, 
  SlideProps, 
  Box, 
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  // Entity icons
  Language as ProxyIcon,
  TrendingFlat as RedirectionIcon,
  Block as DeadHostIcon,
  Stream as StreamIcon,
  Security as CertificateIcon,
  Lock as AccessListIcon,
  Person as UserIcon,
  Settings as SettingsIcon,
  History as AuditLogIcon,
} from '@mui/icons-material';

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
 * Action types
 */
export type ActionType = 'create' | 'update' | 'delete' | 'created' | 'updated' | 'deleted' | 'enable' | 'enabled' | 'disable' | 'disabled';

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
  action?: ActionType;
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
 * Get entity icon
 */
function getEntityIcon(entityType: EntityType) {
  const icons: Record<EntityType, React.ElementType> = {
    'proxy-host': ProxyIcon,
    'redirection-host': RedirectionIcon,
    'dead-host': DeadHostIcon,
    'stream': StreamIcon,
    'certificate': CertificateIcon,
    'access-list': AccessListIcon,
    'user': UserIcon,
    'settings': SettingsIcon,
    'audit-log': AuditLogIcon,
  };
  return icons[entityType] || InfoIcon;
}

/**
 * Get action icon
 */
function getActionIcon(action?: ActionType) {
  if (!action) return null;
  
  const icons: Record<ActionType, React.ElementType> = {
    'create': AddIcon,
    'created': AddIcon,
    'update': EditIcon,
    'updated': EditIcon,
    'delete': DeleteIcon,
    'deleted': DeleteIcon,
    'enable': CheckIcon,
    'enabled': CheckIcon,
    'disable': ErrorIcon,
    'disabled': ErrorIcon,
  };
  return icons[action] || null;
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
 * Custom Toast Component
 */
export function CustomToast({ toast, onClose, demo = false }: { toast: ToastMessage; onClose: () => void; demo?: boolean }) {
  const theme = useTheme();
  const EntityIcon = toast.entityType ? getEntityIcon(toast.entityType) : InfoIcon;
  const ActionIcon = getActionIcon(toast.action);
  
  // Get severity icon
  const getSeverityIcon = () => {
    switch (toast.severity) {
      case 'success':
        return CheckIcon;
      case 'error':
        return ErrorIcon;
      case 'warning':
        return WarningIcon;
      case 'info':
      default:
        return InfoIcon;
    }
  };
  
  const SeverityIcon = getSeverityIcon();

  // For demo mode, just return the Alert without Snackbar wrapper
  if (demo) {
    return (
      <Alert
        onClose={onClose}
        severity={toast.severity}
        variant="filled"
        sx={{ 
          width: '100%', 
          maxWidth: 500,
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette[toast.severity].main, 0.9)
            : theme.palette[toast.severity].main,
          '& .MuiAlert-icon': {
            display: 'none' // We'll use custom icon layout
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Icon section */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flexShrink: 0,
            mt: 0.25
          }}>
            {ActionIcon ? (
              <Box sx={{ position: 'relative' }}>
                <EntityIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? theme.palette.background.paper
                      : 'white',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActionIcon sx={{ fontSize: 12, color: theme.palette[toast.severity].main }} />
                </Box>
              </Box>
            ) : (
              <SeverityIcon sx={{ fontSize: 24 }} />
            )}
          </Box>
          
          {/* Content section */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {toast.entityType && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  opacity: 0.9,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.65rem',
                  mb: 0.25
                }}
              >
                {formatEntityType(toast.entityType)}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                wordBreak: 'break-word'
              }}
            >
              {toast.message}
            </Typography>
          </Box>
        </Box>
      </Alert>
    );
  }

  return (
    <Snackbar
      open={true}
      autoHideDuration={toast.duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
      sx={{ mt: 8 }} // Add margin to avoid overlapping with header
    >
      <Alert
        onClose={onClose}
        severity={toast.severity}
        variant="filled"
        sx={{ 
          width: '100%', 
          maxWidth: 500,
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette[toast.severity].main, 0.9)
            : theme.palette[toast.severity].main,
          '& .MuiAlert-icon': {
            display: 'none' // We'll use custom icon layout
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Icon section */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flexShrink: 0,
            mt: 0.25
          }}>
            {ActionIcon ? (
              <Box sx={{ position: 'relative' }}>
                <EntityIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? theme.palette.background.paper
                      : 'white',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActionIcon sx={{ fontSize: 12, color: theme.palette[toast.severity].main }} />
                </Box>
              </Box>
            ) : (
              <SeverityIcon sx={{ fontSize: 24 }} />
            )}
          </Box>
          
          {/* Content section */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {toast.entityType && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  opacity: 0.9,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.65rem',
                  mb: 0.25
                }}
              >
                {formatEntityType(toast.entityType)}
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                wordBreak: 'break-word'
              }}
            >
              {toast.message}
            </Typography>
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
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
      action: action as ActionType,
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
      action: action as ActionType,
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
        <CustomToast 
          toast={currentToast} 
          onClose={handleClose} 
        />
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