import axios from 'axios';
import SecureStore from '../utils/secureStore';

const api = axios.create({
  baseURL: 'https://civil-erp.onrender.com/api', // Render host target
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically inject Username/Password headers or basic credentials if needed
// (Bypasses JWT checks as JWT is no longer enforced on the backend)
api.interceptors.request.use(
  async (config) => {
    const userSession = await SecureStore.getItemAsync('user_session');
    if (userSession) {
      const parsed = JSON.parse(userSession);
      // Optional: Pass username context in headers if downstream routes expect a user context
      config.headers['X-User-Id'] = parsed.id;
      config.headers['X-User-Role'] = parsed.role;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
