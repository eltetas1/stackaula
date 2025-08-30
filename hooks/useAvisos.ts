'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  startAfter, 
  getDocs,
  doc,
  getDoc,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AvisoWithId, UseAvisosOptions, UseAvisosResult } from '@/types/avisos';
import { Subject } from '@/types/subjects';

export function useAvisos(options: UseAvisosOptions = {}): UseAvisosResult {
  const { limit = 12, cursor = null, subjectId, type = 'all' } = options;
  
  const [avisos, setAvisos] = useState<AvisoWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchAvisos = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const avisosRef = collection(db, 'avisos');
      
      // Build query conditions
      const conditions = [where('published', '==', true)];
      
      if (type !== 'all') {
        conditions.push(where('type', '==', type));
      }
      
      if (subjectId) {
        conditions.push(where('subjectId', '==', subjectId));
      }

      let q = query(
        avisosRef,
        ...conditions,
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit + 1)
      );

      // Add cursor for pagination
      if (!reset && cursor) {
        q = query(
          avisosRef,
          ...conditions,
          orderBy('createdAt', 'desc'),
          startAfter(cursor),
          firestoreLimit(limit + 1)
        );
      } else if (!reset && lastDoc) {
        q = query(
          avisosRef,
          ...conditions,
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          firestoreLimit(limit + 1)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      // Check if there are more documents
      const hasMore = docs.length > limit;
      if (hasMore) {
        docs.pop(); // Remove the extra document
      }

      // Fetch subject data for each aviso
      const newAvisos: AvisoWithId[] = await Promise.all(
        docs.map(async (docSnap) => {
          const data = docSnap.data();
          let subject: Subject | undefined;
          
          if (data.subjectId) {
            try {
              const subjectDoc = await getDoc(doc(db, 'subjects', data.subjectId));
              if (subjectDoc.exists()) {
                subject = {
                  id: subjectDoc.id,
                  ...subjectDoc.data()
                } as Subject;
              }
            } catch (err) {
              console.warn('Error fetching subject:', err);
            }
          }
          
          return {
            id: docSnap.id,
            title: data.title,
            body: data.body,
            subjectId: data.subjectId,
            subject,
            createdAt: data.createdAt,
            published: data.published,
            dueDate: data.dueDate,
            type: data.type || 'aviso',
          };
        })
      );

      if (reset) {
        setAvisos(newAvisos);
      } else {
        setAvisos(prev => [...prev, ...newAvisos]);
      }
      
      setHasNext(hasMore);
      setLastDoc(docs.length > 0 ? docs[docs.length - 1] : null);
    } catch (err) {
      console.error('Error fetching avisos:', err);
      setError('Error al cargar los avisos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [limit, cursor, lastDoc, subjectId, type]);

  const loadMore = useCallback(() => {
    if (!loading && hasNext) {
      fetchAvisos(false);
    }
  }, [loading, hasNext, fetchAvisos]);

  const refresh = useCallback(() => {
    setLastDoc(null);
    fetchAvisos(true);
  }, [fetchAvisos]);

  useEffect(() => {
    fetchAvisos(true);
  }, [limit, subjectId, type]); // Only depend on limit to avoid infinite loops

  return {
    avisos,
    loading,
    error,
    hasNext,
    loadMore,
    refresh
  };
}