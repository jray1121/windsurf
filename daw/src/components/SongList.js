import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography
} from '@mui/material';

const SongList = ({ songs, onSongSelect, selectedSongId }) => {
  return (
    <Paper 
      elevation={1}
      sx={{ 
        width: '100%',
        maxWidth: 360,
        bgcolor: 'background.paper',
        borderRadius: 1
      }}
    >
      <Typography
        variant="h6"
        sx={{
          p: 2,
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        Available Songs
      </Typography>
      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {songs.map((song) => (
          <ListItem key={song.id} disablePadding>
            <ListItemButton
              selected={selectedSongId === song.id}
              onClick={() => onSongSelect(song)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }
              }}
            >
              <ListItemText 
                primary={song.title}
                secondary={song.voicing.toUpperCase()}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default SongList;
