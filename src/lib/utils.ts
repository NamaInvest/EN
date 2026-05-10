import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'utils' });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
