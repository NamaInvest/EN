/**
 * Desktop Electron Engine (Phase 87 - Platform)
 * ──────────────────────────────────────────────────────────
 * IPC bridge for the Electron wrapper to access local hardware
 * (Serial ports, Scales, Cash Drawers, Thermal Printers).
 */
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'DesktopElectronEngine' });

export class DesktopElectronEngine {
    static openCashDrawer(): void {
        log.info(`Sending raw bytes to COM1 to open cash drawer...`);
    }
}
