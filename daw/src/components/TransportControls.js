import React from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Typography } from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon
} from '@mui/icons-material';

const TransportControls = ({ 
  isPlaying, 
  onPlay, 
  onPause, 
  onStop, 
  currentTime, 
  duration 
}) => {
  // Convert seconds to time format (mm:ss)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 2,
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <IconButton
        onClick={onStop}
        size="large"
        color="primary"
      >
        <StopIcon />
      </IconButton>
      <IconButton
        onClick={isPlaying ? onPause : onPlay}
        size="large"
        color="primary"
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      <Typography variant="body2" color="text.secondary">
        {formatTime(currentTime)} / {formatTime(duration)}
      </Typography>
    </Box>
  );
};

TransportControls.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  onPlay: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  currentTime: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired
};

export default TransportControls;
