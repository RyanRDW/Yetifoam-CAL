/**
 * Calculator Page
 * Desktop-only page optimized for sales staff workflow
 */

import { useState } from 'react';
import { Stack, Typography, Paper, Grid, Box } from '@mui/material';
import CalculatorForm from '../features/calculator/CalculatorForm';
import CalculatorResult from '../features/calculator/CalculatorResult';
import AIPanel from '../features/ai/AIPanel';
import DesktopRequirement from '../components/DesktopRequirement';
import { calculateSprayFoam, formatArea } from '../features/calculator/logic';
import type { CalculatorFormData } from '../features/calculator/types';
import type { CalculationResult } from '../features/calculator/logic';

export default function CalculatorPage() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = (data: CalculatorFormData) => {
    setLoading(true);

    // Simulate brief calculation delay for UX
    setTimeout(() => {
      const calculatedResult = calculateSprayFoam(data);
      setResult(calculatedResult);
      setLoading(false);
    }, 300);
  };

  // Prepare context for AI panel
  const aiContext = result
    ? {
        dimensions: result.configuration.dimensions,
        pitch: result.configuration.pitchLabel,
        cladding: result.configuration.cladding || '—',
        sprayTotal: formatArea(result.breakdown.netTotal),
      }
    : undefined;

  return (
    <>
      {/* Desktop Requirement Notice (hidden on desktop) */}
      <DesktopRequirement />

      {/* Main Content (hidden on mobile/tablet) */}
      <Box
        sx={{
          '@media (max-width: 1279px)': {
            display: 'none',
          },
        }}
      >
        <Stack spacing={4}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h1" gutterBottom>
              Yetifam Calculator
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Desktop estimator for YetiFoam sales staff • Calculate spray foam requirements for
              metal sheds
            </Typography>
          </Box>

          {/* Main Content - Fixed Desktop Layout */}
          <Grid container spacing={3}>
            {/* Left Column - Form (40%) */}
            <Grid item xs={5}>
              <Stack spacing={3}>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <CalculatorForm onCalculate={handleCalculate} />
                </Paper>
              </Stack>
            </Grid>

            {/* Right Column - AI & Results (60%) */}
            <Grid item xs={7}>
              <Stack spacing={3}>
                {/* AI Panel */}
                <AIPanel context={aiContext} />

                {/* Results */}
                <CalculatorResult result={result} loading={loading} />
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </>
  );
}
