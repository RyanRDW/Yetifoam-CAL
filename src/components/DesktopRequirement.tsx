/**
 * Desktop Requirement Notice
 * Displays warning message for mobile/tablet users
 */

import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { DesktopWindows } from '@mui/icons-material';

export default function DesktopRequirement() {
  return (
    <Box
      sx={{
        display: 'none',
        '@media (max-width: 1279px)': {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 4,
          bgcolor: 'background.default',
        },
      }}
    >
      <Alert
        severity="warning"
        icon={<DesktopWindows fontSize="large" />}
        sx={{
          maxWidth: 600,
          '& .MuiAlert-icon': {
            fontSize: 48,
          },
        }}
      >
        <AlertTitle sx={{ fontSize: 24, fontWeight: 700 }}>Desktop Required</AlertTitle>
        <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
          The Yetifam Calculator is designed for desktop use and requires a minimum screen width
          of 1280px.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Please access this application from a desktop or laptop computer for the best experience.
        </Typography>
      </Alert>
    </Box>
  );
}
