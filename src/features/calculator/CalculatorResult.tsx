/**
 * Calculator Result Component
 * Displays calculation results with breakdown
 */

import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Chip,
  Alert,
  Skeleton,
  Grid,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { formatArea } from './logic';
import type { CalculationResult } from './logic';

interface CalculatorResultProps {
  result: CalculationResult | null;
  loading?: boolean;
}

export default function CalculatorResult({ result, loading }: CalculatorResultProps) {
  if (loading) {
    return (
      <Card elevation={1}>
        <CardContent>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Alert severity="info">
        Complete the form above and click Calculate to see your results.
      </Alert>
    );
  }

  const { configuration, breakdown } = result;

  return (
    <Stack spacing={3}>
      {/* All Results in One Card */}
      <Card elevation={1}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <CheckCircle color="success" />
            <Typography variant="h3">Calculation Complete</Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Left Column - Configuration Summary */}
            <Grid item xs={3}>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Dimensions
                  </Typography>
                  <Typography variant="body2">{configuration.dimensions}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pitch
                  </Typography>
                  <Typography variant="body2">{configuration.pitchLabel}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Cladding
                  </Typography>
                  <Typography variant="body2">{configuration.cladding}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Members
                  </Typography>
                  <Typography variant="body2">{configuration.members}</Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Middle Column - Total Spray Area */}
            <Grid item xs={3}>
              <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2, borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  Total Spray Area
                </Typography>
                <Typography variant="h2" sx={{ my: 1 }}>{formatArea(breakdown.netTotal)}</Typography>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                  Net area after deductions
                </Typography>
              </Box>
            </Grid>

            {/* Right Column - Area Breakdown */}
            <Grid item xs={6}>
              <Typography variant="h5" gutterBottom>
                Area Breakdown
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Surface</TableCell>
                      <TableCell align="right">Area</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Roof</TableCell>
                      <TableCell align="right">{formatArea(breakdown.roofBase)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Side Walls</TableCell>
                      <TableCell align="right">{formatArea(breakdown.sideWalls)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Gable Rectangles</TableCell>
                      <TableCell align="right">{formatArea(breakdown.gableRectangles)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Gable Triangles</TableCell>
                      <TableCell align="right">{formatArea(breakdown.gableTriangles)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Surfaces Subtotal</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatArea(breakdown.surfacesSubtotal)}
                      </TableCell>
                    </TableRow>
                    {breakdown.openingsDeducted > 0 && (
                      <TableRow>
                        <TableCell>Openings Deducted</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>
                          -{formatArea(breakdown.openingsDeducted)}
                        </TableCell>
                      </TableRow>
                    )}
                    {breakdown.roofBattens !== null && breakdown.roofBattens > 0 && (
                      <TableRow>
                        <TableCell>Roof Battens</TableCell>
                        <TableCell align="right">{formatArea(breakdown.roofBattens)}</TableCell>
                      </TableRow>
                    )}
                    {breakdown.wallPurlins !== null && breakdown.wallPurlins > 0 && (
                      <TableRow>
                        <TableCell>Wall Purlins</TableCell>
                        <TableCell align="right">{formatArea(breakdown.wallPurlins)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow sx={{ bgcolor: 'success.light' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Net Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatArea(breakdown.netTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Opening Details */}
      {breakdown.openingDetails.length > 0 && (
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Opening Details
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {breakdown.openingDetails.map((opening) => (
                <Chip
                  key={opening.id}
                  label={`${opening.label}: ${opening.quantity}× (${formatArea(opening.area / opening.quantity)})`}
                  size="small"
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
