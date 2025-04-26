import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

const Timeline = ({ 
  currentTime,
  duration,
  isPlaying,
  bpm = 120,
  timeSignature = 4,
  beats,
  onSeek
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const drawFunctionRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Convert time to bars:beats:sixteenths
  const timeToBarsBeatsSixteenths = useCallback((timeInSeconds) => {
    const beatsPerSecond = bpm / 60;
    const totalBeats = timeInSeconds * beatsPerSecond;
    
    const sixteenthsPerBeat = 4;
    const totalSixteenths = Math.floor(totalBeats * sixteenthsPerBeat);
    
    const sixteenthsPerBar = timeSignature * sixteenthsPerBeat;
    const bars = Math.floor(totalSixteenths / sixteenthsPerBar);
    const remainingSixteenths = totalSixteenths % sixteenthsPerBar;
    
    const beats = Math.floor(remainingSixteenths / sixteenthsPerBeat);
    const sixteenths = remainingSixteenths % sixteenthsPerBeat;

    return {
      bars: bars + 1,
      beats: beats + 1,
      sixteenths: sixteenths + 1
    };
  }, [bpm, timeSignature]);

  // Format time as bars:beats:sixteenths
  const formatTime = useCallback((timeInSeconds) => {
    const { bars, beats, sixteenths } = timeToBarsBeatsSixteenths(timeInSeconds);
    return `${bars}:${beats}:${sixteenths}`;
  }, [timeToBarsBeatsSixteenths]);

  // Convert x position to time
  const xToTime = useCallback((x) => {
    if (!canvasRef.current) return 0;
    const rect = canvasRef.current.getBoundingClientRect();
    const width = rect.width;
    return Math.max(0, Math.min(duration, (x - rect.left) / width * duration));
  }, [duration]);

  // Handle mouse events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e) => {
      const time = xToTime(e.clientX);
      onSeek(time);

      const handleMouseMove = (e) => {
        const time = xToTime(e.clientX);
        onSeek(time);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    container.addEventListener('mousedown', handleMouseDown);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onSeek, xToTime]);

  // Calculate beat positions
  const beatPositions = useMemo(() => {
    if (!beats || beats.length === 0) {
      // If no beats detected, create evenly spaced beats based on BPM
      const beatCount = Math.ceil(duration / (60 / bpm));
      return Array.from({ length: beatCount }, (_, i) => i * (60 / bpm));
    }
    return beats;
  }, [beats, bpm, duration]);

  // Draw timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scale canvas for high DPI displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const draw = () => {
      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1;

      // Calculate pixels per second
      const pixelsPerSecond = width / duration;

      // Draw beat markers
      beatPositions.forEach((beatTime, index) => {
        const x = beatTime * pixelsPerSecond;
        
        // Skip if outside visible area
        if (x < 0 || x > width) return;

        const isMeasureStart = index % timeSignature === 0;
        
        // Draw beat line
        ctx.strokeStyle = isMeasureStart ? '#5a5a5a' : '#3a3a3a';
        ctx.lineWidth = isMeasureStart ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Draw measure number
        if (isMeasureStart) {
          const measureNumber = Math.floor(index / timeSignature) + 1;
          ctx.fillStyle = '#808080';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(measureNumber, x, height - 4);
        }
      });

      // Draw current time
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      ctx.fillStyle = '#808080';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(timeText, 4, 12);

      // Draw playhead
      const playheadX = (currentTime / duration) * width;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    // Initial draw
    draw();

    drawFunctionRef.current = draw;

    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [currentTime, duration, isPlaying, beatPositions, timeSignature]);

  // Handle animation frame updates
  useEffect(() => {
    const draw = drawFunctionRef.current;
    if (draw && isPlaying) {
      animationFrameRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        // Re-apply scale for high DPI displays
        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '60px',
        position: 'relative',
        cursor: 'pointer',
        bgcolor: '#2a2a2a',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </Box>
  );
};

Timeline.propTypes = {
  currentTime: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  bpm: PropTypes.number.isRequired,
  timeSignature: PropTypes.number.isRequired,
  beats: PropTypes.arrayOf(PropTypes.number),
  onSeek: PropTypes.func.isRequired
};

export default Timeline;
