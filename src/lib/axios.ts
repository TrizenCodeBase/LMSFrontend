import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
});

// Add token to requests if available
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle common errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiry or unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface FileUrlResponse {
  url: string;
}

// Helper function to get file URLs
export const getImageUrl = async (path: string) => {
  if (!path) return '';
  
  try {
    // Extract bucket and filename from path (format: bucket/filename)
    const [bucket, filename] = path.split('/');
    if (!bucket || !filename) return '';

    const response = await instance.get<FileUrlResponse>(`/api/files/${bucket}/${filename}`);
    return response.data.url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return '';
  }
};

export default instance;
