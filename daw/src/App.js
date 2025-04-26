import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DAW from './components/DAW';
import SongList from './components/SongList';
import { getSongs } from './api/songs';
import './App.css';

const DRAWER_WIDTH = 360;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    }
  }
});

function App() {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const isMobile = useMediaQuery(darkTheme.breakpoints.down('sm'));

  useEffect(() => {
    const loadSongs = async () => {
      try {
        const data = await getSongs();
        setSongs(data);
      } catch (err) {
        console.error('Error loading songs:', err);
        setError('Failed to load songs');
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  const handleSongSelect = (song) => {
    setSelectedSong(song);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', overflow: 'hidden', position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            left: drawerOpen ? DRAWER_WIDTH : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            transition: darkTheme.transitions.create('left', {
              easing: darkTheme.transitions.easing.sharp,
              duration: darkTheme.transitions.duration.leavingScreen,
            })
          }}
        >
          <IconButton
            onClick={toggleDrawer}
            sx={{
              position: 'relative',
              left: -1,
              bgcolor: 'background.paper',
              borderRadius: '0 4px 4px 0',
              border: 1,
              borderLeft: 0,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>

        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          <SongList
            songs={songs}
            onSongSelect={handleSongSelect}
            selectedSongId={selectedSong?.id}
          />
        </Drawer>

        <Box
          sx={{
            position: 'absolute',
            left: drawerOpen ? DRAWER_WIDTH : 0,
            right: 0,
            top: 0,
            bottom: 0,
            transition: darkTheme.transitions.create('left', {
              easing: darkTheme.transitions.easing.sharp,
              duration: darkTheme.transitions.duration.leavingScreen,
            })
          }}
        >

          {selectedSong ? (
            <DAW
              song={selectedSong}
              key={selectedSong.id}
            />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a song to begin
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
