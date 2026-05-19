import { QzTrayStatus } from './types';

export async function detectQzTray(): Promise<boolean> {
  return true; // Placeholder
}

export async function getQzTrayStatus(): Promise<QzTrayStatus> {
  const installed = await detectQzTray();
  return { installed, running: installed, version: '2.2.2' };
}

export async function installQzTrayPlaceholder(): Promise<void> {
  console.log("QZ Tray install triggered, but skipped (Placeholder).");
}
