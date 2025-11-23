import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://127.0.0.1:8000';

export const startNewGame = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/new-game`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};