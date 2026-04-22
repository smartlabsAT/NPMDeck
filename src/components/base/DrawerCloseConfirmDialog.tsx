import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

/**
 * Props for DrawerCloseConfirmDialog
 */
export interface DrawerCloseConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Message to display in the dialog body */
  message: string;
  /** Called when the user confirms closing without saving */
  onConfirm: () => void;
  /** Called when the user cancels and returns to editing */
  onCancel: () => void;
}

/**
 * DrawerCloseConfirmDialog - Confirmation dialog shown when closing a drawer with unsaved changes
 */
const DrawerCloseConfirmDialog = ({
  open,
  message,
  onConfirm,
  onCancel,
}: DrawerCloseConfirmDialogProps) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <WarningIcon color="warning" />
      Unsaved Changes
    </DialogTitle>
    <DialogContent>
      <Typography>{message}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Continue Editing</Button>
      <Button onClick={onConfirm} color="warning" variant="contained">
        Close Without Saving
      </Button>
    </DialogActions>
  </Dialog>
);

export default DrawerCloseConfirmDialog;
