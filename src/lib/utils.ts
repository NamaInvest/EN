import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.utils.ts' });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
