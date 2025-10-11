/**
 * Image Helper Component
 * Displays helpful reference images for dimensions and pitch
 */

import { Box, Card, CardMedia } from '@mui/material';

interface ImageHelperProps {
  type: 'dimensions' | 'pitch' | 'cladding';
  pitchAngle?: string;
  dimension?: 'length' | 'width' | 'height';
}

export default function ImageHelper({ type, pitchAngle, dimension = 'length' }: ImageHelperProps) {
  let imagePath = '';

  if (type === 'dimensions') {
    imagePath = `/images/dimension-${dimension}.jpg`;
  } else if (type === 'pitch' && pitchAngle) {
    imagePath = `/images/shed-pitch-${pitchAngle}deg.jpg`;
  } else if (type === 'cladding') {
    imagePath = '/images/cladding-corrugated.jpg';
  }

  if (!imagePath) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, maxWidth: 400 }}>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardMedia
          component="img"
          image={imagePath}
          alt={`${type} reference`}
          sx={{
            height: 200,
            objectFit: 'cover',
          }}
        />
      </Card>
    </Box>
  );
}
