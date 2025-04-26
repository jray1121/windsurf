import React, { useState } from 'react';
import { uploadTrack } from '../services/api';
import { voicingTypes, voiceParts } from '../constants/voicings';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  LinearProgress,
  TextField,
  Stack,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const CORE_TRACKS = [
  { id: 'click', label: 'Click Track' },
  { id: 'piano', label: 'Piano Track' },
  { id: 'all_vocals', label: 'All Vocals' }
];

const VOICING_OPTIONS = [
  { id: 'two_part_mixed', label: 'Two-Part Mixed' },
  { id: 'three_part_mixed', label: 'Three-Part Mixed' },
  { id: 'sab', label: 'SAB' },
  { id: 'satb', label: 'SATB' },
  { id: 'sa', label: 'SA' },
  { id: 'ssa', label: 'SSA' },
  { id: 'ssaa', label: 'SSAA' },
  { id: 'tb', label: 'TB' },
  { id: 'ttb', label: 'TTB' },
  { id: 'ttbb', label: 'TTBB' },
  { id: 'derric_johnson', label: 'Derric Johnson' },
  { id: 'voctave', label: 'Voctave' }
];

const VOICE_PARTS = [
  // Soprano section
  { id: 'soprano', label: 'Soprano' },
  { id: 'soprano_1', label: 'Soprano 1' },
  { id: 'soprano_2', label: 'Soprano 2' },
  // Alto section
  { id: 'alto', label: 'Alto' },
  { id: 'alto_1', label: 'Alto 1' },
  { id: 'alto_2', label: 'Alto 2' },
  // Tenor section
  { id: 'tenor', label: 'Tenor' },
  { id: 'tenor_1', label: 'Tenor 1' },
  { id: 'tenor_2', label: 'Tenor 2' },
  // Bass section
  { id: 'baritone', label: 'Baritone' },
  { id: 'bass', label: 'Bass' },
  { id: 'bass_1', label: 'Bass 1' },
  { id: 'bass_2', label: 'Bass 2' },
  // Parts
  { id: 'part_1', label: 'Part I' },
  { id: 'part_2', label: 'Part II' },
  { id: 'part_3', label: 'Part III' }
];

