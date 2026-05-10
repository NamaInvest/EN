import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ZATCA-Java' });
const execAsync = promisify(exec);

export class ZatcaJavaAdapter {
    private sdkPath: string;   // path to fatoora executable (inside Apps/)
    private sdkRoot: string;   // SDK root directory (parent of Apps/)
    private workspace: string;
    private javaHome: string;

    constructor() {
        if (os.platform() === 'win32') {
            // SDK bundled inside the app (electron/zatca-sdk/)
            // Try bundled path first, fallback to desktop path
            const bundledSdk = path.join(process.cwd(), 'electron', 'zatca-sdk', 'Apps', 'fatoora.bat');
            const desktopSdk = 'C:\\Users\\1\\Desktop\\zatca-einvoicing-sdk-238-R4.0.0\\Apps\\fatoora.bat';
            this.sdkPath = require('fs').existsSync(bundledSdk) ? bundledSdk : desktopSdk;
            this.javaHome = 'C:\\Users\\1\\Desktop\\Java\\jdk-21.0.6+7';
        } else {
            // Hetzner Production Cluster (Ubuntu 24.04) â€” SDK R4.0.0
            this.sdkPath = '/opt/zatca-einvoicing-sdk-238-R4.0.0/Apps/fatoora';
            this.javaHome = '/opt/amazon-corretto-21.0.11.10.1-linux-x64';
        }
        
        // SDK root = parent of Apps/ â€” required for config.json resolution
        this.sdkRoot = path.resolve(path.dirname(this.sdkPath), '..');
        this.workspace = path.join(os.tmpdir(), 'zatca-workspace');
    }

    private async initWorkspace() {
        try {
            await fs.mkdir(this.workspace, { recursive: true });
        } catch (e: any) {}
    }

    /** Build environment variables for the SDK child process */
    private getEnv() {
        const pathSeparator = os.platform() === 'win32' ? ';' : ':';
        const binPath = os.platform() === 'win32' ? `${this.javaHome}\\bin` : `${this.javaHome}/bin`;
        const configPath = path.join(this.sdkRoot, 'Configuration', 'config.json');
        return {
            ...process.env,
            JAVA_HOME: this.javaHome,
            FATOORA_HOME: path.dirname(this.sdkPath),
            SDK_CONFIG: configPath,
            PATH: `${binPath}${pathSeparator}${process.env.PATH}`
        };
    }

    /** Get the fatoora executable name */
    private getExeName() {
        return os.platform() === 'win32' ? 'fatoora.bat' : './fatoora';
    }

    /**
     * Executes the Fatoora SDK CLI with the proper Java 21 environment variables.
     * CWD is set to Apps/ directory where fatoora lives.
     */
    private async executeFatoora(args: string): Promise<{ stdout: string; stderr: string }> {
        const command = `"${this.sdkPath}" ${args}`;
        return execAsync(command, { env: this.getEnv(), cwd: path.dirname(this.sdkPath) });
    }

    /**
     * Generates a structural CSR and ECDSA Private Key using the official ZATCA Java SDK.
     */
    public async generateCsr(config: {
        companyName: string;
        taxNumber: string;
        branchName?: string;
        businessCategory?: string;
        uuid?: string;
        city?: string;
        district?: string;
        street?: string;
    }): Promise<{ csr: string; privateKey: string }> {
        await this.initWorkspace();

        const timestamp = Date.now();
        const configPath = path.join(this.workspace, `csr-config-${timestamp}.properties`);
        
        // ZATCA V238 Standard Properties Map
        const properties = `
csr.common.name=${config.taxNumber}
csr.serial.number=1-${config.companyName}|2-${config.branchName || 'Branch'}|3-${config.uuid || '1234567890'}
csr.organization.identifier=${config.taxNumber}
csr.organization.unit.name=${config.branchName || 'namainvist'}
csr.organization.name=${config.companyName}
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=${config.street || 'Riyadh'}
csr.industry.business.category=${config.businessCategory || 'IT'}
`.trim();

        // The Properties must be written sequentially and ZATCA SDK will generate them at Data/Certificates/
        const dataCertsDir = path.join(this.sdkRoot, 'Data', 'Certificates');
        const csrFile = path.join(dataCertsDir, 'cert.pem');
        const privKeyFile = path.join(dataCertsDir, 'ec-secp256k1-priv-key.pem');

        try {
            await fs.unlink(csrFile).catch(() => {});
            await fs.unlink(privKeyFile).catch(() => {});
        } catch(e) {}

        await fs.writeFile(configPath, properties, 'utf8');

        const command = os.platform() === 'win32' ? `fatoora.bat -csr -csrConfig "${configPath}"` : `./fatoora -csr -csrConfig "${configPath}"`;

        try {
            await execAsync(command, { env: this.getEnv(), cwd: path.dirname(this.sdkPath) });
            
            const csrBuffer = await fs.readFile(csrFile);
            const pkBuffer = await fs.readFile(privKeyFile);

            // Strip PEM headers to return clean base64
            const csrBase64 = csrBuffer.toString('utf8').replace(/-----[^-]+-----/g, '').replace(/\r?\n/g, '').trim();
            const pkBase64 = pkBuffer.toString('utf8').replace(/-----[^-]+-----/g, '').replace(/\r?\n/g, '').trim();

            return { csr: csrBase64, privateKey: pkBase64 };
        } finally {
            await fs.unlink(configPath).catch(() => {});
        }
    }

