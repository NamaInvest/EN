import qz from 'qz-tray';

export interface QZPrinterConfig {
    name: string;
    type: 'os' | 'ip' | 'usb';
    ipAddress?: string;
    targetCategories?: number[];
}

let isQzConnected = false;

export async function connectQZ() {
    if (isQzConnected) return true;
    try {
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect({ retries: 2, delay: 1 });
            isQzConnected = true;
        }
        return true;
    } catch (e) {
        console.error("QZ Tray connection failed:", e);
        return false;
    }
}

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

export async function getLocalPrinters() {
    if (!await connectQZ()) return [];
    return await qz.printers.find();
}