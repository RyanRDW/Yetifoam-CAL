/**
 * Openings Modal Component
 * Modal dialog for managing door/window openings
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
} from '@mui/material';
import { OPENING_TYPES } from './types';
import type { OpeningType } from '../../state/formSchema';

interface OpeningsModalProps {
  open: boolean;
  openings: Record<OpeningType, number>;
  onClose: () => void;
  onSave: (openings: Record<OpeningType, number>) => void;
}

export default function OpeningsModal({ open, openings, onClose, onSave }: OpeningsModalProps) {
  const [localOpenings, setLocalOpenings] = useState(openings);

  const handleChange = (type: OpeningType, value: string) => {
    const num = parseInt(value, 10);
    setLocalOpenings((prev) => ({
      ...prev,
      [type]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleSave = () => {
    onSave(localOpenings);
  };

  const handleClose = () => {
    setLocalOpenings(openings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Openings</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the number of each type of opening to deduct from the spray area.
          </Typography>
          <Grid container spacing={2}>
            {OPENING_TYPES.map((opening) => (
              <Grid item xs={12} sm={6} key={opening.value}>
                <TextField
                  fullWidth
                  label={opening.label}
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={localOpenings[opening.value]}
                  onChange={(e) => handleChange(opening.value, e.target.value)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
