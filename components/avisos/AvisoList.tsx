import { AvisoWithId } from '@/types/avisos';
import { AvisoCard } from './AvisoCard';

interface AvisoListProps {
  avisos: AvisoWithId[];
  className?: string;
}

export function AvisoList({ avisos, className = '' }: AvisoListProps) {
  if (avisos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay avisos publicados todavía
        </h3>
        <p className="text-gray-600 text-sm">
          Los avisos aparecerán aquí cuando estén disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {avisos.map((aviso) => (
        <AvisoCard key={aviso.id} aviso={aviso} />
      ))}
    </div>
  );
}