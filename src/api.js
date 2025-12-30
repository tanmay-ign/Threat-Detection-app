import axios from 'axios';

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api'  // Use Vite proxy in development
  : `${import.meta.env.VITE_BACKEND_URL}/api`;  // Direct URL in production

console.log('[API] Base URL:', API_BASE_URL);
console.log('[API] Environment:', import.meta.env.MODE);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,  // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch system health status
 * @returns {Promise} Health status data
 */
export const fetchHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error fetching health:', error);
    throw error;
  }
};

/**
 * Fetch alerts from the detection system
 * @returns {Promise} Alerts data
 */
export const fetchAlerts = async () => {
  try {
    const response = await api.get('/detect/alerts');
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};

/**
 * Fetch detection history
 * @param {Object} params 
 * @returns {Promise} 
 */
export const getDetectionHistory = async (params = {}) => {
  try {
    const response = await api.get('/detect/history', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching detection history:', error);
    throw error;
  }
};

/**
 * Fetch detection statistics (unique object counts)
 * @returns {Promise} Detection stats data
 */
export const getDetectionStats = async () => {
  try {
    const response = await api.get('/detections/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching detection stats:', error);
    throw error;
  }
};

export default api;
