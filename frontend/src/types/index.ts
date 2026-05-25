export interface MindMap {
  id: number;
  title: string;
  folderId: number | null;
}

export interface Folder {
  id: number;
  name: string;
}

export interface NodeData {
  id: number;
  parentId: number | null;
  content: string;
  positionX: number;
  positionY: number;
}
