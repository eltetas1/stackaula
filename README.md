# Aula CEIP - Portal Educativo

Portal de comunicación y gestión de tareas para la comunidad educativa del centro, desarrollado con Next.js, TypeScript, Tailwind CSS y Firebase.

## 🚀 Características

- **Avisos**: Sistema completo de gestión y visualización de comunicaciones
- **Tareas**: Gestión de tareas por asignatura con fechas de entrega
- **Asignaturas**: Sistema de categorización con colores e iconos
- **Panel del Maestro**: Interfaz completa para crear y gestionar contenido
- **Responsive**: Diseño adaptativo para móvil, tablet y desktop
- **Accesible**: Cumple estándares de accesibilidad (WCAG AA)
- **Cookies**: Banner de consentimiento y políticas
- **Firebase**: Backend con Firestore para almacenamiento de datos

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 13+ (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui components
- **Backend**: Firebase/Firestore
- **Markdown**: react-markdown con sanitización
- **Fonts**: Inter (Google Fonts)

## 📋 Requisitos previos

- Node.js 18+ 
- npm/pnpm/yarn
- Cuenta de Firebase con proyecto configurado

## ⚙️ Configuración

### 1. Instalar dependencias

\`\`\`bash
npm install
# o
pnpm install
\`\`\`

### 2. Configurar variables de entorno

Renombra \`.env.local.example\` a \`.env.local\` y completa con tus credenciales de Firebase:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
\`\`\`

### 3. Configurar Firestore

#### Estructura de datos:

**Colección: \`subjects\`**
\`\`\`javascript
{
  name: string,           // Nombre de la asignatura
  color: string,          // Clase CSS del color (ej: 'bg-blue-500')
  icon: string,           // Nombre del icono de Lucide React
  description: string,    // Descripción opcional
  createdAt: Timestamp    // Fecha de creación
}
\`\`\`

**Colección: \`avisos\`**
\`\`\`javascript
{
  title: string,           // Título del aviso
  body: string,           // Contenido en markdown
  type: string,           // 'aviso' | 'tarea'
  subjectId: string,      // ID de la asignatura (opcional)
  dueDate: Timestamp,     // Fecha de entrega (solo tareas)
  createdAt: Timestamp,   // Fecha de creación (server)
  published: boolean      // Estado de publicación
}
\`\`\`

#### Reglas de Firestore (orientativas para MVP):

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Subjects: lectura pública
    match /subjects/{document} {
      allow read: if true;
      // TODO: Restrict writing to authenticated teachers in production
      allow write: if false; // No writes from client in MVP
    }
    
    // Avisos: lectura pública solo de publicados
    match /avisos/{document} {
      allow read: if resource.data.published == true;
      // TODO: Restrict writing to authenticated teachers in production
      allow write: if false; // No writes from client in MVP
    }
  }
}
\`\`\`

### 4. Seedear datos de ejemplo

Puedes usar los datos de ejemplo en \`lib/seed-data.ts\`:

1. **Primero, crea las asignaturas**:
   - Ve a la consola de Firebase → Firestore Database
   - Crea la colección 'subjects'
   - Añade documentos desde \`sampleSubjects\`

2. **Luego, crea avisos y tareas**:
   - Crea la colección 'avisos'
   - Añade documentos desde \`sampleAvisos\` y \`sampleTareas\`
   - **Importante**: Actualiza los \`subjectId\` en las tareas con los IDs reales de las asignaturas creadas

## 🏃‍♂️ Ejecutar en desarrollo

\`\`\`bash
npm run dev
# o
pnpm dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 📁 Estructura del proyecto

\`\`\`
app/                    # App Router (Next.js 13+)
├── avisos/
│   ├── [id]/          # Detalle de aviso
│   └── page.tsx       # Listado completo
├── tareas/
│   ├── [id]/          # Detalle de tarea
│   └── page.tsx       # Listado completo por asignatura
├── maestro/           # Panel del maestro
│   └── page.tsx       # Dashboard y gestión
├── legal/
│   └── cookies/       # Política de cookies
├── layout.tsx         # Layout principal
└── page.tsx          # Home

components/             # Componentes reutilizables
├── avisos/            # Componentes específicos de avisos
├── maestro/           # Componentes del panel del maestro
├── subjects/          # Componentes de asignaturas
├── cookies/           # Banner de cookies
├── layout/            # Header y Footer
└── ui/               # shadcn/ui components

hooks/                 # Custom hooks
├── useAvisos.ts      # Hook para gestión de avisos
├── useAviso.ts       # Hook para aviso individual
├── useSubjects.ts    # Hook para gestión de asignaturas
└── useCookieConsent.ts

lib/                   # Utilidades y configuración
├── firebase.ts       # Configuración Firebase
├── format.ts         # Funciones de formato
├── utils.ts          # Utilidades generales
└── seed-data.ts      # Datos de ejemplo

types/                 # Definiciones TypeScript
├── avisos.ts         # Tipos para avisos y tareas
└── subjects.ts       # Tipos para asignaturas
\`\`\`

## 👨‍🏫 Panel del Maestro

El panel del maestro (\`/maestro\`) incluye:

### Dashboard
- Estadísticas generales (avisos, tareas, asignaturas)
- Actividad reciente
- Vista rápida del estado del aula

### Crear Avisos
- Formulario para comunicaciones generales
- Editor markdown con vista previa
- Control de publicación

### Crear Tareas
- Formulario específico para tareas
- **Selección de asignatura obligatoria**
- Fecha de entrega opcional
- Vista previa de la asignatura seleccionada

### Gestionar Asignaturas
- Crear nuevas asignaturas personalizadas
- Botón para crear asignaturas por defecto
- Selección de colores e iconos
- Vista previa en tiempo real

## 🔒 Seguridad y TODOs

### Para producción:
- [ ] Implementar autenticación de maestros
- [ ] Configurar reglas de Firestore más restrictivas
- [ ] Añadir validación server-side para contenido
- [ ] Implementar rate limiting
- [ ] Configurar HTTPS y headers de seguridad
- [ ] Añadir logging y monitorización

### Funcionalidades futuras:
- [ ] Edición y eliminación de avisos/tareas
- [ ] Sistema de entrega de tareas por parte de alumnos
- [ ] Gestión de alumnos y calificaciones
- [ ] Dashboard con analytics del aula
- [ ] Sistema de notificaciones push
- [ ] Búsqueda y filtrado avanzado
- [ ] Calendario integrado con fechas de entrega
- [ ] Archivo de documentos
- [ ] Exportación de datos

## 🎨 Sistema de Asignaturas

### Colores disponibles:
- Azul, Verde, Púrpura, Naranja, Rojo, Rosa, Índigo, Amarillo, Teal, Cyan

### Iconos disponibles:
- Calculator, BookOpen, Microscope, Globe, Zap, Palette, Languages, Music, Camera, Gamepad2, Heart, Star

### Asignaturas por defecto:
- **Matemáticas** (Azul, Calculator)
- **Lengua Castellana** (Verde, BookOpen)
- **Ciencias Naturales** (Púrpura, Microscope)
- **Ciencias Sociales** (Naranja, Globe)
- **Educación Física** (Rojo, Zap)
- **Educación Artística** (Rosa, Palette)
- **Inglés** (Índigo, Languages)
## 🎨 Diseño

- **Tema**: Minimalista y claro
- **Tipografía**: Inter con jerarquía clara
- **Colores**: Paleta neutral con acentos azules
- **Asignaturas**: Sistema de colores distintivos para fácil identificación
- **Responsive**: Mobile-first con breakpoints adaptativos
- **Accesibilidad**: Contraste AA, focus states, roles ARIA

## 📱 Responsive Design

- **Móvil** (<768px): 1 columna
- **Tablet** (768px-1024px): 2 columnas  
- **Desktop** (>1024px): 3 columnas

## 🔄 Flujo de Trabajo del Maestro

1. **Configuración inicial**: Crear asignaturas en el panel
2. **Crear contenido**: Usar formularios específicos para avisos o tareas
3. **Asignar materias**: Seleccionar asignatura al crear tareas
4. **Gestionar fechas**: Establecer fechas de entrega para tareas
5. **Publicar**: Control de visibilidad del contenido

## 🧪 Scripts útiles

\`\`\`bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint

# Start production
npm start
\`\`\`

## 📄 Licencia

Este proyecto está desarrollado para uso educativo del centro.