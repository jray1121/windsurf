import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography, Stack, Chip, IconButton } from '@mui/material';

import Timeline from './Timeline';
import TrackDisplay from './TrackDisplay';
import Transport from './Transport';
import { detectBeats } from '../utils/beatAnalysis';
import { generateWaveformData } from '../utils/waveform';

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
  const [trackStates, setTrackStates] = useState({});
  const [waveforms, setWaveforms] = useState({});

  const audioContext = useRef(null);
  const audioBuffers = useRef({});
  const audioSources = useRef({});
  const startTime = useRef(0);
  const pauseTime = useRef(0);
  const animationFrame = useRef(null);
  const clickTrackRef = useRef(null);

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
        const tracks = [pianoTrack, allVocalsTrack, tenor1Track, tenor2Track, bassTrack].filter(Boolean);
        
        // Create a temporary object to store all waveforms
        const newWaveforms = {};

        // Load each track
        for (const track of tracks) {
          try {
            console.log(`Loading track: ${track.type}`);
            const response = await fetch(`http://localhost:8080${track.filePath}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
            audioBuffers.current[track.type] = audioBuffer;

            // Generate waveform data
            console.log(`Generating waveform for ${track.type}`);
            const waveformData = await generateWaveformData(audioBuffer, bpm);
            console.log(`Waveform data for ${track.type}:`, waveformData);
            newWaveforms[track.type] = waveformData;

            // Set duration based on piano track
            if (track.type === 'piano') {
              setDuration(audioBuffer.duration);
            }
          } catch (err) {
            console.error(`Error loading ${track.type} track:`, err);
          }
        }

        // Update all waveforms at once
        console.log('Setting all waveforms:', newWaveforms);
        setWaveforms(newWaveforms);

        // Load click track separately without waveform
        if (clickTrack) {
          const response = await fetch(`http://localhost:8080${clickTrack.filePath}`);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
          audioBuffers.current.click = audioBuffer;
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing audio:', err);
        setError('Failed to initialize audio');
        setIsLoading(false);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [pianoTrack, allVocalsTrack, tenor1Track, tenor2Track, bassTrack, clickTrack, bpm]);

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
      const panNode = audioContext.current.createStereoPanner();
      source.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(audioContext.current.destination);

      // Apply track state settings
      const trackState = trackStates[trackType] || {};
      if (trackType === 'click') {
        gainNode.gain.value = clickEnabled ? 1 : 0;
      } else {
        gainNode.gain.value = trackState.muted ? 0 : (trackState.volume || 1);
        panNode.pan.value = trackState.pan || 0;
      }

      // Store source, gain node, and pan node references
      audioSources.current[trackType] = { source, gainNode, panNode };

      // Calculate start time
      const offset = pauseTime.current;
      if (trackType === 'piano') { // Use piano track as time reference
        startTime.current = audioContext.current.currentTime - offset;
        // Synchronize click track with audio context
        if (clickTrackRef.current) {
          clickTrackRef.current.currentTime = offset;
          if (clickEnabled) {
            clickTrackRef.current.play();
          }
        }
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
    // Pause click track
    if (clickTrackRef.current) {
      clickTrackRef.current.pause();
    }
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
    // Stop and reset click track
    if (clickTrackRef.current) {
      clickTrackRef.current.pause();
      clickTrackRef.current.currentTime = 0;
    }
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

  const formatTime = useCallback((timeInSeconds) => {
    const beatsPerSecond = bpm / 60;
    const totalBeats = timeInSeconds * beatsPerSecond;
    
    const sixteenthsPerBeat = 4;
    const totalSixteenths = Math.floor(totalBeats * sixteenthsPerBeat);
    
    const [beatsPerBar] = timeSignature.split('/').map(Number);
    const sixteenthsPerBar = beatsPerBar * sixteenthsPerBeat;
    const bars = Math.floor(totalSixteenths / sixteenthsPerBar);
    const remainingSixteenths = totalSixteenths % sixteenthsPerBar;
    
    const beats = Math.floor(remainingSixteenths / sixteenthsPerBeat);
    const sixteenths = remainingSixteenths % sixteenthsPerBeat;

    return `${bars + 1}:${beats + 1}:${sixteenths + 1}`;
  }, [bpm, timeSignature]);

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

      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
        {/* Timeline and tracks container */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto', position: 'relative' }}>
          {/* Timeline aligned with waveforms */}
          <Box sx={{ display: 'flex' }}>
            {/* Transport controls */}
            <Box sx={{ width: 280, display: 'flex', alignItems: 'flex-start', pl: 1, pt: '12px' }}>
              <Transport
                currentTime={formatTime(currentTime)}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
              />
            </Box>

            
            {/* Timeline */}
            <Box sx={{ flex: 1, minHeight: 60 }}>
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
          </Box>

          {/* Tracks */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Core tracks */}
            {/* Piano track */}
            {pianoTrack && (
              <TrackDisplay
                title="Piano"
                color="#9c27b0"
                waveformData={waveforms.piano}
                onVolumeChange={(volume) => {
                  setTrackStates(prev => ({
                    ...prev,
                    piano: { ...prev.piano, volume }
                  }));
                  if (audioSources.current.piano) {
                    audioSources.current.piano.gainNode.gain.value = volume;
                  }
                }}
                onPanChange={(pan) => {
                  setTrackStates(prev => ({
                    ...prev,
                    piano: { ...prev.piano, pan }
                  }));
                  if (audioSources.current.piano) {
                    audioSources.current.piano.panNode.pan.value = pan;
                  }
                }}
                onMute={(muted) => {
                  setTrackStates(prev => ({
                    ...prev,
                    piano: { ...prev.piano, muted }
                  }));
                  if (audioSources.current.piano) {
                    audioSources.current.piano.gainNode.gain.value = muted ? 0 : (trackStates.piano?.volume || 1);
                  }
                }}
                onSolo={(solo) => {
                  // Implement solo logic here
                  console.log('Piano solo:', solo);
                }}
              />
            )}

            {/* Vocal tracks */}
            {allVocalsTrack && (
            <TrackDisplay
              title="All Vocals"
              color="#2196f3"
              waveformData={waveforms.all_vocals}
              onVolumeChange={(volume) => {
                setTrackStates(prev => ({
                  ...prev,
                  all_vocals: { ...prev.all_vocals, volume }
                }));
                if (audioSources.current.all_vocals) {
                  audioSources.current.all_vocals.gainNode.gain.value = volume;
                }
              }}
              onPanChange={(pan) => {
                setTrackStates(prev => ({
                  ...prev,
                  all_vocals: { ...prev.all_vocals, pan }
                }));
                if (audioSources.current.all_vocals) {
                  audioSources.current.all_vocals.panNode.pan.value = pan;
                }
              }}
              onMute={(muted) => {
                setTrackStates(prev => ({
                  ...prev,
                  all_vocals: { ...prev.all_vocals, muted }
                }));
                if (audioSources.current.all_vocals) {
                  audioSources.current.all_vocals.gainNode.gain.value = muted ? 0 : (trackStates.all_vocals?.volume || 1);
                }
              }}
              onSolo={(solo) => {
                // Implement solo logic here
                console.log('All Vocals solo:', solo);
              }}
            />
          )}

            {/* Individual vocal tracks */}
            {/* All vocals track */}
            {allVocalsTrack && (
              <TrackDisplay
                title="All Vocals"
                color="#2196f3"
                waveformData={waveforms.all_vocals}
                onVolumeChange={(volume) => {
                  setTrackStates(prev => ({
                    ...prev,
                    all_vocals: { ...prev.all_vocals, volume }
                  }));
                  if (audioSources.current.all_vocals) {
                    audioSources.current.all_vocals.gainNode.gain.value = volume;
                  }
                }}
                onPanChange={(pan) => {
                  setTrackStates(prev => ({
                    ...prev,
                    all_vocals: { ...prev.all_vocals, pan }
                  }));
                  if (audioSources.current.all_vocals) {
                    audioSources.current.all_vocals.panNode.pan.value = pan;
                  }
                }}
                onMute={(muted) => {
                  setTrackStates(prev => ({
                    ...prev,
                    all_vocals: { ...prev.all_vocals, muted }
                  }));
                  if (audioSources.current.all_vocals) {
                    audioSources.current.all_vocals.gainNode.gain.value = muted ? 0 : (trackStates.all_vocals?.volume || 1);
                  }
                }}
                onSolo={(solo) => {
                  // Implement solo logic here
                  console.log('All Vocals solo:', solo);
                }}
              />
            )}

            {/* Individual vocal tracks */}
            {tenor1Track && (
            <TrackDisplay
              title="Tenor 1"
              color="#4caf50"
              waveformData={waveforms.tenor_1}
              onVolumeChange={(volume) => {
                setTrackStates(prev => ({
                  ...prev,
                  tenor_1: { ...prev.tenor_1, volume }
                }));
                if (audioSources.current.tenor_1) {
                  audioSources.current.tenor_1.gainNode.gain.value = volume;
                }
              }}
              onPanChange={(pan) => {
                setTrackStates(prev => ({
                  ...prev,
                  tenor_1: { ...prev.tenor_1, pan }
                }));
                if (audioSources.current.tenor_1) {
                  audioSources.current.tenor_1.panNode.pan.value = pan;
                }
              }}
              onMute={(muted) => {
                setTrackStates(prev => ({
                  ...prev,
                  tenor_1: { ...prev.tenor_1, muted }
                }));
                if (audioSources.current.tenor_1) {
                  audioSources.current.tenor_1.gainNode.gain.value = muted ? 0 : (trackStates.tenor_1?.volume || 1);
                }
              }}
              onSolo={(solo) => {
                // Implement solo logic here
                console.log('Tenor 1 solo:', solo);
              }}
            />
          )}
            {tenor2Track && (
            <TrackDisplay
              title="Tenor 2"
              color="#ff9800"
              waveformData={waveforms.tenor_2}
              onVolumeChange={(volume) => {
                setTrackStates(prev => ({
                  ...prev,
                  tenor_2: { ...prev.tenor_2, volume }
                }));
                if (audioSources.current.tenor_2) {
                  audioSources.current.tenor_2.gainNode.gain.value = volume;
                }
              }}
              onPanChange={(pan) => {
                setTrackStates(prev => ({
                  ...prev,
                  tenor_2: { ...prev.tenor_2, pan }
                }));
                if (audioSources.current.tenor_2) {
                  audioSources.current.tenor_2.panNode.pan.value = pan;
                }
              }}
              onMute={(muted) => {
                setTrackStates(prev => ({
                  ...prev,
                  tenor_2: { ...prev.tenor_2, muted }
                }));
                if (audioSources.current.tenor_2) {
                  audioSources.current.tenor_2.gainNode.gain.value = muted ? 0 : (trackStates.tenor_2?.volume || 1);
                }
              }}
              onSolo={(solo) => {
                // Implement solo logic here
                console.log('Tenor 2 solo:', solo);
              }}
            />
          )}
            {bassTrack && (
              <TrackDisplay
                title="Bass"
                color="#f44336"
                waveformData={waveforms.bass}
                onVolumeChange={(volume) => {
                  setTrackStates(prev => ({
                    ...prev,
                    bass: { ...prev.bass, volume }
                  }));
                  if (audioSources.current.bass) {
                    audioSources.current.bass.gainNode.gain.value = volume;
                  }
                }}
                onPanChange={(pan) => {
                  setTrackStates(prev => ({
                    ...prev,
                    bass: { ...prev.bass, pan }
                  }));
                  if (audioSources.current.bass) {
                    audioSources.current.bass.panNode.pan.value = pan;
                  }
                }}
                onMute={(muted) => {
                  setTrackStates(prev => ({
                    ...prev,
                    bass: { ...prev.bass, muted }
                  }));
                  if (audioSources.current.bass) {
                    audioSources.current.bass.gainNode.gain.value = muted ? 0 : (trackStates.bass?.volume || 1);
                  }
                }}
                onSolo={(solo) => {
                  // Implement solo logic here
                  console.log('Bass solo:', solo);
                }}
              />
            )}

            {/* Click track (hidden) */}
            <audio
              ref={clickTrackRef}
              src={clickTrack ? `http://localhost:8080${clickTrack.filePath}` : ''}
              loop
            />
          </Box>
        </Box>


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
