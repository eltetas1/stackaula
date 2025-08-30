// Script for seeding initial data
// This file contains example data and functions to help seed the Firebase database
// Run these functions in the Firebase Console or create a separate admin script

import { Timestamp } from 'firebase/firestore';
import { DEFAULT_SUBJECTS } from '@/types/subjects';

// Sample subjects data
export const sampleSubjects = DEFAULT_SUBJECTS.map(subject => ({
  ...subject,
  createdAt: Timestamp.now()
}));
export const sampleAvisos = [
  {
    title: 'Inicio del curso escolar 2024-2025',
    body: `# Bienvenidos al nuevo curso

Estimadas familias,

Nos complace anunciar el **inicio del curso escolar 2024-2025**. Las clases comenzarán el próximo lunes 9 de septiembre.

## Horarios importantes:
- **Entrada**: 9:00h
- **Recreo**: 11:00h - 11:30h  
- **Salida**: 14:00h

Por favor, asegúrense de que los estudiantes lleguen puntualmente.

¡Esperamos un año lleno de aprendizaje y crecimiento!`,
    type: 'aviso',
    createdAt: Timestamp.now(),
    published: true
  },
  {
    title: 'Reunión de padres - Octubre 2024',
    body: `Se convoca a todas las familias a la reunión trimestral que tendrá lugar el **viernes 15 de octubre a las 17:00h** en el salón de actos.

## Orden del día:
1. Presentación del equipo docente
2. Objetivos del trimestre
3. Actividades extraescolares
4. Ruegos y preguntas

La asistencia es muy importante para el seguimiento académico de vuestros hijos.`,
    type: 'aviso',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    published: true
  },
  {
    title: 'Excursión al Museo de Ciencias',
    body: `Los alumnos de 4º y 5º de primaria realizarán una excursión educativa al **Museo de Ciencias** el próximo martes 22 de octubre.

**Detalles importantes:**
- Salida: 9:30h desde el centro
- Regreso: 15:00h aproximadamente
- Precio: 12€ por alumno
- Fecha límite inscripción: 18 de octubre

Se requiere autorización firmada de los padres.`,
    type: 'aviso',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    published: true
  }
];

// Sample tareas data (requires subjects to be created first)
export const sampleTareas = [
  {
    title: 'Ejercicios de multiplicación',
    body: `## Tarea de Matemáticas

Completa los siguientes ejercicios de multiplicación:

### Ejercicios:
1. 7 × 8 = ?
2. 9 × 6 = ?
3. 12 × 5 = ?
4. 15 × 4 = ?
5. 8 × 9 = ?

### Instrucciones:
- Resuelve cada multiplicación
- Muestra el proceso de cálculo
- Revisa tus respuestas antes de entregar

**Recuerda**: Si tienes dudas, pregunta en clase.`,
    type: 'tarea',
    subjectId: 'matematicas', // This should match the actual subject ID
    dueDate: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 days from now
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
    published: true
  },
  {
    title: 'Lectura: "El Principito"',
    body: `## Tarea de Lengua Castellana

Lee los capítulos 1-3 de "El Principito" y responde las siguientes preguntas:

### Preguntas de comprensión:
1. ¿Qué dibujó el narrador cuando era niño?
2. ¿Cómo reaccionaron los adultos ante su dibujo?
3. ¿Dónde se encuentra el piloto cuando conoce al principito?
4. ¿Qué le pide el principito al piloto?

### Actividad creativa:
Dibuja tu interpretación del primer dibujo del narrador.

**Fecha de entrega**: Viernes en clase`,
    type: 'tarea',
    subjectId: 'lengua', // This should match the actual subject ID
    dueDate: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    published: true
  }
];
// Instructions for seeding data:
// 1. First, create subjects:
//    - Go to Firebase Console → Firestore Database
//    - Create collection 'subjects'
//    - Add documents from sampleSubjects array
// 2. Then create avisos:
//    - Create collection 'avisos' 
//    - Add documents from sampleAvisos array
// 3. Finally, create tareas:
//    - Add documents from sampleTareas array to 'avisos' collection
//    - Make sure subjectId matches actual subject document IDs
// 
// Or use this data in a Firebase Admin SDK script for automated seeding