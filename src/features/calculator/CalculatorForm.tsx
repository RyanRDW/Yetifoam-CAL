/**
 * Calculator Form Component
 * Main input form for shed dimensions and configuration
 */

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Stack,
  Paper,
  FormHelperText,
} from '@mui/material';
import { Calculate } from '@mui/icons-material';
import OpeningsModal from './OpeningsModal';
import { suggestPitch } from './logic';
import {
  PITCH_OPTIONS,
  CLADDING_OPTIONS,
  MEMBER_OPTIONS,
  type CalculatorFormData,
} from './types';
import type { OpeningType } from '../../state/formSchema';

const formSchema = z.object({
  length: z.number().min(0.1, 'Must be greater than 0').max(50, 'Max 50m'),
  width: z.number().min(0.1, 'Must be greater than 0').max(50, 'Max 50m'),
  height: z.number().min(0.1, 'Must be greater than 0').max(10, 'Max 10m'),
  pitchAngle: z.string().min(1, 'Required'),
  cladding: z.string().min(1, 'Required'),
  roofMember: z.string().min(1, 'Required'),
  wallMember: z.string().min(1, 'Required'),
  includeRoofBattens: z.boolean(),
  includeWallPurlins: z.boolean(),
  openings: z.record(z.number().int().min(0)),
});

interface CalculatorFormProps {
  onCalculate: (data: CalculatorFormData) => void;
}

const zeroOpenings: Record<OpeningType, number> = {
  single_roller: 0,
  double_roller: 0,
  high_roller: 0,
  large_roller: 0,
  pa_door: 0,
  window: 0,
  sliding_single: 0,
  sliding_double: 0,
  laserlight: 0,
  custom: 0,
};

