import { 

  generateZatcaQRContent, 
  decodeZatcaQR, 
  initializeZatca, 
  generateZatcaQR,
  generateXmlHash
} from './zatca';

describe('ZATCA E-Invoicing Tests', () => {
  describe('Phase 1: TLV Encoding', () => {
    it('should generate a base64 QR code and decode it correctly', () => {
      const testData = {
        sellerName: 'مؤسسة نما التجارية',
        vatNumber: '310122393500003',
        timestamp: '2024-01-01T12:00:00Z',
        totalWithVat: 1150.00,
        vatAmount: 150.00
      };

      const qrBase64 = generateZatcaQRContent(testData);
      expect(qrBase64).toBeDefined();
      expect(typeof qrBase64).toBe('string');

      const decoded = decodeZatcaQR(qrBase64);
      expect(decoded[1]).toBe(testData.sellerName);
      expect(decoded[2]).toBe(testData.vatNumber);
      expect(decoded[3]).toBe(testData.timestamp);
      expect(decoded[4]).toBe('1150.00');
      expect(decoded[5]).toBe('150.00');
    });
  });

  describe('Phase 2: Initialization & Xml Hash', () => {
    it('should throw error if generating QR without initialization', () => {
      // Mock uninitialized state by relying on the internal state check
      expect(() => generateZatcaQR({
        invoiceLines: [],
        issueDate: '2024-01-01',
        issueTime: '12:00:00',
        invoiceUuid: 'uuid-123',
        invoiceNumber: 'INV-123',
        totalWithVat: '1150.00',
        totalVat: '150.00'
      })).toThrow(/not initialized/i);
    });

    it('should generate consistent XML Hash for the same input', () => {
      const xml = '<Invoice><ID>123</ID></Invoice>';
      const hash1 = generateXmlHash(xml);
      const hash2 = generateXmlHash(xml);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe('');
    });
  });
});
