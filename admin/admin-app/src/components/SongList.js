import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  MusicNote as MusicNoteIcon,
} from '@mui/icons-material';
import { VOICING_OPTIONS } from '../constants/voicings';
import { deleteSong, deleteTrack } from '../services/api';

const SongList = ({ songs = [], loading = false, onSongUpdate }) => {
  // Group songs by voicing
  const songsByVoicing = useMemo(() => {
    const grouped = {};
    
    // Initialize groups for all voicing options
    VOICING_OPTIONS.forEach(option => {
      grouped[option.id] = {
        label: option.label,
        songs: []
      };
    });
    
    // Group songs by voicing
    if (Array.isArray(songs)) {
      songs.forEach(song => {
        if (song.voicing && grouped[song.voicing]) {
          grouped[song.voicing].songs.push(song);
        }
      });
    }
    
    return grouped;
  }, [songs]);

  const handleDeleteSong = async (songId) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      try {
        await deleteSong(songId);
        onSongUpdate();
      } catch (error) {
        console.error('Error deleting song:', error);
        alert('Failed to delete song. Please try again.');
      }
    }
  };

  const handleDeleteTrack = async (songId, trackId) => {
    if (window.confirm('Are you sure you want to delete this track?')) {
      try {
        await deleteTrack(songId, trackId);
        onSongUpdate();
      } catch (error) {
        console.error('Error deleting track:', error);
        alert('Failed to delete track. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Songs by Voicing
      </Typography>

      <Stack spacing={3}>
        {Object.entries(songsByVoicing).map(([voicingId, { label, songs }]) => 
          songs.length > 0 && (
            <Paper key={voicingId} elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {label}
              </Typography>
              
              {songs.map((song) => (
                <Accordion key={song.id} sx={{ '&:first-of-type': { mt: 1 } }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      '& .MusicNoteIcon': {
                        mr: 2,
                        color: 'primary.main',
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <MusicNoteIcon className="MusicNoteIcon" />
                      <Typography sx={{ flex: 1 }}>{song.title}</Typography>
                      <div onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSong(song.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    </div>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <List>
                      {song.tracks?.map((track) => (
                        <ListItem
                          key={track.id}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => handleDeleteTrack(song.id, track.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={track.type}
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                Uploaded: {new Date(track.uploadDate).toLocaleDateString()}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          )
        )}
      </Stack>
    </Box>
  );
};

export default SongList;
