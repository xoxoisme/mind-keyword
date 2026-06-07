import client from './client';

export const signup = (email: string, password: string, nickname: string) =>
  client.post('/api/v1/users/signup', { email, password, nickname });

export const login = async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const res = await client.post('/api/v1/users/login', { email, password });
  return res.data.data;
};

export const sendVerificationCode = (email: string) =>
  client.post('/api/v1/user/email/verify-request', { email });

export const confirmVerificationCode = (email: string, code: string) =>
  client.post('/api/v1/user/email/verify-confirm', { email, code });
