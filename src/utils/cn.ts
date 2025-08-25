import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS de forma condicional e resolve conflitos do Tailwind
 * @param inputs - Classes CSS ou condições
 * @returns String de classes CSS otimizada
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}