    /**
     * Signs a raw structural UBL 2.1 XML Invoice using the SDK CLI.
     */
    public async signInvoice(xmlContent: string, certificateBase64: string, privateKeyBase64: string, previousHash: string = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ=='): Promise<{ signedXml: string, hash: string, qr: string }> {
        const timestamp = Date.now();
        const invoicePath = path.join(this.workspace, `invoice-${timestamp}.xml`);
        const dataCertsDir = path.join(this.sdkRoot, 'Data', 'Certificates');
        
        // SDK R4.0.0 requires raw base64 WITHOUT PEM headers for both cert and key
        const pemCert = certificateBase64;
        const pemPk = privateKeyBase64;

        try {
            await this.initWorkspace();
            
            // Write payload and inject Tenant cryptographic material into SDK directory
            await fs.writeFile(invoicePath, xmlContent, 'utf8');
            await fs.writeFile(path.join(dataCertsDir, 'cert.pem'), pemCert, 'utf8');
            await fs.writeFile(path.join(dataCertsDir, 'ec-secp256k1-priv-key.pem'), pemPk, 'utf8');

            const env = this.getEnv();
            const exeName = this.getExeName();
            const cwd = path.dirname(this.sdkPath);

            // Generate Hash First
            const hashCmd = `${exeName} -generateHash -invoice "${invoicePath}"`;
            const hashResult = await execAsync(hashCmd, { env, cwd });
            log.debug('[ZATCA-SDK] Hash stdout', { stdout: hashResult.stdout.substring(0, 200) });
            if (hashResult.stderr) log.warn('[ZATCA-SDK] Hash stderr', { stderr: hashResult.stderr.substring(0, 300) });
            
            // Extract Hash from CLI stdout
            const hashMatch = hashResult.stdout.match(/([a-zA-Z0-9+/=]{43,45})/);
            const hash = hashMatch ? hashMatch[1] : '';

            // Sign XML
            const signCmd = `${exeName} -sign -invoice "${invoicePath}"`;
            const signResult = await execAsync(signCmd, { env, cwd });
            log.debug('[ZATCA-SDK] Sign stdout', { stdout: signResult.stdout.substring(0, 300) });
            if (signResult.stderr) log.warn('[ZATCA-SDK] Sign stderr', { stderr: signResult.stderr.substring(0, 300) });

            // Fatoora creates signed file at invoice_signed.xml typically in same directory
            const signedInvoicePath = invoicePath.replace('.xml', '_signed.xml');
            const signedXml = await fs.readFile(signedInvoicePath, 'utf8');
            
            // Extract QR code generated by SDK
            const qrCmd = `${exeName} -generateQr -invoice "${signedInvoicePath}"`;
            const qrResult = await execAsync(qrCmd, { env, cwd }).catch(() => ({ stdout: '' }));
            const qrMatch = qrResult.stdout.match(/([a-zA-Z0-9+/=]{100,})/);
            const qr = qrMatch ? qrMatch[1] : '';

            return { signedXml, hash, qr };
        } finally {
            await fs.unlink(invoicePath).catch(() => {});
            await fs.unlink(invoicePath.replace('.xml', '_signed.xml')).catch(() => {});
        }
    }

    /**
     * Validates an API payload against ZATCA Core compliance rules using the SDK validator.
     */
    public async validateInvoice(xmlContent: string): Promise<{ isValid: boolean; messages: string[] }> {
        const timestamp = Date.now();
        const invoicePath = path.join(this.workspace, `validate-${timestamp}.xml`);
        try {
            await this.initWorkspace();
            await fs.writeFile(invoicePath, xmlContent, 'utf8');
            const env = this.getEnv();
            const exeName = this.getExeName();
            const cwd = path.dirname(this.sdkPath);
            
            const validateCmd = `${exeName} -validate -invoice "${invoicePath}"`;
            const result = await execAsync(validateCmd, { env, cwd });
            
            return {
                isValid: result.stdout.includes('VALID') || !result.stdout.includes('ERROR'),
                messages: result.stdout.split('\n').filter(l => l.includes('ERROR') || l.includes('WARNING'))
            };
        } catch (e: any) {
            return {
                isValid: false,
                messages: [e.message || e.stdout?.toString()]
            };
        } finally {
            await fs.unlink(invoicePath).catch(() => {});
        }
    }
}

