import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8080',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await client.post('/api/v1/users/refresh', null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });
          const newAccessToken = res.data.data.accessToken;
          localStorage.setItem('token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return client(originalRequest);
        } catch {
          // refresh 실패 시 로그아웃
        }
      }
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default client;
