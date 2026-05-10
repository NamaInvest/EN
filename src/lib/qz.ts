/**
 * @fileoverview QZ Tray print bridge utilities
 *
 * Provides a thin wrapper over the `qz-tray` WebSocket client for
 * communicating with local thermal/receipt printers in the POS module.
 *
 * QZ Tray must be installed and running on the client machine.
 * Connection is established lazily on first print job and reused.
 *
 * Supported print modes:
 * - **HTML** — Full HTML receipt rendered via browser print engine
 * - **Raw ESC/POS** — Direct thermal printer command sequences
 *
 * @see https://qz.io/wiki/
 * @module lib/qz
 */

// @ts-ignore
import qz from 'qz-tray';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'qz' });

/**
 * Printer configuration for QZ Tray print jobs.
 * Supports OS-managed printers, IP/network printers, and USB printers.
 */
export interface QZPrinterConfig {
    /** Printer name as shown in OS print queue, or `'tcp://IP:PORT'` for IP printers */
    name: string;
    /** Connection type: OS queue, IP/network socket, or USB direct */
    type: 'os' | 'ip' | 'usb';
    /** IP address for network printers (required when `type === 'ip'`) */
    ipAddress?: string;
    /** Optional category IDs this printer handles (e.g. kitchen, bar) */
    targetCategories?: number[];
}

let isQzConnected = false;

/**
 * Establishes a WebSocket connection to the local QZ Tray service.
 *
 * Connection is cached — subsequent calls return `true` immediately
 * without reconnecting.
 *
 * @returns `true` if connected successfully, `false` on connection failure
 */
export async function connectQZ() {
    if (isQzConnected) return true;
    try {
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect({ retries: 2, delay: 1 });
            isQzConnected = true;
        }
        return true;
    } catch (e: any) {
        log.error("QZ Tray connection failed:", e);
        return false;
    }
}

/**
 * Prints an HTML receipt to the specified printer via QZ Tray.
 *
 * The HTML is rendered by the browser's print engine, so CSS styling is supported.
 * Best for A4 or letter-size receipts with rich formatting.
 *
 * @param printerName - OS printer name (must match exactly as shown in system printers)
 * @param htmlHtml - Full HTML string to print
 * @throws Error if QZ Tray is not running or connection fails
 */
export async function printReceiptHTML(printerName: string, htmlHtml: string) {
    if (!await connectQZ()) throw new Error("فشل الاتصال ببرنامج الطباعة QZ Tray");
    
    const config = qz.configs.create(printerName);
    const data = [{
        type: 'html',
        format: 'plain',
        data: htmlHtml
    }];
    
    return qz.print(config, data);
}

/**
 * Sends raw ESC/POS commands to a thermal receipt printer via QZ Tray.
 *
 * Supports both OS-managed and IP/network printers.
 * IP printers connect via TCP socket on port 9100.
 *
 * @param printerConfig - Printer configuration (name, type, IP if applicable)
 * @param escposData - Array of ESC/POS command strings to send sequentially
 * @throws Error if QZ Tray is not running or connection fails
 *
 * @example
 * ```ts
 * await printRawESCPOS(
 *   { name: 'EPSON-T88', type: 'os' },
 *   ['\x1B\x40', 'Hello World\n', '\x1D\x56\x41'] // init, text, cut
 * );
 * ```
 */
export async function printRawESCPOS(printerConfig: QZPrinterConfig, escposData: string[]) {
    if (!await connectQZ()) throw new Error("فشل الاتصال ببرنامج الطباعة QZ Tray");
    
    let config;
    if (printerConfig.type === 'ip') {
        config = qz.configs.create(`tcp://${printerConfig.ipAddress}:9100`);
    } else {
        config = qz.configs.create(printerConfig.name);
    }

    const data = escposData.map(cmd => ({
        type: 'raw',
        format: 'command',
        flavor: 'escpos',
        data: cmd
    }));

    return qz.print(config, data);
}

/**
 * Returns a list of all printers available on the local machine via QZ Tray.
 *
 * @returns Array of printer name strings, or empty array if QZ Tray unavailable
 */
export async function getLocalPrinters() {
    if (!await connectQZ()) return [];
    return await qz.printers.find();
}
