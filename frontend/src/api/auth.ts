import client from './client';

export const signup = (email: string, password: string, nickname: string) =>
  client.post('/api/v1/users/signup', { email, password, nickname });

export const login = async (email: string, password: string): Promise<string> => {
  const res = await client.post('/api/v1/users/login', { email, password });
  return res.data.data.accessToken;
};
