import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography } from '@mui/material';
import AudioFileUpload from './components/AudioFileUpload';
import SongList from './components/SongList';
import { getSongs } from './services/api';
import { theme } from './theme';

function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const data = await getSongs();
        setSongs(data);
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Main content area */}
        <Box 
          sx={{ 
            width: 'calc(100% - 450px)', 
            overflow: 'auto', 
            pt: 2, 
            pb: 8 
          }}
        >
          <Container maxWidth={false} sx={{ pl: 3 }}>
            <AudioFileUpload 
              onUploadSuccess={() => {
                // Refresh the song list after successful upload
                getSongs().then(setSongs).catch(console.error);
              }} 
            />
          </Container>

          {/* Footer */}
          <Box
            component="footer"
            sx={{
              py: 3,
              px: 2,
              mt: 4,
              position: 'fixed',
              bottom: 0,
              left: 0,
              width: 'calc(100% - 450px)',
              backgroundColor: (theme) =>
                theme.palette.mode === 'light'
                  ? theme.palette.grey[200]
                  : theme.palette.grey[800],
              zIndex: 1
            }}
          >
            <Container maxWidth="sm">
              <Typography variant="body2" color="text.secondary" align="center">
                PlayEXL Admin Interface {new Date().getFullYear()}
              </Typography>
            </Container>
          </Box>
        </Box>

        {/* Fixed right sidebar */}
        <Box 
          sx={{ 
            width: '450px',
            height: '100vh',
            overflow: 'auto',
            borderLeft: 1,
            borderColor: 'divider',
            position: 'fixed',
            right: 0,
            top: 0,
            bgcolor: 'background.default',
            pt: 2,
            px: 3,
            zIndex: 2
          }}
        >
          <SongList 
            songs={songs} 
            loading={loading} 
            onSongUpdate={() => {
              // Refresh the song list after updates
              getSongs().then(setSongs).catch(console.error);
            }} 
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
