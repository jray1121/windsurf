export const detectBeats = async (audioBuffer, threshold = 0.15) => {
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
  
  // Calculate BPM
  const bpm = Math.round(60 / mostCommonInterval);
  
  // Ensure BPM is in a reasonable range (60-200)
  let adjustedBpm = bpm;
  while (adjustedBpm < 60) adjustedBpm *= 2;
  while (adjustedBpm > 200) adjustedBpm /= 2;
  
  return {
    bpm: adjustedBpm,
    beats: peaks
  };
};
