import { Badge } from '@/components/ui/badge';
import { Subject } from '@/types/subjects';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface SubjectBadgeProps {
  subject: Subject;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function SubjectBadge({ 
  subject, 
  size = 'md', 
  showIcon = true, 
  className 
}: SubjectBadgeProps) {
  const IconComponent = Icons[subject.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        'inline-flex items-center gap-1.5 font-medium text-white border-0',
        subject.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && IconComponent && (
        <IconComponent className={iconSizes[size]} />
      )}
      {subject.name}
    </Badge>
  );
}