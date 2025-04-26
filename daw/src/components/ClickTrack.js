import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const ClickTrack = ({ audioBuffer, currentTime, isPlaying, beatValue, timeSignature }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !audioBuffer) return;

    // Set canvas size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate beat positions
    const beatsPerMeasure = parseInt(timeSignature);
    const beatDuration = 60 / (audioBuffer.sampleRate * beatValue); // Duration of one beat
    const totalBeats = Math.floor(audioBuffer.duration / beatDuration);

    // Calculate pixels per beat
    const pixelsPerBeat = canvas.width / (totalBeats * 1.1); // Add 10% padding

    // Draw beat markers
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    for (let i = 0; i < totalBeats; i++) {
      const x = i * pixelsPerBeat;
      const isMeasureStart = i % beatsPerMeasure === 0;
      
      ctx.beginPath();
      ctx.moveTo(x, canvas.height * 0.2);
      ctx.lineTo(x, canvas.height * (isMeasureStart ? 0.8 : 0.6));
      ctx.stroke();

      if (isMeasureStart) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText((i / beatsPerMeasure) + 1, x, canvas.height - 5);
      }
    }

    // Draw playhead
    if (typeof currentTime === 'number' && currentTime >= 0) {
      const playheadX = (currentTime / beatDuration) * pixelsPerBeat;
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.stroke();
    }
  }, [audioBuffer, currentTime, isPlaying, beatValue, timeSignature]);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: 100,
        width: '100%',
        bgcolor: '#1a1a1a',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </Box>
  );
};

export default ClickTrack;
