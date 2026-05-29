import client from './client';
import type { Folder, MindMap, NodeData } from '../types';

export const getMindMaps = async (): Promise<MindMap[]> => {
  const res = await client.get('/api/v1/mindmaps');
  return res.data.data;
};

export const createMindMap = async (title: string, folderId?: number | null): Promise<MindMap> => {
  const res = await client.post('/api/v1/mindmaps', { title, folderId: folderId ?? null });
  return res.data.data;
};

export const updateMindMap = (id: number, title: string) =>
  client.patch(`/api/v1/mindmaps/${id}`, { title });

export const deleteMindMap = (id: number) =>
  client.delete(`/api/v1/mindmaps/${id}`);

export const getNodes = async (mindMapId: number): Promise<NodeData[]> => {
  const res = await client.get(`/api/v1/mindmaps/${mindMapId}/nodes`);
  return res.data.data;
};

export const createRootNode = async (mindMapId: number, content: string): Promise<NodeData> => {
  const res = await client.post(`/api/v1/mindmaps/${mindMapId}/nodes/root`, { content });
  return res.data.data;
};

export const createChildNode = async (
  mindMapId: number,
  parentId: number,
  content: string,
  positionX: number,
  positionY: number
): Promise<NodeData> => {
  const res = await client.post(`/api/v1/mindmaps/${mindMapId}/nodes`, {
    parentId,
    content,
    positionX,
    positionY,
  });
  return res.data.data;
};

export const updateNode = (
  mindMapId: number,
  nodeId: number,
  content: string,
  positionX: number,
  positionY: number
) => client.patch(`/api/v1/mindmaps/${mindMapId}/nodes/${nodeId}`, { content, positionX, positionY });

export const deleteNode = (mindMapId: number, nodeId: number) =>
  client.delete(`/api/v1/mindmaps/${mindMapId}/nodes/${nodeId}`);

// 폴더 이동: 백엔드 PATCH /mindmaps/{id} 는 title + folderId 를 함께 받음
export const moveMindMap = (mindMapId: number, title: string, folderId: number | null) =>
  client.patch(`/api/v1/mindmaps/${mindMapId}`, { title, folderId });

export const getFolders = async (): Promise<Folder[]> => {
  const res = await client.get('/api/v1/folders');
  return res.data.data;
};

export const createFolder = async (name: string, parentId?: number): Promise<Folder> => {
  const res = await client.post('/api/v1/folders', { name, parentId: parentId ?? null });
  return res.data.data;
};

export const renameFolder = async (id: number, name: string) =>
  client.patch(`/api/v1/folders/${id}`, { name });

export const moveFolder = (folderId: number, parentId: number | null) =>
  client.patch(`/api/v1/folders/${folderId}/parent`, { parentId });

export const deleteFolder = (id: number) =>
  client.delete(`/api/v1/folders/${id}`);

export const createMindMapFromPdf = async (file: File, folderId?: number): Promise<MindMap> => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId != null) formData.append('folderId', String(folderId));
  const res = await client.post('/api/v1/mindmaps/from-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};
