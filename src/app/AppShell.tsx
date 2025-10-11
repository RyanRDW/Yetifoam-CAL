/**
 * AppShell - Main application layout container
 * Desktop-only application optimized for 1280px+ screens
 */

import { Outlet } from 'react-router-dom';
import { CssBaseline, Container, Box } from '@mui/material';

export default function AppShell() {
  return (
    <>
      <CssBaseline />
      <Box
        component="main"
        role="main"
        sx={{
          minHeight: '100vh',
          minWidth: 1280,
          bgcolor: 'background.default',
          py: 4,
        }}
      >
        <Container maxWidth="xl" sx={{ minWidth: 1280 }}>
          <Outlet />
        </Container>
      </Box>
    </>
  );
}