const AudioFileUpload = ({ onUploadSuccess }) => {
  const [songTitle, setSongTitle] = useState('');
  const [voicing, setVoicing] = useState('');
  const [composers, setComposers] = useState(['']);
  const [lyricists, setLyricists] = useState(['']);
  const [arrangers, setArrangers] = useState(['']);
  const [selectedParts, setSelectedParts] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [voicePartFiles, setVoicePartFiles] = useState({});
  const [coreTrackFiles, setCoreTrackFiles] = useState({});
  const [completedTracks, setCompletedTracks] = useState([]);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [noteValue, setNoteValue] = useState('quarter');

  // Group voice parts by section
  const voicePartSections = {
    Soprano: VOICE_PARTS.filter(part => part.id.startsWith('soprano')),
    Alto: VOICE_PARTS.filter(part => part.id.startsWith('alto')),
    Tenor: VOICE_PARTS.filter(part => part.id.startsWith('tenor')),
    Bass: VOICE_PARTS.filter(part => 
      part.id.startsWith('bass') || part.id === 'baritone'
    ),
    Parts: VOICE_PARTS.filter(part => part.id.startsWith('part'))
  };

  // Get sections to display based on voicing
  const getVoicingSections = () => {
    const voicingLabel = VOICING_OPTIONS.find(v => v.id === voicing)?.label;
    
    if (!voicingLabel) return [];

    switch (voicingTypes[voicingLabel]) {
      case 'mixed':
        return ['Parts'];
      case 'sab':
        return ['Soprano', 'Alto', 'Bass'];
      case 'satb':
        return ['Soprano', 'Alto', 'Tenor', 'Bass'];
      case 'sa':
        return ['Soprano', 'Alto'];
      case 'tb':
        return ['Tenor', 'Bass'];
      default:
        return [];
    }
  };

  const handleFileSelect = (event, trackId) => {
    const file = event.target.files[0];
    if (file) {
      if (CORE_TRACKS.find(t => t.id === trackId)) {
        setCoreTrackFiles(prev => ({
          ...prev,
          [trackId]: file
        }));
        setCurrentTrack({
          id: trackId,
          file: file
        });
      } else {
        setVoicePartFiles(prev => ({
          ...prev,
          [trackId]: file
        }));
      }
    }
  };

  const handleUpload = async () => {
    if (!songTitle.trim()) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('songTitle', songTitle.trim());
      formData.append('voicing', voicing);
      formData.append('timeSignature', timeSignature);
      formData.append('beatValue', noteValue);

      // Add core track files
      Object.entries(coreTrackFiles).forEach(([trackId, file]) => {
        formData.append('files', file);
        formData.append('types', trackId);
      });

      // Add voice part files
      Object.entries(voicePartFiles).forEach(([trackId, file]) => {
        formData.append('files', file);
        formData.append('types', trackId);
      });

      console.log('Uploading tracks:', {
        songTitle: songTitle.trim(),
        voicing,
        coreTrackCount: Object.keys(coreTrackFiles).length,
        voicePartCount: Object.keys(voicePartFiles).length
      });

      const response = await uploadTrack(formData);
      console.log('Upload successful:', response);

      // Reset form
      setSongTitle('');
      setVoicing(''); // Reset to empty string to close voice track section
      setTimeSignature('4/4');
      setNoteValue('quarter');
      setCoreTrackFiles({});
      setVoicePartFiles({});
      setUploadProgress(0);
      setCompletedTracks([]);
      setCurrentTrack(null);
      setComposers(['']); // Reset composers to a single empty field
      setLyricists(['']); // Reset lyricists to a single empty field
      setArrangers(['']); // Reset arrangers to a single empty field

      // Notify parent
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          {/* Left Column - Song Info and Core Tracks */}
          <Grid item xs={12}>
            <Paper 
              elevation={1}
              sx={{ 
                p: 2,
                borderRadius: 1,
                height: '100%'
              }}
            >
              {/* Song Info */}
              <Box>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    pb: 0.5,
                    mb: 2,
                    fontWeight: 600
                  }}
                >
                  Song Information
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Song Title"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    fullWidth
                    size="small"
                  />

                  {/* Composers */}
                  {composers.map((composer, index) => (
                    <Box key={`composer-${index}`} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        label={index === 0 ? 'Composer' : 'Additional Composer'}
                        value={composer}
                        onChange={(e) => {
                          const newComposers = [...composers];
                          newComposers[index] = e.target.value;
                          setComposers(newComposers);
                        }}
                        fullWidth
                        size="small"
                      />
                      {index === composers.length - 1 ? (
                        <IconButton 
                          size="small" 
                          onClick={() => setComposers([...composers, ''])}
                          sx={{ mt: 1 }}
                          color="primary"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setComposers(composers.filter((_, i) => i !== index));
                          }}
                          sx={{ mt: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}

                  {/* Lyricists */}
                  {lyricists.map((lyricist, index) => (
                    <Box key={`lyricist-${index}`} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        label={index === 0 ? 'Lyricist' : 'Additional Lyricist'}
                        value={lyricist}
                        onChange={(e) => {
                          const newLyricists = [...lyricists];
                          newLyricists[index] = e.target.value;
                          setLyricists(newLyricists);
                        }}
                        fullWidth
                        size="small"
                      />
                      {index === lyricists.length - 1 ? (
                        <IconButton 
                          size="small" 
                          onClick={() => setLyricists([...lyricists, ''])}
                          sx={{ mt: 1 }}
                          color="primary"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setLyricists(lyricists.filter((_, i) => i !== index));
                          }}
                          sx={{ mt: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}

                  {/* Arrangers */}
                  {arrangers.map((arranger, index) => (
                    <Box key={`arranger-${index}`} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        label={index === 0 ? 'Arranger' : 'Additional Arranger'}
                        value={arranger}
                        onChange={(e) => {
                          const newArrangers = [...arrangers];
                          newArrangers[index] = e.target.value;
                          setArrangers(newArrangers);
                        }}
                        fullWidth
                        size="small"
                      />
                      {index === arrangers.length - 1 ? (
                        <IconButton 
                          size="small" 
                          onClick={() => setArrangers([...arrangers, ''])}
                          sx={{ mt: 1 }}
                          color="primary"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setArrangers(arrangers.filter((_, i) => i !== index));
                          }}
                          sx={{ mt: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}

                  <FormControl fullWidth size="small">
                    <InputLabel>Voicing</InputLabel>
                    <Select
                      value={voicing}
                      label="Voicing"
                      onChange={(e) => setVoicing(e.target.value)}
                    >
                      {VOICING_OPTIONS.map(option => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Time Signature */}
                  <FormControl fullWidth size="small">
                    <InputLabel>Time Signature</InputLabel>
                    <Select
                      value={timeSignature}
                      label="Time Signature"
                      onChange={(e) => setTimeSignature(e.target.value)}
                    >
                      <MenuItem value="2/4">2/4</MenuItem>
                      <MenuItem value="3/4">3/4</MenuItem>
                      <MenuItem value="4/4">4/4</MenuItem>
                      <MenuItem value="6/8">6/8</MenuItem>
                      <MenuItem value="12/8">12/8</MenuItem>
                    </Select>
                  </FormControl>




                </Stack>
              </Box>

              {/* Core Tracks */}
              <Box sx={{ mt: 3 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    pb: 0.5,
                    mb: 2,
                    fontWeight: 600
                  }}
                >
                  Core Tracks
                </Typography>
                <Grid container spacing={2}>
                  {CORE_TRACKS.map(track => (
                    <Grid item xs={12} key={track.id}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 1.5, 
                          borderRadius: 1,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                      >
                        <Stack spacing={1}>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              fontWeight: 500,
                              ml: 1
                            }}
                          >
                            {track.label}
                          </Typography>
                          <div
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'audio/*';
                              input.onchange = (e) => handleFileSelect(e, track.id);
                              input.click();
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <Button
                              variant="contained"
                              fullWidth
                              startIcon={<CloudUploadIcon />}
                              size="small"
                              sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                boxShadow: 'none',
                                mb: track.id === 'click' ? 2 : 0
                              }}
                            >
                              {coreTrackFiles[track.id] ? coreTrackFiles[track.id].name : 'Upload Track'}
                            </Button>
                          </div>
                          {track.id === 'click' && (
                            <FormControl fullWidth size="small">
                              <InputLabel>Beat Value</InputLabel>
                              <Select
                                value={noteValue}
                                label="Beat Value"
                                onChange={(e) => setNoteValue(e.target.value)}
                              >
                                <MenuItem value="whole">𝅝</MenuItem>
                                <MenuItem value="half">𝅗𝅥</MenuItem>
                                <MenuItem value="quarter">𝅘𝅥</MenuItem>
                                <MenuItem value="dotted_quarter">𝅘𝅥𝅭</MenuItem>
                                <MenuItem value="eighth">♪</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Voice Parts */}
          <Grid item xs={12} md={7}>
            <Paper 
              elevation={1}
              sx={{ 
                p: 2,
                borderRadius: 1,
                height: '100%',
                bgcolor: 'background.default'
              }}
            >
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  pb: 0.5,
                  mb: 2,
                  fontWeight: 600
                }}
              >
                Voice Parts
              </Typography>
              {voicing ? (
                <Stack spacing={2}>
                  {getVoicingSections().map(section => (
                    <Box key={section}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          borderLeft: 2,
                          borderColor: 'primary.main',
                          mb: 2
                        }}
                      >
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            mb: 1.5
                          }}
                        >
                          {section}
                        </Typography>
                        <Grid container spacing={2} sx={{ pr: 1 }}>
                          {voicePartSections[section].map(part => (
                            <Grid item xs={12} sm={6} key={part.id}>
                              <Paper 
                                elevation={1} 
                                sx={{ 
                                  p: 1.5, 
                                  borderRadius: 1,
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 2
                                  }
                                }}
                              >
                                <Stack spacing={1}>
                                  <Typography 
                                    variant="body2"
                                    sx={{ 
                                      fontWeight: 500,
                                      ml: 1
                                    }}
                                  >
                                    {part.label}
                                  </Typography>
                                  <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<CloudUploadIcon />}
                                    size="small"
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'audio/*';
                                      input.onchange = (e) => handleFileSelect(e, part.id);
                                      input.click();
                                    }}
                                    sx={{
                                      borderRadius: 1,
                                      textTransform: 'none',
                                      boxShadow: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {voicePartFiles[part.id] ? voicePartFiles[part.id].name : 'Upload Track'}
                                  </Button>
                                </Stack>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ textAlign: 'center', mt: 4 }}
                >
                  Select a voicing to see available voice parts
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Upload Button and Progress */}
          {(Object.keys(coreTrackFiles).length > 0 || Object.keys(voicePartFiles).length > 0) && (
            <Grid item xs={12}>
              <Paper 
                elevation={1}
                sx={{ 
                  p: 2,
                  borderRadius: 1,
                  mt: 2
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!songTitle.trim() || uploading}
                  fullWidth
                  size="large"
                  sx={{
                    textTransform: 'none',
                    py: 1
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload All Files'}
                </Button>
              
                {uploading && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                      Uploading... {uploadProgress}%
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AudioFileUpload;
