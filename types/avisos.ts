import { Timestamp } from 'firebase/firestore';
import { Subject } from './subjects';

export interface Aviso {
  id: string;
  title: string;
  body: string;
  subjectId?: string;
  subject?: Subject;
  createdAt: Timestamp;
  published: boolean;
  dueDate?: Timestamp;
  type: 'aviso' | 'tarea';
}

export interface AvisoWithId extends Omit<Aviso, 'id'> {
  id: string;
}

export interface UseAvisosOptions {
  limit?: number;
  cursor?: Timestamp | null;
  subjectId?: string;
  type?: 'aviso' | 'tarea' | 'all';
}

export interface UseAvisosResult {
  avisos: AvisoWithId[];
  loading: boolean;
  error: string | null;
  hasNext: boolean;
  loadMore: () => void;
  refresh: () => void;
}