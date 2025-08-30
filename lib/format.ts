import { Timestamp } from 'firebase/firestore';

export function formatDate(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDueDate(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Vencida';
  } else if (diffDays === 0) {
    return 'Vence hoy';
  } else if (diffDays === 1) {
    return 'Vence mañana';
  } else if (diffDays <= 7) {
    return `Vence en ${diffDays} días`;
  } else {
    return `Vence el ${formatDate(timestamp)}`;
  }
}
export function isNew(timestamp: Timestamp): boolean {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return timestamp.toDate() > sevenDaysAgo;
}

export function isOverdue(timestamp: Timestamp): boolean {
  const now = new Date();
  return timestamp.toDate() < now;
}
// lib/format.ts
export function getExcerpt(body?: string, maxLength: number = 140): string {
  const text = (body ?? '').toString();   // <- nunca será undefined
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '…';
}
