import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography, Button, Stack, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';
import Timeline from './Timeline';
import TrackDisplay from './TrackDisplay';
import { detectBeats } from '../utils/beatAnalysis';

const DAW = ({ song }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bpm, setBpm] = useState(120);
  const [beats, setBeats] = useState([]);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [clickEnabled, setClickEnabled] = useState(true);

  const audioContext = useRef(null);
  const audioBuffers = useRef({});
  const audioSources = useRef({});
  const startTime = useRef(0);
  const pauseTime = useRef(0);
  const animationFrame = useRef(null);

  // Group tracks by type
  const tracksByType = song.tracks.reduce((acc, track) => {
    acc[track.type] = track;
    return acc;
  }, {});

  // Core tracks
  const clickTrack = tracksByType['click'];
  const pianoTrack = tracksByType['piano'];
  const allVocalsTrack = tracksByType['all_vocals'];

  // Voice parts
  const tenor1Track = tracksByType['tenor_1'];
  const tenor2Track = tracksByType['tenor_2'];
  const bassTrack = tracksByType['bass'];

  // Load and analyze click track
  useEffect(() => {
    const analyzeClickTrack = async () => {
      try {
        if (!clickTrack) return;

        // Create temporary audio context for analysis
        const analysisContext = new (window.AudioContext || window.webkitAudioContext)();

        // Fetch and decode click track
        const response = await fetch(`http://localhost:8080${clickTrack.filePath}`);
        const arrayBuffer = await response.arrayBuffer();
        const clickBuffer = await analysisContext.decodeAudioData(arrayBuffer);

        // Analyze beats with time signature
        console.log('Click track info:', {
          timeSignature: clickTrack.timeSignature,
          beatValue: clickTrack.beatValue
        });

        // Analyze beats
        const { bpm: detectedBpm } = await detectBeats(clickBuffer);
        console.log('Detected BPM:', detectedBpm);
        
        setBpm(detectedBpm);
        setTimeSignature(clickTrack.timeSignature || '4/4');

        // Clean up
        await analysisContext.close();
      } catch (err) {
        console.error('Error analyzing click track:', err);
        setError('Failed to analyze click track');
      }
    };

    analyzeClickTrack();
  }, [clickTrack]);

  // Initialize audio context and load all tracks
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create audio context
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load all available tracks
        const tracks = [pianoTrack, allVocalsTrack, tenor1Track, tenor2Track, bassTrack, clickTrack].filter(Boolean);
        
        // Load each track
        await Promise.all(tracks.map(async (track) => {
          try {
            const response = await fetch(`http://localhost:8080${track.filePath}`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await audioContext.current.decodeAudioData(arrayBuffer);
            audioBuffers.current[track.type] = buffer;

            // Set duration based on piano track
            if (track.type === 'piano') {
              setDuration(buffer.duration);
            }
          } catch (err) {
            console.error(`Error loading ${track.type} track:`, err);
          }
        }));

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing audio:', err);
        setError('Failed to load audio files');
        setIsLoading(false);
      }
    };

    initAudio();

    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [pianoTrack, allVocalsTrack, tenor1Track, tenor2Track, bassTrack, clickTrack]);

  // Update current time during playback
  useEffect(() => {
    const updateTime = () => {
      if (isPlaying && audioContext.current) {
        setCurrentTime(audioContext.current.currentTime - startTime.current);
        animationFrame.current = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrame.current = requestAnimationFrame(updateTime);
    } else {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isPlaying]);

  const handlePlay = useCallback(() => {
    if (!audioContext.current || Object.keys(audioBuffers.current).length === 0) return;

    // Resume audio context if suspended
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }

    // Create and start sources for all loaded tracks
    Object.entries(audioBuffers.current).forEach(([trackType, buffer]) => {
      // Create new audio source
      const source = audioContext.current.createBufferSource();
      source.buffer = buffer;

      // Create gain node for volume control
      const gainNode = audioContext.current.createGain();
      source.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      // Mute click track if disabled
      if (trackType === 'click') {
        gainNode.gain.value = clickEnabled ? 1 : 0;
      }

      // Store source and gain node references
      audioSources.current[trackType] = { source, gainNode };

      // Calculate start time
      const offset = pauseTime.current;
      if (trackType === 'piano') { // Use piano track as time reference
        startTime.current = audioContext.current.currentTime - offset;
      }

      // Start playback
      source.start(0, offset);
    });

    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    if (Object.keys(audioSources.current).length === 0) return;

    // Stop all audio sources
    Object.values(audioSources.current).forEach(({ source }) => source.stop());
    
    // Clear sources
    audioSources.current = {};

    // Store pause time based on piano track
    pauseTime.current = audioContext.current.currentTime - startTime.current;
    setIsPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    if (Object.keys(audioSources.current).length === 0) return;

    // Stop all audio sources
    Object.values(audioSources.current).forEach(({ source }) => source.stop());
    
    // Clear sources
    audioSources.current = {};

    // Reset playback state
    pauseTime.current = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback((time) => {
    if (isPlaying) {
      handlePause();
    }
    pauseTime.current = time;
    setCurrentTime(time);
  }, [isPlaying, handlePause]);

  return (
    <Paper 
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {song.title}
        </Typography>
        
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {song.voicing.toUpperCase()}
          </Typography>
          {clickTrack && <Chip label="Click Track" color="primary" size="small" />}
          {pianoTrack && <Chip label="Piano" color="secondary" size="small" />}
          {allVocalsTrack && <Chip label="All Vocals" color="info" size="small" />}
          {tenor1Track && <Chip label="Tenor 1" color="success" size="small" />}
          {tenor2Track && <Chip label="Tenor 2" color="warning" size="small" />}
          {bassTrack && <Chip label="Bass" color="error" size="small" />}
        </Stack>
      </Box>

      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto' }}>
        <Box sx={{ minHeight: 60 }}>          
          <Timeline 
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            bpm={bpm}
            timeSignature={timeSignature}
            onSeek={handleSeek}
            beats={beats}
          />
        </Box>

        {/* Click Track Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="text"
            color={clickEnabled ? "primary" : "inherit"}
            onClick={() => {
              setClickEnabled(!clickEnabled);
              // Update click track volume if playing
              if (isPlaying && audioSources.current.click) {
                audioSources.current.click.gainNode.gain.value = !clickEnabled ? 1 : 0;
              }
            }}
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: '16px',
              backgroundColor: theme => clickEnabled ? theme.palette.primary.main + '10' : 'transparent',
              '&:hover': {
                backgroundColor: theme => clickEnabled ? theme.palette.primary.main + '20' : theme.palette.action.hover
              }
            }}
          >
            {clickEnabled ? '🎯 Click Track' : '⚪ Click Track'}
          </Button>
        </Box>

        {/* Tracks */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {/* Core tracks */}
          {pianoTrack && (
            <TrackDisplay
              title="Piano"
              color="#9c27b0"
            />
          )}
          {allVocalsTrack && (
            <TrackDisplay
              title="All Vocals"
              color="#2196f3"
            />
          )}

          {/* Voice parts */}
          {tenor1Track && (
            <TrackDisplay
              title="Tenor 1"
              color="#4caf50"
            />
          )}
          {tenor2Track && (
            <TrackDisplay
              title="Tenor 2"
              color="#ff9800"
            />
          )}
          {bassTrack && (
            <TrackDisplay
              title="Bass"
              color="#f44336"
            />
          )}
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1}>
            {!isPlaying ? (
              <Button 
                variant="contained" 
                color="primary" 
                disabled={!pianoTrack || isLoading}
                onClick={handlePlay}
                startIcon={<PlayArrowIcon />}
              >
                Play
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                disabled={!pianoTrack || isLoading}
                onClick={handlePause}
                startIcon={<PauseIcon />}
              >
                Pause
              </Button>
            )}
            <Button 
              variant="contained" 
              disabled={!pianoTrack || (!isPlaying && currentTime === 0)}
              onClick={handleStop}
              startIcon={<StopIcon />}
            >
              Stop
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

DAW.propTypes = {
  song: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    voicing: PropTypes.string.isRequired,
    tracks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        filePath: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired
};

export default DAW;
