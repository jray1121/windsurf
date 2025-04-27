import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
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
  const drawFunctionRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Convert time to bars:beats:sixteenths
  const timeToBarsBeatsSixteenths = useCallback((timeInSeconds) => {
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

  // Calculate visible duration (12 measures)
  const visibleDuration = useMemo(() => {
    return 12 * (60 / bpm) * 4; // 12 measures * seconds per beat * beats per measure
  }, [bpm]);

  // Handle timeline scrolling with trackpad and seeking with click
  const handleScroll = useCallback((e) => {
    if (e.type === 'wheel') {
      e.preventDefault(); // Prevent default scrolling
      
      // Use deltaX for horizontal trackpad gestures
      const scrollAmount = e.deltaX;
      const scrollSpeed = 0.5; // Adjust sensitivity for smooth scrolling
      const pixelsPerSecond = canvasRef.current.getBoundingClientRect().width / visibleDuration;
      
      setScrollOffset(prev => {
        const newOffset = prev + (scrollAmount * scrollSpeed) / pixelsPerSecond;
        const maxOffset = Math.max(0, duration - visibleDuration);
        return Math.max(0, Math.min(newOffset, maxOffset));
      });
    }
  }, [duration, visibleDuration, bpm]);

  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Only handle clicks in the timeline area (below top padding)
    if (y > 24) {
      const x = e.clientX - rect.left;
      const time = xToTime(x + scrollOffset);
      onSeek(time);
    }
  }, [onSeek, xToTime, scrollOffset]);



  // Handle mouse events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add event listeners for trackpad scrolling and clicking
    container.addEventListener('wheel', handleScroll, { passive: false });
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('wheel', handleScroll);
      container.removeEventListener('click', handleClick);
    };
  }, [handleScroll, handleClick]);

  // Calculate measure positions
  const measurePositions = useMemo(() => {
    const [beatsPerBar] = timeSignature.split('/').map(Number);
    const secondsPerBeat = 60 / bpm;
    const secondsPerMeasure = secondsPerBeat * beatsPerBar;
    const measureCount = Math.ceil(duration / secondsPerMeasure);
    
    return Array.from({ length: measureCount }, (_, i) => ({
      time: i * secondsPerMeasure,
      measureNumber: i + 1
    }));
  }, [bpm, duration, timeSignature]);

  // Calculate beat positions for each measure
  const beatPositions = useMemo(() => {
    const [beatsPerBar] = timeSignature.split('/').map(Number);
    const secondsPerBeat = 60 / bpm;
    const beatCount = Math.ceil(duration / secondsPerBeat);
    
    return Array.from({ length: beatCount }, (_, i) => ({
      time: i * secondsPerBeat,
      isMeasureStart: i % beatsPerBar === 0,
      measureNumber: Math.floor(i / beatsPerBar) + 1
    }));
  }, [bpm, duration, timeSignature]);

  // Constants
  const numberHeight = 20; // Space for measure numbers at bottom
  const topPadding = 8; // Space for timestamp above timeline

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

      // Draw separator line below timestamp
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, topPadding);
      ctx.lineTo(width, topPadding);
      ctx.stroke();

      // Draw grid background
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1;

          // Calculate timing for 12 measures
      const [beatsPerBar] = timeSignature.split('/').map(Number);
      const secondsPerBeat = 60 / bpm;
      const secondsPerMeasure = secondsPerBeat * beatsPerBar;
      const totalMeasuresShown = 12;
      const visibleDuration = secondsPerMeasure * totalMeasuresShown;
      const scrollPosition = Math.floor(currentTime / visibleDuration) * visibleDuration;
      
      // Calculate pixels per second to show exactly 12 measures
      const pixelsPerSecond = width / visibleDuration;

      // Add initial offset for measure numbers
      const initialOffset = 20;

      // Draw beat lines and measure numbers for visible range
      beatPositions.forEach(({ time, isMeasureStart, measureNumber }) => {
        // Adjust time relative to scroll offset
        const adjustedTime = time - scrollOffset;
        const x = adjustedTime * pixelsPerSecond;
        
        // Skip if outside visible area or not in current 12-measure window
        if (x < 0 || x > width || adjustedTime < 0 || adjustedTime > visibleDuration) return;
        
        // Draw beat line
        ctx.strokeStyle = isMeasureStart ? '#808080' : '#404040';
        ctx.lineWidth = isMeasureStart ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(x, topPadding);
        ctx.lineTo(x, height - numberHeight);
        ctx.stroke();

        // Draw measure number on measure start
        if (isMeasureStart) {
          ctx.fillStyle = '#808080';
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(measureNumber.toString(), x - 8, height - 6);
        }
      });

      // Calculate current position in bars:beats:sixteenths
      const beatsPerSecond = bpm / 60;
      const totalBeats = currentTime * beatsPerSecond;
      const sixteenthsPerBeat = 4;
      const totalSixteenths = Math.floor(totalBeats * sixteenthsPerBeat);
      
      const sixteenthsPerBar = Number(timeSignature.split('/')[0]) * sixteenthsPerBeat;
      const bars = Math.floor(totalSixteenths / sixteenthsPerBar);
      const remainingSixteenths = totalSixteenths % sixteenthsPerBar;
      
      const beats = Math.floor(remainingSixteenths / sixteenthsPerBeat);
      const sixteenths = remainingSixteenths % sixteenthsPerBeat;



      // Draw playhead relative to scroll position
        const playheadX = (currentTime - scrollOffset) * pixelsPerSecond;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, topPadding);
      ctx.lineTo(playheadX, height - numberHeight);
      ctx.stroke();

      if (isPlaying) {
        if (animationFrameRef.current !== null) {
          animationFrameRef.current = requestAnimationFrame(draw);
        }
      }
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(draw);

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

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

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
