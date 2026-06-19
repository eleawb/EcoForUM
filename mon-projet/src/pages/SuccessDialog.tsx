import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from "@mui/material";

interface SuccessDialogProps {
  open: boolean;
  message: string;
  onGoHome: () => void;
  onStay: () => void;
}

export function SuccessDialog({
  open,
  message,
  onGoHome,
  onStay,
}: SuccessDialogProps) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogContent>
        <Stack spacing={2} alignItems="center">
          <CheckCircleIcon color="success" sx={{ fontSize: 80 }} />

          <Typography variant="h5">
            Intégration réussie
          </Typography>

          <Typography textAlign="center">
            {message}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onStay}>
          Rester ici
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={onGoHome}
        >
          Retour à l'accueil
        </Button>
      </DialogActions>
    </Dialog>
  );
}