'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

export default function SeedPage() {
  const [done, setDone] = useState(false);

  async function seed() {
    // IDs fijos para que sea entendible
    await setDoc(doc(db, 'families', 'garcia'), {
      name: 'Familia García',
      tutorEmail: 'madre.garcia@example.com',
      members: ['alumno1'],
    });

    await setDoc(doc(db, 'students', 'alumno1'), {
      name: 'Lucas García',
      familyId: 'garcia',
      grade: '5º',
      group: 'B',
      subjects: ['mat', 'len'],
    });

    await setDoc(doc(db, 'subjects', 'mat'), { name: 'Matemáticas', color: '#60a5fa' });
    await setDoc(doc(db, 'subjects', 'len'), { name: 'Lengua', color: '#34d399' });

    // Aviso general para 5ºB (puedes empezar por 'all' para simplificar)
    await setDoc(doc(collection(db, 'avisos')), {
      type: 'aviso',
      title: 'Salida al museo',
      content: 'Recordad autorización y almuerzo.',
      createdAt: Date.now(),
      subjectId: 'mat',
      target: { scope: 'group', grade: '5º', group: 'B' },
      createdBy: 'teacher1',
    });

    // Tarea solo para Lucas
    await setDoc(doc(collection(db, 'avisos')), {
      type: 'tarea',
      title: 'Fracciones pág. 32 (1-8)',
      content: 'Entrega el viernes',
      dueDate: Date.now() + 3 * 86400000,
      createdAt: Date.now(),
      subjectId: 'mat',
      target: { scope: 'student', studentId: 'alumno1' },
      createdBy: 'teacher1',
    });

    // Users (mapea los UID reales cuando los tengas)
    await setDoc(doc(db, 'users', 'F65RpikwEAaFTXI61e9xChxXuGq1'), { role: 'teacher' });
    await setDoc(doc(db, 'users', '1jyegXHkoyQSQva0DF35yxkl0Kj1'), { role: 'family', familyId: 'garcia' });

    setDone(true);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Seed</h1>
      <p>Esta página crea datos de ejemplo.</p>
      <button onClick={seed} style={{ padding: 12, border: '1px solid #ccc' }}>
        Crear demo
      </button>
      {done && <p>OK ✅</p>}
      <p style={{ marginTop: 16, color: '#666' }}>
        Luego **endurece las reglas** (siguiente paso).
      </p>
    </div>
  );
}
