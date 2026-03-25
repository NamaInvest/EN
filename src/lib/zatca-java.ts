import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const execAsync = promisify(exec);

export class ZatcaJavaAdapter {
    private sdkPath: string;
    private workspace: string;
    private javaHome: string;

    constructor() {
        if (os.platform() === 'win32') {
            // Hardcoded SDK path per user's desktop environment requirement
            this.sdkPath = 'C:\\Users\\1\\Desktop\\zatca-einvoicing-sdk-Java-238-R3.4.8\\Apps\\fatoora.bat';
            this.javaHome = 'C:\\Users\\1\\Desktop\\Java\\jdk-21.0.6+7';
        } else {
            // Hetzner Production Cluster (Ubuntu 24.04) Paths
            this.sdkPath = '/opt/zatca-einvoicing-sdk-238-R3.4.8/Apps/fatoora';
            this.javaHome = '/usr/lib/jvm/java-21-openjdk-amd64';
        }
        
        this.workspace = path.join(os.tmpdir(), 'zatca-workspace');
    }

    private async initWorkspace() {
        try {
            await fs.mkdir(this.workspace, { recursive: true });
        } catch (e) {}
    }

    /**
     * Executes the Fatoora SDK CLI with the proper Java 21 environment variables.
     */
    private async executeFatoora(args: string): Promise<{ stdout: string; stderr: string }> {
        // Ensure Java 21 is injected into the child process environment
        const pathSeparator = os.platform() === 'win32' ? ';' : ':';
        const binPath = os.platform() === 'win32' ? `${this.javaHome}\\bin` : `${this.javaHome}/bin`;
        
        const env = { 
            ...process.env, 
            JAVA_HOME: this.javaHome, 
            PATH: `${binPath}${pathSeparator}${process.env.PATH}` 
        };

        const command = `"${this.sdkPath}" ${args}`;
        return execAsync(command, { env });
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
csr.organization.unit.name=${config.branchName || 'Nama Soft'}
csr.organization.name=${config.companyName}
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=${config.street || 'Riyadh'}
csr.industry.business.category=${config.businessCategory || 'IT'}
`.trim();

        // The Properties must be written sequentially and ZATCA SDK will generate them at Data/Certificates/
        const dataCertsDir = path.join(path.dirname(this.sdkPath), '..', 'Data', 'Certificates');
        const csrFile = path.join(dataCertsDir, 'cert.pem');
        const privKeyFile = path.join(dataCertsDir, 'ec-secp256k1-priv-key.pem');

        try {
            await fs.unlink(csrFile).catch(() => {});
            await fs.unlink(privKeyFile).catch(() => {});
        } catch(e) {}

        await fs.writeFile(configPath, properties, 'utf8');

        // Execute CSR Generation
        // Must run with CWD inside Apps to prevent ZATCA SDK relative path crash
        const command = os.platform() === 'win32' ? `fatoora.bat -csr -csrConfig "${configPath}"` : `./fatoora -csr -csrConfig "${configPath}"`;
        const pathSeparator = os.platform() === 'win32' ? ';' : ':';
        const binPath = os.platform() === 'win32' ? `${this.javaHome}\\bin` : `${this.javaHome}/bin`;

        const env = { 
            ...process.env, 
            JAVA_HOME: this.javaHome, 
            PATH: `${binPath}${pathSeparator}${process.env.PATH}` 
        };

        try {
            await execAsync(command, { env, cwd: path.dirname(this.sdkPath) });
            
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
        const dataCertsDir = path.join(path.dirname(this.sdkPath), '..', 'Data', 'Certificates');
        
        // Wrap keys in PEM standard headers as required by Java OpenSSL readers
        const pemCert = `-----BEGIN CERTIFICATE-----\n${certificateBase64}\n-----END CERTIFICATE-----`;
        const pemPk = `-----BEGIN EC PRIVATE KEY-----\n${privateKeyBase64}\n-----END EC PRIVATE KEY-----`;

        try {
            // Write payload and inject Tenant cryptographic material into SDK directory
            await fs.writeFile(invoicePath, xmlContent, 'utf8');
            await fs.writeFile(path.join(dataCertsDir, 'cert.pem'), pemCert, 'utf8');
            await fs.writeFile(path.join(dataCertsDir, 'ec-secp256k1-priv-key.pem'), pemPk, 'utf8');

            const pathSeparator = os.platform() === 'win32' ? ';' : ':';
            const binPath = os.platform() === 'win32' ? `${this.javaHome}\\bin` : `${this.javaHome}/bin`;
            const env = { ...process.env, JAVA_HOME: this.javaHome, PATH: `${binPath}${pathSeparator}${process.env.PATH}` };
            
            const exeName = os.platform() === 'win32' ? 'fatoora.bat' : './fatoora';

            // Generate Hash First
            const hashCmd = `${exeName} -generateHash -invoice "${invoicePath}"`;
            const hashResult = await execAsync(hashCmd, { env, cwd: path.dirname(this.sdkPath) });
            
            // Extract Hash from CLI stdout
            // Usually prints: INVOICE HASH = <hash> 
            const hashMatch = hashResult.stdout.match(/([a-zA-Z0-9+/=]{43,45})/);
            const hash = hashMatch ? hashMatch[1] : '';

            // Sign XML
            const signCmd = `${exeName} -sign -invoice "${invoicePath}"`;
            const signResult = await execAsync(signCmd, { env, cwd: path.dirname(this.sdkPath) });

            // Fatoora creates signed file at invoice_signed.xml typically in same directory
            const signedInvoicePath = invoicePath.replace('.xml', '_signed.xml');
            const signedXml = await fs.readFile(signedInvoicePath, 'utf8');
            
            // Extract QR code generated by SDK
            const qrCmd = `${exeName} -generateQr -invoice "${signedInvoicePath}"`;
            const qrResult = await execAsync(qrCmd, { env, cwd: path.dirname(this.sdkPath) }).catch(() => ({ stdout: '' }));
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
            await fs.writeFile(invoicePath, xmlContent, 'utf8');
            const pathSeparator = os.platform() === 'win32' ? ';' : ':';
            const binPath = os.platform() === 'win32' ? `${this.javaHome}\\bin` : `${this.javaHome}/bin`;
            const env = { ...process.env, JAVA_HOME: this.javaHome, PATH: `${binPath}${pathSeparator}${process.env.PATH}` };
            
            const exeName = os.platform() === 'win32' ? 'fatoora.bat' : './fatoora';
            const validateCmd = `${exeName} -validate -invoice "${invoicePath}"`;
            const result = await execAsync(validateCmd, { env, cwd: path.dirname(this.sdkPath) });
            
            return {
                isValid: result.stdout.includes('VALID') || !result.stdout.includes('ERROR'),
                messages: result.stdout.split('\\n').filter(l => l.includes('ERROR') || l.includes('WARNING'))
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
