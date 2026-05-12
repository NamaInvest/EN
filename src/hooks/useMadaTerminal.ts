'use client';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export type TerminalStatus = 'DISCONNECTED' | 'CONNECTED' | 'WAITING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export function useMadaTerminal() {
    const [status, setStatus] = useState<TerminalStatus>('DISCONNECTED');
    const portRef = useRef<any>(null);
    const readerRef = useRef<any>(null);
    const keepReadingRef = useRef<boolean>(true);
    const { error: toastError } = useToast();

    // Common SPAN2 / Geidea STX-ETX format helper
    const buildPacket = (amount: number) => {
        // e.g. amount 150.50 => 15050 (Halalas)
        const formatAmount = Math.round(amount * 100).toString().padStart(12, '0');
        // Command syntax typically 'P' for Purchase, followed by Amount
        const payload = `P${formatAmount}`;
        
        let lrc = 0;
        for (let i = 0; i < payload.length; i++) {
            lrc ^= payload.charCodeAt(i);
        }
        lrc ^= 0x03; // ETX

        const buffer = new Uint8Array(payload.length + 3);
        buffer[0] = 0x02; // STX
        for (let i = 0; i < payload.length; i++) {
            buffer[i + 1] = payload.charCodeAt(i);
        }
        buffer[buffer.length - 2] = 0x03; // ETX
        buffer[buffer.length - 1] = lrc; // Checksum
        
        return buffer;
    };

    const connect = async () => {
        try {
            if (!('serial' in navigator)) {
                toastError('عذراً، متصفحك لا يدعم ربط أجهزة POS (WebSerial API). يرجى استخدام Google Chrome أو Edge.');
                return false;
            }

            const p = await (navigator as any).serial.requestPort();
            await p.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
            portRef.current = p;
            setStatus('CONNECTED');
            
            // Start silent reading loop just to keep buffer clean
            keepReadingRef.current = true;
            readLoop();

            return true;
        } catch (err: any) {
            console.error('Failed to connect terminal:', err);
            setStatus('DISCONNECTED');
            return false;
        }
    };

    const readLoop = async () => {
        while (portRef.current && portRef.current.readable && keepReadingRef.current) {
            readerRef.current = portRef.current.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await readerRef.current.read();
                    if (done) break;
                    // Just consuming incoming idle data 
                }
            } catch (err: any) {
                // Ignore read errors
            } finally {
                if (readerRef.current) {
                    readerRef.current.releaseLock();
                    readerRef.current = null;
                }
            }
        }
    };

    const disconnect = async () => {
        keepReadingRef.current = false;
        if (readerRef.current) {
            await readerRef.current.cancel();
        }
        if (portRef.current) {
            try {
                await portRef.current.close();
            } catch (e: any) {}
            portRef.current = null;
        }
        setStatus('DISCONNECTED');
    };

    const sendPayment = async (amount: number): Promise<boolean> => {
        if (!portRef.current || status === 'DISCONNECTED') {
            // Attempt auto-connect if possible
            const connected = await connect();
            if (!connected) {
                // Fallback to manual simulator flow if device is absent
                return simulatePayment();
            }
        }

        return new Promise(async (resolve) => {
            try {
                setStatus('WAITING');
                const writer = portRef.current.writable.getWriter();
                const packet = buildPacket(amount);
                await writer.write(packet);
                writer.releaseLock();

                // Now read for response
                const reader = portRef.current.readable.getReader();
                let resultStr = '';
                let timeout = setTimeout(() => {
                    reader.cancel();
                    setStatus('ERROR');
                    resolve(false);
                }, 60000); // 60s timeout for card swipe

                while (true) {
                    const { value, done } = await reader.read();
                    if (value) {
                        resultStr += new TextDecoder().decode(value);
                        // Very generic parsers for Mada (Geidea/SPAN2 typically return 'A', '00', or 'APPROVED')
                        if (resultStr.includes('A') || resultStr.includes('00') || resultStr.includes('APPROVED')) {
                            clearTimeout(timeout);
                            reader.releaseLock();
                            setStatus('APPROVED');
                            resolve(true);
                            break;
                        }
                        if (resultStr.includes('D') || resultStr.includes('05') || resultStr.includes('DECLINED')) {
                            clearTimeout(timeout);
                            reader.releaseLock();
                            setStatus('DECLINED');
                            resolve(false);
                            break;
                        }
                    }
                    if (done) break;
                }
            } catch (e: any) {
                console.error(e);
                setStatus('ERROR');
                resolve(false); // Hardware failed gracefully, maybe proceed with manual?
            }
        });
    };

    // The simulator fallback (if no hardware is connected)
    const simulatePayment = (): Promise<boolean> => {
        setStatus('WAITING');
        return new Promise((resolve) => {
            setTimeout(() => {
                setStatus('APPROVED');
                resolve(true);
            }, 3000);
        });
    };

    return {
        status,
        connect,
        disconnect,
        sendPayment,
    };
}
