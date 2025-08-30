import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvisoWithId } from '@/types/avisos';
import { formatDate, formatDueDate, isNew, isOverdue, getExcerpt } from '@/lib/format';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';
import { SubjectBadge } from '@/components/subjects/SubjectBadge';
import { cn } from '@/lib/utils';
import type { Subject } from '@/types/subjects';

interface AvisoCardProps {
  aviso: AvisoWithId;
}

export function AvisoCard({ aviso }: AvisoCardProps) {
  const isTask = aviso.type === 'tarea';
  const hasSubject = aviso.subject;
  const isDue = aviso.dueDate && isOverdue(aviso.dueDate);

  return (
    <Link href={`/${isTask ? 'tareas' : 'avisos'}/${aviso.id}`} className="group">
      <Card className={cn(
        "h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-blue-600 group-focus-visible:ring-offset-2",
        isDue && "border-red-200 bg-red-50/30"
      )}>
        <CardContent className="p-6 h-full flex flex-col">
          {/* Header with badges */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
              {aviso.title}
            </h3>
            <div className="flex flex-col gap-2 items-end">
              {isNew(aviso.createdAt) && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                  Nuevo
                </Badge>
              )}
              {isTask && (
                <Badge variant="outline" className="text-xs flex-shrink-0 border-blue-200 text-blue-700">
                  Tarea
                </Badge>
              )}
            </div>
          </div>
          
          {/* Subject badge */}
{/* Subject badge */}
{aviso.subject ? (
  <div className="mb-3">
    <SubjectBadge subject={aviso.subject} size="sm" />
  </div>
) : null}

          
<p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
  {getExcerpt(aviso.body ?? '')}
</p>

          
          {/* Footer with dates */}
          <div className="flex flex-col gap-2 mt-auto">
            {aviso.dueDate && isTask && (
              <div className={cn(
                "flex items-center text-xs",
                isDue ? "text-red-600" : "text-orange-600"
              )}>
                {isDue ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <Calendar className="h-3 w-3 mr-1" />
                )}
                <span className="font-medium">
                  {formatDueDate(aviso.dueDate)}
                </span>
              </div>
            )}
            
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              <time dateTime={aviso.createdAt.toDate().toISOString()}>
                {formatDate(aviso.createdAt)}
              </time>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}