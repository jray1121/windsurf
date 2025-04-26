import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api'; // API server endpoint

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const uploadTrack = async (formData) => {
  try {
    // Log the FormData contents
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? {
        name: value.name,
        type: value.type,
        size: value.size
      } : value);
    }

    const response = await api.post('/tracks/upload', formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload Progress: ${percentCompleted}%`);
      },
    });

    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading track:', error.response ? {
      status: error.response.status,
      data: error.response.data
    } : error.message);
    throw error;
  }
};

export const getSongs = async () => {
  try {
    const response = await api.get('/songs');
    return response.data;
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
};

export const deleteSong = async (songId) => {
  try {
    const response = await api.delete(`/songs/${songId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting song:', error);
    throw error;
  }
};

export const deleteTrack = async (songId, trackId) => {
  try {
    const response = await api.delete(`/songs/${songId}/tracks/${trackId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting track:', error);
    throw error;
  }
};

export const updateSong = async (songId, data) => {
  try {
    const response = await api.put(`/songs/${songId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating song:', error);
    throw error;
  }
};
