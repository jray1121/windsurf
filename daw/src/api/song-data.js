// Mock API endpoint for song data
export const getSongData = () => {
  return {
    id: 1,
    title: "Demo Song",
    bpm: 120,
    timeSignature: 4,
    tracks: [
      {
        id: 1,
        name: "Drums",
        audioUrl: "https://example.com/drums.mp3",
        volume: 80,
        pan: 0,
        isMuted: false,
        isSolo: false
      },
      {
        id: 2,
        name: "Bass",
        audioUrl: "https://example.com/bass.mp3",
        volume: 75,
        pan: -20,
        isMuted: false,
        isSolo: false
      },
      {
        id: 3,
        name: "Guitar",
        audioUrl: "https://example.com/guitar.mp3",
        volume: 70,
        pan: 20,
        isMuted: false,
        isSolo: false
      }
    ]
  };
};
