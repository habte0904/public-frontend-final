// Backup of production URL saved in baseUrl.prod.bak.js
// Uses VITE_API_URL from .env if present, otherwise defaults to local backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api1 = API_BASE;
export const api2 = API_BASE;
