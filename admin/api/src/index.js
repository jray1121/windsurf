import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));

app.use(express.json());

// Serve static files from uploads directory with CORS
app.use('/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uuid = uuidv4();
    // Store the mapping between UUID and original filename
    fileMapping[uuid] = {
      originalName: file.originalname,
      uuid: uuid,
      ext: ext
    };
    cb(null, `${uuid}${ext}`);
  },
});

// Keep track of original filenames
const fileMapping = {};

const upload = multer({ storage });

// File-based storage for songs and tracks
const dataFile = path.join(__dirname, '../data/songs.json');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load existing songs from file
let songs = [];
if (fs.existsSync(dataFile)) {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    songs = JSON.parse(data);
    console.log('Loaded songs from file:', songs.length);
  } catch (error) {
    console.error('Error loading songs from file:', error);
  }
}

// Save songs to file
const saveSongs = () => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(songs, null, 2));
    console.log('Saved songs to file');
  } catch (error) {
    console.error('Error saving songs to file:', error);
  }
};

// Routes
app.get('/api/songs', (req, res) => {
  res.json(songs);
});

app.post('/api/tracks/upload', upload.array('files', 12), (req, res) => {
  console.log('Received track upload request:', {
    body: req.body,
    file: req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null
  });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const { songTitle, voicing, types, timeSignature, beatValue } = req.body;
  const trackTypes = Array.isArray(types) ? types : [types];

  if (trackTypes.length !== req.files.length) {
    return res.status(400).json({ error: 'Number of track types must match number of files' });
  }

  console.log('Processing tracks:', { 
    songTitle, 
    voicing, 
    trackTypes, 
    timeSignature, 
    beatValue,
    fileCount: req.files.length
  });

  let song = songs.find(s => s.title === songTitle);
  console.log('Found existing song:', song ? { id: song.id, title: song.title, trackCount: song.tracks.length } : 'none');

  if (!song) {
    song = {
      id: uuidv4(),
      title: songTitle,
      voicing,
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    songs.push(song);
    console.log('Created new song:', { id: song.id, title: song.title });
  }

  // Process each file and its corresponding track type
  const newTracks = req.files.map((file, index) => {
    const trackType = trackTypes[index];
    const fileUuid = path.basename(file.path, path.extname(file.path));
    const filePath = `/uploads/${path.basename(file.path)}`;

    // Remove any existing track of the same type
    song.tracks = song.tracks.filter(t => t.type !== trackType);

    return {
      id: uuidv4(),
      type: trackType,
      filePath,
      originalName: fileMapping[fileUuid].originalName,
      timeSignature: timeSignature || '4/4',
      beatValue: beatValue || '1/4',
      uploadedAt: new Date()
    };
  });

  // Add all new tracks
  song.tracks.push(...newTracks);
  song.updatedAt = new Date();

  console.log('Updated song tracks:', {
    id: song.id,
    title: song.title,
    trackCount: song.tracks.length,
    tracks: song.tracks.map(t => ({ id: t.id, type: t.type }))
  });

  // Save changes to file
  saveSongs();

  res.json({ 
    song,
    addedTracks: newTracks.map(t => ({ id: t.id, type: t.type }))
  });
});

app.delete('/api/songs/:songId', (req, res) => {
  const songIndex = songs.findIndex(s => s.id === req.params.songId);
  if (songIndex === -1) {
    return res.status(404).json({ error: 'Song not found' });
  }

  songs.splice(songIndex, 1);
  saveSongs();
  res.json({ message: 'Song deleted successfully' });
});

app.delete('/api/songs/:songId/tracks/:trackId', (req, res) => {
  const song = songs.find(s => s.id === req.params.songId);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  const trackIndex = song.tracks.findIndex(t => t.id === req.params.trackId);
  if (trackIndex === -1) {
    return res.status(404).json({ error: 'Track not found' });
  }

  song.tracks.splice(trackIndex, 1);
  saveSongs();
  res.json({ message: 'Track deleted successfully' });
});

app.put('/api/songs/:songId', (req, res) => {
  const song = songs.find(s => s.id === req.params.songId);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  Object.assign(song, {
    ...req.body,
    updatedAt: new Date()
  });

  saveSongs();
  res.json(song);
});

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
