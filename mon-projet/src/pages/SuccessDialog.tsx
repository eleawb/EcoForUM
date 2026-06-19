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
  titre: string;
  message: string;
  nomBoutonRestart: string;
  onGoHome: () => void;
  onStay: () => void;
}

export function SuccessDialog({
  open,
  titre,
  message,
  nomBoutonRestart,
  onGoHome,
  onStay,
}: SuccessDialogProps) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogContent>
        <Stack spacing={2} alignItems="center">
          <CheckCircleIcon color="success" sx={{ fontSize: 80 }} />

          <Typography variant="h5">
            {titre}
          </Typography>

          <Typography textAlign="center">
            {message}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
            justifyContent: "center",
            gap: 2,
            pb: 3,
        }}
      >
        <Button 
        variant="contained"
        color="success"
        onClick={onStay}>
        {nomBoutonRestart}
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