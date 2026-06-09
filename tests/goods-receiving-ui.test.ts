import { describe, it, expect } from '@jest/globals';

// ─── Map PO to GRN default values helper ─────────────────────────────────────
interface PoItem {
  productId: number;
  productName?: string;
  product?: { name: string };
  quantity: number;
}

interface PoData {
  id: number;
  orderNo: number;
  supplierId: number;
  details: PoItem[];
}

function mapPoToGrnValues(po: PoData) {
  if (!po) return null;
  return {
    supplierId: po.supplierId.toString(),
    orderId: po.id.toString(),
    stockId: '1',
    notes: `مستند استلام البضائع لأمر الشراء #${po.orderNo}`,
    items: (po.details || []).map((item) => ({
      productId: item.productId.toString(),
      productName: item.productName || item.product?.name || '',
      quantity: Number(item.quantity) || 0,
      acceptedQty: Number(item.quantity) || 0,
      rejectedQty: 0,
      batchNumber: '',
      productionDate: '',
      expiryDate: ''
    }))
  };
}

// ─── Validate GRN quantities helper ──────────────────────────────────────────
interface GrnItemInput {
  productId: string;
  quantity: number;
  acceptedQty: number;
  rejectedQty: number;
}

function validateGrnQuantities(items: GrnItemInput[]): { valid: boolean; error?: string } {
  for (const item of items) {
    if (item.acceptedQty < 0 || item.rejectedQty < 0) {
      return { valid: false, error: 'الكميات يجب أن تكون موجبة' };
    }
    const totalInput = item.acceptedQty + item.rejectedQty;
    if (totalInput > item.quantity) {
      return { 
        valid: false, 
        error: `الكمية المدخلة (${totalInput}) تتجاوز الكمية المطلوبة بأمر الشراء (${item.quantity})` 
      };
    }
  }
  return { valid: true };
}

// ─── Validate GRN metadata helper ────────────────────────────────────────────
interface GrnFormValues {
  supplierId: string;
  stockId?: string | null;
  items: { productId: string }[];
}

function validateGrnMetadata(data: GrnFormValues): { valid: boolean; error?: string } {
  if (!data.supplierId) {
    return { valid: false, error: 'المورد مطلوب' };
  }
  if (!data.stockId) {
    return { valid: false, error: 'المستودع مطلوب' };
  }
  if (!data.items || data.items.length === 0) {
    return { valid: false, error: 'يجب إضافة بند واحد على الأقل' };
  }
  if (data.items.some(item => !item.productId)) {
    return { valid: false, error: 'يجب تحديد الصنف لجميع البنود' };
  }
  return { valid: true };
}

// ─── RBAC permissions check ──────────────────────────────────────────────────
interface UserPerm {
  module: string;
  canAdd?: boolean;
}

function canPerformGrnAction(action: 'view' | 'create' | 'qc', user: { role: string; permissions?: UserPerm[] }): boolean {
  const isAdmin = ['admin', 'owner', 'CFO'].includes(user.role);
  if (isAdmin) return true;

  if (!user.permissions) return false;

  // Check any of the unified keys: purchase_grn, grn, purchases
  const perm = user.permissions.find(p => ['purchase_grn', 'grn', 'purchases'].includes(p.module));
  if (!perm) return false;

  if (action === 'create') {
    return !!perm.canAdd;
  }
  return true;
}

// ─── TEST SUITE ───────────────────────────────────────────────────────────────
describe('Goods Receipt Note (GRN) UI Helpers & Validation Guards', () => {

  describe('mapPoToGrnValues()', () => {
    it('should pre-populate supplier, PO, notes, and items from PO data', () => {
      const mockPo: PoData = {
        id: 12,
        orderNo: 1005,
        supplierId: 44,
        details: [
          { productId: 201, productName: 'Sleek Laptop', quantity: 15 }
        ]
      };

      const result = mapPoToGrnValues(mockPo);

      expect(result).toEqual({
        supplierId: '44',
        orderId: '12',
        stockId: '1',
        notes: 'مستند استلام البضائع لأمر الشراء #1005',
        items: [
          {
            productId: '201',
            productName: 'Sleek Laptop',
            quantity: 15,
            acceptedQty: 15,
            rejectedQty: 0,
            batchNumber: '',
            productionDate: '',
            expiryDate: ''
          }
        ]
      });
    });

    it('should safely return null if PO data is empty', () => {
      expect(mapPoToGrnValues(null as any)).toBeNull();
    });
  });

  describe('validateGrnQuantities() quantity checks', () => {
    it('should validate successfully when accepted + rejected matches quantity', () => {
      const items = [
        { productId: '1', quantity: 10, acceptedQty: 8, rejectedQty: 2 }
      ];
      const result = validateGrnQuantities(items);
      expect(result.valid).toBe(true);
    });

    it('should reject when total accepted and rejected exceeds PO quantity', () => {
      const items = [
        { productId: '1', quantity: 10, acceptedQty: 9, rejectedQty: 2 }
      ];
      const result = validateGrnQuantities(items);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('تتجاوز الكمية المطلوبة بأمر الشراء');
    });

    it('should reject when quantity is negative', () => {
      const items = [
        { productId: '1', quantity: 10, acceptedQty: -1, rejectedQty: 2 }
      ];
      const result = validateGrnQuantities(items);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('الكميات يجب أن تكون موجبة');
    });
  });

  describe('validateGrnMetadata() structure checks', () => {
    it('should validate successfully when all metadata is complete', () => {
      const data = {
        supplierId: '44',
        stockId: '1',
        items: [{ productId: '101' }]
      };
      const result = validateGrnMetadata(data);
      expect(result.valid).toBe(true);
    });

    it('should reject when supplierId is missing', () => {
      const data = {
        supplierId: '',
        stockId: '1',
        items: [{ productId: '101' }]
      };
      const result = validateGrnMetadata(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('المورد مطلوب');
    });

    it('should reject when stockId is missing', () => {
      const data = {
        supplierId: '44',
        stockId: '',
        items: [{ productId: '101' }]
      };
      const result = validateGrnMetadata(data as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('المستودع مطلوب');
    });

    it('should reject when items list is empty', () => {
      const data = {
        supplierId: '44',
        stockId: '1',
        items: []
      };
      const result = validateGrnMetadata(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('يجب إضافة بند واحد على الأقل');
    });

    it('should reject when any item is missing productId', () => {
      const data = {
        supplierId: '44',
        stockId: '1',
        items: [{ productId: '' }]
      };
      const result = validateGrnMetadata(data);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('يجب تحديد الصنف لجميع البنود');
    });
  });

  describe('canPerformGrnAction() RBAC gates', () => {
    it('should allow admin/owner to perform all actions', () => {
      expect(canPerformGrnAction('create', { role: 'admin' })).toBe(true);
      expect(canPerformGrnAction('qc', { role: 'owner' })).toBe(true);
    });

    it('should check permissions properly for standard users with unified keys', () => {
      const standardUser = {
        role: 'user',
        permissions: [{ module: 'grn', canAdd: true }]
      };
      expect(canPerformGrnAction('create', standardUser)).toBe(true);
    });

    it('should deny when standard user lacks explicit module permission', () => {
      const standardUser = {
        role: 'user',
        permissions: [{ module: 'sales', canAdd: true }]
      };
      expect(canPerformGrnAction('create', standardUser)).toBe(false);
    });
  });
});