export default function CalculatorForm({ onCalculate }: CalculatorFormProps) {
  const [openingsModalOpen, setOpeningsModalOpen] = useState(false);
  const [activeDimension, setActiveDimension] = useState<'length' | 'width' | 'height'>('length');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CalculatorFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      length: 12,
      width: 8,
      height: 3,
      pitchAngle: '15',
      cladding: 'corrugated',
      roofMember: 'top_hat',
      wallMember: 'c_channel',
      includeRoofBattens: false,
      includeWallPurlins: false,
      openings: { ...zeroOpenings },
    },
    criteriaMode: 'all',
    reValidateMode: 'onChange',
  });

  const width = watch('width');
  const pitchAngle = watch('pitchAngle');
  const openings = watch('openings');

  const totalOpenings = Object.values(openings).reduce((sum, count) => sum + count, 0);

  // Auto-suggest pitch when width changes and pitch is unknown
  const handleWidthChange = (value: number) => {
    setValue('width', value);
    if (pitchAngle === 'unknown') {
      const suggested = suggestPitch(value);
      setValue('pitchAngle', suggested);
    }
  };

  const handleOpeningsSave = (newOpenings: Record<OpeningType, number>) => {
    setValue('openings', newOpenings, { shouldValidate: true });
    setOpeningsModalOpen(false);
  };

  const handleFormSubmit = (data: CalculatorFormData) => {
    console.log('Form submitted with data:', data);
    onCalculate(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={3}>
        {/* Dimensions */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Typography variant="h4" gutterBottom>
            Dimensions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Controller
                name="length"
                control={control}
                render={({ field }) => (
                  <Box>
                    <TextField
                      {...field}
                      fullWidth
                      label="Length (m)"
                      type="number"
                      inputProps={{ step: 0.1, min: 0.1, max: 50 }}
                      error={!!errors.length}
                      helperText={errors.length?.message}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      onFocus={() => setActiveDimension('length')}
                    />
                    <Box
                      sx={{
                        mt: 2,
                        border: activeDimension === 'length' ? '3px solid' : '1px solid',
                        borderColor: activeDimension === 'length' ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        component="img"
                        src="/images/dimension-length.jpg"
                        alt="Length measurement"
                        sx={{ width: '100%', maxWidth: 180, height: 120, objectFit: 'cover', display: 'block' }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          width: '100%',
                          textAlign: 'center',
                          py: 1,
                          bgcolor: activeDimension === 'length' ? 'primary.main' : 'background.paper',
                          color: activeDimension === 'length' ? 'primary.contrastText' : 'text.primary',
                          fontWeight: activeDimension === 'length' ? 'bold' : 'normal',
                        }}
                      >
                        Length
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={4}>
              <Controller
                name="width"
                control={control}
                render={({ field }) => (
                  <Box>
                    <TextField
                      {...field}
                      fullWidth
                      label="Width (m)"
                      type="number"
                      inputProps={{ step: 0.1, min: 0.1, max: 50 }}
                      error={!!errors.width}
                      helperText={errors.width?.message}
                      onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
                      onFocus={() => setActiveDimension('width')}
                    />
                    <Box
                      sx={{
                        mt: 2,
                        border: activeDimension === 'width' ? '3px solid' : '1px solid',
                        borderColor: activeDimension === 'width' ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        component="img"
                        src="/images/dimension-width.jpg"
                        alt="Width measurement"
                        sx={{ width: '100%', maxWidth: 180, height: 120, objectFit: 'cover', display: 'block' }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          width: '100%',
                          textAlign: 'center',
                          py: 1,
                          bgcolor: activeDimension === 'width' ? 'primary.main' : 'background.paper',
                          color: activeDimension === 'width' ? 'primary.contrastText' : 'text.primary',
                          fontWeight: activeDimension === 'width' ? 'bold' : 'normal',
                        }}
                      >
                        Width
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={4}>
              <Controller
                name="height"
                control={control}
                render={({ field }) => (
                  <Box>
                    <TextField
                      {...field}
                      fullWidth
                      label="Height (m)"
                      type="number"
                      inputProps={{ step: 0.1, min: 0.1, max: 10 }}
                      error={!!errors.height}
                      helperText={errors.height?.message}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      onFocus={() => setActiveDimension('height')}
                    />
                    <Box
                      sx={{
                        mt: 2,
                        border: activeDimension === 'height' ? '3px solid' : '1px solid',
                        borderColor: activeDimension === 'height' ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        component="img"
                        src="/images/dimension-height.jpg"
                        alt="Height measurement"
                        sx={{ width: '100%', maxWidth: 180, height: 120, objectFit: 'cover', display: 'block' }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          width: '100%',
                          textAlign: 'center',
                          py: 1,
                          bgcolor: activeDimension === 'height' ? 'primary.main' : 'background.paper',
                          color: activeDimension === 'height' ? 'primary.contrastText' : 'text.primary',
                          fontWeight: activeDimension === 'height' ? 'bold' : 'normal',
                        }}
                      >
                        Height
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Pitch Selection */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Typography variant="h4" gutterBottom>
            Roof Pitch
          </Typography>
          <Controller
            name="pitchAngle"
            control={control}
            render={({ field }) => (
              <Box>
                <Grid container spacing={2}>
                  {PITCH_OPTIONS.map((angle) => (
                    <Grid item xs={2} key={angle}>
                      <Box
                        onClick={() => field.onChange(angle)}
                        sx={{
                          cursor: 'pointer',
                          border: field.value === angle ? '3px solid' : '1px solid',
                          borderColor: field.value === angle ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={`/images/shed-pitch-${angle}deg.jpg`}
                          alt={`${angle}° pitch`}
                          sx={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            textAlign: 'center',
                            py: 1,
                            bgcolor: field.value === angle ? 'primary.main' : 'background.paper',
                            color: field.value === angle ? 'primary.contrastText' : 'text.primary',
                            fontWeight: field.value === angle ? 'bold' : 'normal',
                          }}
                        >
                          {angle}°
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                {errors.pitchAngle && (
                  <FormHelperText error sx={{ mt: 1 }}>
                    {errors.pitchAngle.message}
                  </FormHelperText>
                )}
              </Box>
            )}
          />
        </Paper>

        {/* Cladding, Members, Spray Options & Openings - All in One */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Typography variant="h4" gutterBottom>
            Configuration
          </Typography>
          <Grid container spacing={2}>
            {/* Row 1: Cladding Images + Members */}
            <Controller
              name="cladding"
              control={control}
              render={({ field }) => (
                <>
                  {CLADDING_OPTIONS.map((option) => (
                    <Grid item xs={2} key={option.value}>
                      <Box
                        onClick={() => field.onChange(option.value)}
                        sx={{
                          cursor: 'pointer',
                          border: field.value === option.value ? '3px solid' : '1px solid',
                          borderColor: field.value === option.value ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={`/images/cladding-${option.value}.jpg`}
                          alt={option.label}
                          sx={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{
                            textAlign: 'center',
                            py: 1,
                            bgcolor: field.value === option.value ? 'primary.main' : 'background.paper',
                            color: field.value === option.value ? 'primary.contrastText' : 'text.primary',
                            fontWeight: field.value === option.value ? 'bold' : 'normal',
                          }}
                        >
                          {option.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                  {errors.cladding && (
                    <Grid item xs={12}>
                      <FormHelperText error>{errors.cladding.message}</FormHelperText>
                    </Grid>
                  )}
                </>
              )}
            />
            <Grid item xs={2}>
              <Controller
                name="roofMember"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.roofMember}>
                    <InputLabel>Roof Member</InputLabel>
                    <Select {...field} label="Roof Member">
                      {MEMBER_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.roofMember && (
                      <FormHelperText>{errors.roofMember.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={2}>
              <Controller
                name="wallMember"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.wallMember}>
                    <InputLabel>Wall Member</InputLabel>
                    <Select {...field} label="Wall Member">
                      {MEMBER_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.wallMember && (
                      <FormHelperText>{errors.wallMember.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Row 2: Spray Options + Openings */}
            <Grid item xs={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Spray Options
              </Typography>
              <Stack spacing={1}>
                <Controller
                  name="includeRoofBattens"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Include roof battens"
                    />
                  )}
                />
                <Controller
                  name="includeWallPurlins"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Include wall purlins"
                    />
                  )}
                />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Openings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {totalOpenings} opening{totalOpenings !== 1 ? 's' : ''} configured
              </Typography>
              <Button variant="outlined" onClick={() => setOpeningsModalOpen(true)}>
                Manage Openings
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Submit Button */}
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            // Bypass React Hook Form and get values directly
            const formData: CalculatorFormData = {
              length: watch('length'),
              width: watch('width'),
              height: watch('height'),
              pitchAngle: watch('pitchAngle'),
              cladding: watch('cladding'),
              roofMember: watch('roofMember'),
              wallMember: watch('wallMember'),
              includeRoofBattens: watch('includeRoofBattens'),
              includeWallPurlins: watch('includeWallPurlins'),
              openings: watch('openings'),
            };
            console.log('Submitting form data:', formData);
            onCalculate(formData);
          }}
          variant="contained"
          size="large"
          fullWidth
          disabled={false}
          startIcon={<Calculate />}
          sx={{ minHeight: 56 }}
        >
          Calculate
        </Button>
      </Stack>

      <OpeningsModal
        open={openingsModalOpen}
        openings={openings}
        onClose={() => setOpeningsModalOpen(false)}
        onSave={handleOpeningsSave}
      />
    </Box>
  );
}
