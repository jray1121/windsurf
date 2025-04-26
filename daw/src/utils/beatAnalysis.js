export const detectBeats = async (audioBuffer, { threshold = 0.15, beatValue = '1/4', timeSignature = '4/4' } = {}) => {
  // Get audio data
  const rawData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;
  
  // Process in chunks to detect peaks
  const chunkSize = 1024;
  const peaks = [];
  
  // Calculate RMS values for normalization
  let sum = 0;
  for (let i = 0; i < rawData.length; i++) {
    sum += rawData[i] * rawData[i];
  }
  const rms = Math.sqrt(sum / rawData.length);
  
  // Normalize threshold based on RMS
  const normalizedThreshold = threshold * rms;
  
  // Find peaks
  let lastPeakIndex = -chunkSize; // Prevent detecting peaks too close together
  
  for (let i = 0; i < rawData.length; i++) {
    const amplitude = Math.abs(rawData[i]);
    
    if (amplitude > normalizedThreshold && (i - lastPeakIndex) >= chunkSize) {
      peaks.push(i / sampleRate); // Convert sample index to seconds
      lastPeakIndex = i;
    }
  }
  
  // Calculate tempo and beat positions
  if (peaks.length < 2) return { bpm: 120, beats: [] };
  
  // Calculate intervals between peaks
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }
  
  // Find the most common interval (mode) with some tolerance
  const tolerance = 0.01; // 10ms tolerance
  const intervalGroups = {};
  let maxCount = 0;
  let mostCommonInterval = intervals[0];
  
  intervals.forEach(interval => {
    let foundGroup = false;
    for (let baseInterval in intervalGroups) {
      if (Math.abs(interval - baseInterval) < tolerance) {
        intervalGroups[baseInterval].count++;
        intervalGroups[baseInterval].sum += interval;
        if (intervalGroups[baseInterval].count > maxCount) {
          maxCount = intervalGroups[baseInterval].count;
          mostCommonInterval = intervalGroups[baseInterval].sum / intervalGroups[baseInterval].count;
        }
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      intervalGroups[interval] = { count: 1, sum: interval };
    }
  });
  
  // Parse time signature and beat value
  const [beatsPerBar, beatUnit] = timeSignature.split('/').map(Number);
  const [beatValueNumerator, beatValueDenominator] = beatValue.split('/').map(Number);

  // Calculate BPM based on beat value
  const beatRatio = (beatValueDenominator / beatUnit) * (beatValueNumerator / 1);
  const rawBpm = Math.round(60 / (mostCommonInterval * beatRatio));
  
  // Ensure BPM is in a reasonable range (60-200)
  let adjustedBpm = rawBpm;
  while (adjustedBpm < 60) adjustedBpm *= 2;
  while (adjustedBpm > 200) adjustedBpm /= 2;

  // Calculate beats per measure
  const beatsPerMeasure = beatsPerBar * (beatUnit / beatValueDenominator);
  
  // Calculate measure and beat information for each peak
  const beatInfo = peaks.map(time => {
    const totalBeats = time * (adjustedBpm / 60);
    const measure = Math.floor(totalBeats / beatsPerMeasure) + 1;
    const beat = Math.floor(totalBeats % beatsPerMeasure) + 1;
    const sixteenth = Math.floor((totalBeats * 4) % 4) + 1;

    return {
      time,
      measure,
      beat,
      sixteenth
    };
  });

  return {
    bpm: adjustedBpm,
    timeSignature,
    beatValue,
    beatsPerMeasure,
    beats: beatInfo
  };
};
