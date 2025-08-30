'use client';

import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { useState } from 'react';

export default function TestFirebasePage() {
  const [docs, setDocs] = useState<any[]>([]);

  async function writeSample() {
    await addDoc(collection(db, 'pruebas'), { hola: 'mundo', ts: Date.now() });
    alert('Documento creado');
  }

  async function readSample() {
    const snap = await getDocs(collection(db, 'pruebas'));
    setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Test Firebase</h1>
      <button onClick={writeSample} style={{ marginRight: 8, border: '1px solid #ccc', padding: 8 }}>
        Escribir doc
      </button>
      <button onClick={readSample} style={{ border: '1px solid #ccc', padding: 8 }}>
        Leer docs
      </button>

      <pre style={{ marginTop: 16, background: '#f7f7f7', padding: 12 }}>
        {JSON.stringify(docs, null, 2)}
      </pre>
    </div>
  );
}
