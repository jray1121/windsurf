import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Stack,
  Typography,
  Button
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  VolumeDown as VolumeDownIcon,
  VolumeOff as VolumeOffIcon,
  Headphones as HeadphonesIcon,
  CloudUpload as CloudUploadIcon,
  PanTool as PanToolIcon
} from '@mui/icons-material';
import * as Tone from 'tone';
import WaveSurfer from 'wavesurfer.js';

const Track = ({
  color = '#1976d2',
  trackNumber,
  volume = 70,
  pan = 0,
  isMuted = false,
  isSolo = false,
  isPlaying = false,
  currentTime = 0,
  onVolumeChange,
  onPanChange,
  onMuteChange,
  onSoloChange,
  onPlayerChange = () => {}
}) => {
  const [fileName, setFileName] = useState('');
  const [player, setPlayer] = useState(null);
  const [panner, setPanner] = useState(null);
  const containerRef = useRef(null);
  const wavesurfer = useRef(null);
  const fileInputRef = useRef(null);
  const lastPositionRef = useRef(0);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (player) {
        player.stop();
        player.dispose();
      }
    };
  }, [player]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Always create a new instance
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#666',
      progressColor: color,
      cursorColor: '#fff',
      height: 80,
      normalize: true,
      fillParent: true,
      backgroundColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      barRadius: 3,
      minPxPerSec: 30,
      interact: false,
      hideScrollbar: true,
      plugins: []
    });

    wavesurfer.current.on('ready', () => {
      console.log('Waveform ready');
    });

    wavesurfer.current.on('error', (err) => {
      console.error('Waveform error:', err);
    });

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [color]);

  // Update waveform position
  useEffect(() => {
    if (!wavesurfer.current || !wavesurfer.current.isReady || !player) return;

    try {
      const duration = wavesurfer.current.getDuration();
      if (duration > 0) {
        const position = Math.min(Math.max(currentTime / duration, 0), 1);
        requestAnimationFrame(() => {
          if (wavesurfer.current) {
            wavesurfer.current.seekTo(position);
          }
        });
      }
    } catch (error) {
      console.error('Error updating waveform position:', error);
    }
  }, [currentTime, player]);

  // Update last position when pausing
  useEffect(() => {
    if (!isPlaying) {
      lastPositionRef.current = currentTime;
    }
  }, [isPlaying, currentTime]);

  // Handle volume changes
  useEffect(() => {
    if (!player) return;
    
    try {
      // Update volume
      player.volume.value = Tone.gainToDb(volume / 100);
      console.log('Volume updated:', { volume, db: player.volume.value });
    } catch (error) {
      console.error('Error updating volume:', error);
    }
  }, [player, volume]);

  // Handle pan changes
  useEffect(() => {
    if (!player) return;

    try {
      // Update pan value
      player.pan.value = pan / 50;
      console.log('Pan updated:', { pan, normalized: player.pan.value });
    } catch (error) {
      console.error('Error updating pan:', error);
    }
  }, [player, pan]);

  // Update pan value
  useEffect(() => {
    if (!panner) return;
    try {
      panner.pan.value = pan / 50;
    } catch (error) {
      console.error('Error updating pan:', error);
    }
  }, [panner, pan]);

  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      setFileName(file.name);

      try {
        // Initialize audio context first
        await Tone.start();
        console.log('Audio context started successfully');
      } catch (error) {
        console.error('Error starting audio context:', error);
        // Continue anyway as the context might already be running
      }

      // Create object URL for the file
      const url = URL.createObjectURL(file);

      // Clean up old player if it exists
      if (player) {
        player.stop();
        player.disconnect();
        player.dispose();
      }

      // Create a new player
      const newPlayer = new Tone.Player();
      
      // Create volume and pan nodes
      const volumeNode = new Tone.Volume(Tone.gainToDb(volume / 100));
      const panNode = new Tone.Panner(pan / 50);
      
      // Connect the nodes
      newPlayer.chain(volumeNode, panNode, Tone.Destination);

      // Load the audio file
      try {
        await newPlayer.load(url);
        console.log('Audio file loaded successfully');
      } catch (loadError) {
        console.error('Error loading audio file:', loadError);
        throw loadError;
      }

      // Update waveform
      if (wavesurfer.current) {
        try {
          await new Promise((resolve, reject) => {
            wavesurfer.current.once('ready', resolve);
            wavesurfer.current.once('error', reject);
            wavesurfer.current.load(url);
          });
          console.log('Waveform loaded successfully');
        } catch (waveformError) {
          console.error('Error loading waveform:', waveformError);
          // Don't throw here, we can still play audio without waveform
        }
      }

      // Store player and notify parent
      setPlayer(newPlayer);
      onPlayerChange(newPlayer);

      // Clean up URL
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error handling file upload:', error);
      setFileName('');
      alert('Error uploading file: ' + (error.message || 'Unknown error'));
    }
  };

  const handleVolumeChange = (newValue) => {
    onVolumeChange(newValue);
    if (player) {
      try {
        // Convert volume percentage to decibels (0-100% -> -60 to 0 dB)
        const volumeDb = Tone.gainToDb(newValue / 100);
        player.volume.value = volumeDb;
        console.log('Volume set to:', { percent: newValue, db: volumeDb });
      } catch (err) {
        console.error('Error setting volume:', err);
      }
    }
  };

  const handlePanChange = (newValue) => {
    onPanChange(newValue);
    if (panner) {
      try {
        const panValue = newValue / 50; // Convert -50 to 50 range to -1 to 1
        panner.pan.value = panValue;
        console.log('Pan set to:', panValue);
      } catch (err) {
        console.error('Error setting pan:', err);
      }
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        p: 1.5, 
        bgcolor: '#2d2d2d',
        borderRadius: 2,
        border: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        '&:hover': {
          bgcolor: '#333'
        }
      }}
    >
      <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
      {/* Controls */}
      <Box 
        sx={{ 
          width: 200, 
          p: 1.5,
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          borderRight: 1,
          borderColor: 'rgba(255,255,255,0.1)'
        }}
      >
        {/* Volume Slider */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Slider
            orientation="vertical"
            value={volume}
            onChange={(e, newValue) => handleVolumeChange(newValue)}
            sx={{ 
              height: 120,
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
                bgcolor: color
              },
              '& .MuiSlider-track': {
                bgcolor: color
              }
            }}
          />
          <Typography 
            sx={{ 
              transform: 'rotate(-90deg)', 
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}
          >
            Volume
          </Typography>
        </Box>

        {/* Pan Slider */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              minWidth: 20, 
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 'bold',
              bgcolor: 'rgba(0,0,0,0.2)',
              px: 1,
              py: 0.5,
              borderRadius: 1
            }}
          >
            Pan
          </Typography>
          <Slider
            value={pan}
            onChange={(e, newValue) => handlePanChange(newValue)}
            min={-50}
            max={50}
            marks={[
              { value: -50, label: 'L' },
              { value: 0, label: 'C' },
              { value: 50, label: 'R' }
            ]}
            sx={{ 
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
                bgcolor: color
              }
            }}
          />
        </Box>
      </Box>

      {/* Mute/Solo Buttons */}
      <Stack 
        direction="row" 
        spacing={1}
        sx={{ 
          bgcolor: 'rgba(0,0,0,0.2)', 
          p: 0.5, 
          borderRadius: 1
        }}
      >
        <IconButton
          size="small"
          onClick={() => onMuteChange && onMuteChange(!isMuted)}
          sx={{ 
            bgcolor: isMuted ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.05)',
            color: isMuted ? '#ff6b6b' : 'rgba(255,255,255,0.8)',
            '&:hover': {
              bgcolor: isMuted ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.1)'
            }
          }}
        >
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        <IconButton
          onClick={() => onSoloChange && onSoloChange(!isSolo)}
          size="small"
          sx={{ 
            bgcolor: isSolo ? 'rgba(255,223,0,0.1)' : 'rgba(255,255,255,0.05)',
            color: isSolo ? '#ffd700' : 'rgba(255,255,255,0.8)',
            '&:hover': {
              bgcolor: isSolo ? 'rgba(255,223,0,0.2)' : 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <HeadphonesIcon />
        </IconButton>
      </Stack>
    </Box>
    <Box 
      sx={{ 
        flex: 1,
        position: 'relative', 
        bgcolor: 'rgba(0,0,0,0.2)',
        display: 'flex', 
        alignItems: 'center',
        borderLeft: `3px solid ${color}`,
        overflow: 'hidden'
      }}
    >
      {/* Waveform container */}
      <Box
        ref={containerRef}
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 80,
          zIndex: 1,
          '& wave': {
            overflow: 'hidden !important'
          }
        }}
      />

      {/* Upload overlay - shown when no audio is loaded */}
      {!fileName && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.2)',
            cursor: 'pointer',
            zIndex: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.3)',
              '& .upload-text': {
                transform: 'scale(1.05)'
              }
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Stack 
            alignItems="center" 
            spacing={1}
            className="upload-text"
            sx={{ 
              transition: 'transform 0.2s ease-in-out',
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 'bold'
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 40 }} />
            <Typography variant="body2">
              Click to upload audio
            </Typography>
          </Stack>
        </Box>
      )}

      {/* File name display */}
      {fileName && (
        <Typography 
          variant="caption" 
          sx={{ 
            position: 'absolute',
            top: 8,
            left: 8,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 'bold',
            zIndex: 2,
            bgcolor: 'rgba(0,0,0,0.6)',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {fileName}
        </Typography>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />

      {/* Pan control - shown on hover */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          p: 1,
          display: 'none',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
          boxShadow: 1,
          borderRadius: 1,
          zIndex: 1,
          '.MuiBox-root:hover &': {
            display: 'flex'
          }
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            minWidth: 20,
            color: 'rgba(255,255,255,0.7)'
          }}
        >
          L
        </Typography>
        <Slider
          size="small"
          value={pan}
          onChange={(e, newValue) => handlePanChange(newValue)}
          min={-50}
          max={50}
          sx={{ 
            width: 80,
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              bgcolor: color,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: 'none'
              }
            },
            '& .MuiSlider-track': {
              border: 'none',
              bgcolor: color
            }
          }}
        />
        <Typography 
          variant="caption"
          sx={{ 
            minWidth: 20,
            color: 'rgba(255,255,255,0.7)'
          }}
        >
          R
        </Typography>
      </Box>
      </Box>
    </Box>
  );
};

export default Track;
