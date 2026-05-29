import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8080',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 응답(토큰 만료/무효)만 로그아웃 처리, 403은 일반 에러로 전파
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default client;
