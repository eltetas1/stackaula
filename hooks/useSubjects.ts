'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Subject } from '@/types/subjects';

interface UseSubjectsResult {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSubjects(): UseSubjectsResult {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const subjectsRef = collection(db, 'subjects');
      const q = query(subjectsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const subjectsData: Subject[] = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        color: doc.data().color,
        icon: doc.data().icon,
        description: doc.data().description,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      setSubjects(subjectsData);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Error al cargar las asignaturas');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchSubjects();
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return {
    subjects,
    loading,
    error,
    refresh
  };
}