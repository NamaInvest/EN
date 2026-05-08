import { createTabbySession, getTabbyPaymentStatus } from './bnpl';

// Mock fetch globally
global.fetch = jest.fn();

describe('BNPL Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTabbySession', () => {
    it('should throw an error if tabby keys are missing', async () => {
      await expect(
        createTabbySession({ amount: 100 }, { tabbyKey: '', tabbyMerchant: '' })
      ).rejects.toThrow('مفاتيح تابي غير مدخلة في الإعدادات');
    });

    it('should format phone number and return webUrl on success', async () => {
      const mockResponse = {
        payment: { id: 'tabby_123' },
        configuration: {
          available_products: {
            installments: [{ web_url: 'https://checkout.tabby.ai/test' }]
          }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const keys = { tabbyKey: 'test_key', tabbyMerchant: 'test_merchant' };
      const sessionData = {
        amount: 1000,
        orderId: 'ORD-123',
        phone: '0512345678',
        items: [{ name: 'Item 1', quantity: 1, price: 1000 }],
        customerName: 'Test Customer'
      };

      const result = await createTabbySession(sessionData, keys);

      expect(result.sessionId).toBe('tabby_123');
      expect(result.webUrl).toBe('https://checkout.tabby.ai/test');

      // Verify fetch was called with formatted phone
      const fetchCallArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payloadBody = JSON.parse(fetchCallArgs[1].body);
      expect(payloadBody.payment.buyer.phone).toBe('+966512345678');
    });

    it('should throw an error if API request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid amount' })
      });

      const _keys_dup58 = { tabbyKey: 'test_key', tabbyMerchant: 'test_merchant' };
      await expect(
        // @ts-expect-error [TS2304] Cannot find name
        createTabbySession({ amount: 100, items: [] }, keys)
      ).rejects.toThrow('Invalid amount');
    });
  });

  describe('getTabbyPaymentStatus', () => {
    it('should return status on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'AUTHORIZED' })
      });

      const status = await getTabbyPaymentStatus('tabby_123', { tabbyKey: 'test_key' });
      expect(status).toBe('AUTHORIZED');
    });
  });
});
