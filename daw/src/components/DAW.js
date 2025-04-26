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

  const audioContext = useRef(null);
  const audioBuffer = useRef(null);
  const audioSource = useRef(null);
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

        // Analyze beats
        const { bpm: detectedBpm, beats: detectedBeats } = await detectBeats(clickBuffer);
        setBpm(detectedBpm);
        setBeats(detectedBeats);

        // Clean up
        await analysisContext.close();
      } catch (err) {
        console.error('Error analyzing click track:', err);
        setError('Failed to analyze click track');
      }
    };

    analyzeClickTrack();
  }, [clickTrack]);

  // Initialize audio context and load piano track
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (!pianoTrack) return;

        // Create audio context
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();

        // Fetch and decode audio file
        const response = await fetch(`http://localhost:8080${pianoTrack.filePath}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await audioContext.current.decodeAudioData(arrayBuffer);
        
        audioBuffer.current = buffer;
        setDuration(buffer.duration);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading audio:', err);
        setError('Failed to load audio file');
        setIsLoading(false);
      }
    };

    initAudio();

    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [pianoTrack]);

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
    if (!audioContext.current || !audioBuffer.current) return;

    // Create new audio source
    audioSource.current = audioContext.current.createBufferSource();
    audioSource.current.buffer = audioBuffer.current;
    audioSource.current.connect(audioContext.current.destination);

    // Calculate start position
    const offset = pauseTime.current;
    startTime.current = audioContext.current.currentTime - offset;

    // Start playback
    audioSource.current.start(0, offset);
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    if (audioSource.current) {
      audioSource.current.stop();
      audioSource.current = null;
    }
    pauseTime.current = currentTime;
    setIsPlaying(false);
  }, [currentTime]);

  const handleStop = useCallback(() => {
    if (audioSource.current) {
      audioSource.current.stop();
      audioSource.current = null;
    }
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
            timeSignature={4}
            onSeek={handleSeek}
            beats={beats}
          />
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
