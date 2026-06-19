export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface NodeData {
  id: string;
  name: string;
  type: 'FOLDER' | 'FILE';
  parentId: string | null;
  owners: User[];
  hasChildren: boolean;
}

export interface FolderData {
  id: string;
  name: string;
  type: 'FOLDER' | 'FILE';
  parentId: string | null;
}
