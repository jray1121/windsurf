import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

const TrackDisplay = ({ 
  title, 
  color = '#1976d2',
  height = 80 
}) => {
  return (
    <Box
      sx={{
        height,
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        border: 1,
        borderColor: 'divider'
      }}
    >
      {/* Track Label */}
      <Box
        sx={{
          width: 120,
          p: 1,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
      </Box>

      {/* Track Content */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          bgcolor: 'rgba(0,0,0,0.2)',
          borderLeft: `3px solid ${color}`,
        }}
      >
        {/* Simple line representation */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 2,
            bgcolor: color,
            opacity: 0.5
          }}
        />
      </Box>
    </Box>
  );
};

TrackDisplay.propTypes = {
  title: PropTypes.string.isRequired,
  color: PropTypes.string,
  height: PropTypes.number
};

export default TrackDisplay;
