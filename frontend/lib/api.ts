import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
});

export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/documents/upload', formData);
  return response.data;
}

export async function createSession(documentId: string, expiresIn?: number) {
  const response = await api.post('/sessions/create', {
    documentId,
    expiresIn,
  });
  return response.data;
}

export async function getSession(sessionId: string) {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
}

export async function getQRCode(sessionId: string) {
  const response = await api.get(`/sessions/${sessionId}/qr`);
  return response.data;
}

export async function claimSession(sessionId: string, token: string) {
  const response = await api.post(`/agent/sessions/${sessionId}/claim`, {
    token,
  });
  return response.data;
}

export async function streamDocument(sessionId: string, token: string) {
  const response = await api.get(`/agent/sessions/${sessionId}/stream`, {
    params: { token },
    responseType: 'blob',
  });
  return response.data;
}

export async function completeSession(sessionId: string, token: string, result: string) {
  const response = await api.post(`/agent/sessions/${sessionId}/complete`, {
    token,
    result,
  });
  return response.data;
}

export async function verifyWallet(address: string, signature: string, message: string) {
  const response = await api.post('/auth/wallet/verify', {
    address,
    signature,
    message,
  });
  return response.data;
}
