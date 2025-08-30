export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  createdAt: Date;
}

export const DEFAULT_SUBJECTS: Omit<Subject, 'id' | 'createdAt'>[] = [
  {
    name: 'Matemáticas',
    color: 'bg-blue-500',
    icon: 'Calculator',
    description: 'Números, operaciones y resolución de problemas'
  },
  {
    name: 'Lengua Castellana',
    color: 'bg-green-500',
    icon: 'BookOpen',
    description: 'Lectura, escritura y comprensión'
  },
  {
    name: 'Ciencias Naturales',
    color: 'bg-purple-500',
    icon: 'Microscope',
    description: 'Exploración del mundo natural'
  },
  {
    name: 'Ciencias Sociales',
    color: 'bg-orange-500',
    icon: 'Globe',
    description: 'Historia, geografía y sociedad'
  },
  {
    name: 'Educación Física',
    color: 'bg-red-500',
    icon: 'Zap',
    description: 'Actividad física y deportes'
  },
  {
    name: 'Educación Artística',
    color: 'bg-pink-500',
    icon: 'Palette',
    description: 'Expresión creativa y artística'
  },
  {
    name: 'Inglés',
    color: 'bg-indigo-500',
    icon: 'Languages',
    description: 'Idioma extranjero'
  }
];