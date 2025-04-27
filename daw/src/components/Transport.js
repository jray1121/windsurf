import React from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  IconButton,
  Typography,
  styled 
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

const TimeDisplay = styled(Typography)(({ theme }) => ({
  fontFamily: 'inherit',
  fontSize: '24px',
  color: '#808080',
  backgroundColor: '#1a1a1a',
  border: '1px solid #404040',
  padding: theme.spacing(0.5, 1.5),
  borderRadius: 1,
  minWidth: 120,
  textAlign: 'center'
}));

const Transport = ({ 
  currentTime = '1:1:1',
  isPlaying = false,
  onPlay,
  onPause,
  onStop
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <TimeDisplay>{currentTime}</TimeDisplay>
      <Box sx={{ display: 'flex', gap: 1, ml: -1 }}>
        <IconButton 
          onClick={onPlay}
          size="small"
          disabled={isPlaying}
          sx={{ 
            color: isPlaying ? 'success.light' : 'success.main',
            '&:hover': { color: 'success.dark' }
          }}
        >
          <PlayArrowIcon />
        </IconButton>
        <IconButton 
          onClick={onPause}
          size="small"
          disabled={!isPlaying}
          sx={{ 
            color: !isPlaying ? 'warning.light' : 'warning.main',
            '&:hover': { color: 'warning.dark' }
          }}
        >
          <PauseIcon />
        </IconButton>
        <IconButton 
          onClick={onStop}
          size="small"
          sx={{ 
            color: 'error.main',
            '&:hover': { color: 'error.dark' }
          }}
        >
          <StopIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

Transport.propTypes = {
  currentTime: PropTypes.string,
  isPlaying: PropTypes.bool,
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onStop: PropTypes.func
};

export default Transport;
