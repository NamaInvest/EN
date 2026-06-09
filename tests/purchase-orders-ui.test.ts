// Global test definitions are used for compatibility with both Jest and Vitest

// ─── Normalization Helper under test ───────────────────────────────────────────
function normalizeCreatePayload(formData: {
  supplierId: string;
  branchId: string;
  notes?: string;
  items: { productId: string; quantity: number; price: number }[];
}) {
  const supplierId = parseInt(formData.supplierId, 10);
  const branchId = parseInt(formData.branchId, 10);

  const normalizedItems = (formData.items || []).map((item) => {
    const pId = parseInt(item.productId, 10);
    return {
      productId: isNaN(pId) ? 1 : pId,
      quantity: Number(item.quantity) || 1,
      unitCost: Number(item.price) || 0,
      taxRate: 15,
    };
  });

  return {
    supplierId: isNaN(supplierId) ? undefined : supplierId,
    branchId: isNaN(branchId) ? undefined : branchId,
    date: new Date().toISOString().split('T')[0],
    items: normalizedItems,
    notes: formData.notes || '',
    requireApproval: true,
  };
}

// ─── Response Parser under test ───────────────────────────────────────────────
function parseOrdersResponse(json: any): { orders: any[]; total: number } {
  if (!json) return { orders: [], total: 0 };

  const orders = Array.isArray(json) ? json : (json.data || []);
  const total = typeof json.total === 'number' ? json.total : orders.length;

  return { orders, total };
}

// ─── Status/Permission Guards under test ────────────────────────────────────────
function canPerformAction(action: string, status: string, user: { role: string; permissions?: any[] }): boolean {
  const isAdmin = user.role === 'admin' || user.role === 'owner' || user.role === 'CFO';

  // Check explicit permission
  let hasPurchasesPermission = false;
  if (isAdmin) {
    hasPurchasesPermission = true;
  } else if (user.permissions) {
    const p = user.permissions.find((perm) => perm.module === 'purchase_orders');
    if (p && p.canEdit) {
      hasPurchasesPermission = true;
    }
  }

  if (!hasPurchasesPermission) return false;

  if (action === 'edit') {
    return ['pending', 'draft'].includes(status);
  }

  if (action === 'approve' || action === 'reject') {
    return status === 'pending';
  }

  if (action === 'complete') {
    return status === 'approved';
  }

  return true;
}

// ─── TEST SUITE ───────────────────────────────────────────────────────────────
describe('Purchase Orders UI Helpers & Normalization Contracts', () => {

  describe('normalizeCreatePayload()', () => {
    it('should correctly normalize strings to numeric IDs and prices to unitCosts', () => {
      const mockFormData = {
        supplierId: '42',
        branchId: '3',
        notes: 'Urgent delivery request',
        items: [
          { productId: '101', quantity: 5.5, price: 150.75 }
        ]
      };

      const payload = normalizeCreatePayload(mockFormData);

      expect(payload.supplierId).toBe(42);
      expect(payload.branchId).toBe(3);
      expect(payload.notes).toBe('Urgent delivery request');
      expect(payload.requireApproval).toBe(true);
      expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0]).toEqual({
        productId: 101,
        quantity: 5.5,
        unitCost: 150.75,
        taxRate: 15
      });
    });

    it('should fall back to safe defaults if inputs are invalid or missing', () => {
      const mockFormData = {
        supplierId: 'invalid-id',
        branchId: 'invalid-id',
        items: [
          { productId: 'not-a-number', quantity: 0, price: -5 }
        ]
      };

      const payload = normalizeCreatePayload(mockFormData);

      expect(payload.supplierId).toBeUndefined();
      expect(payload.branchId).toBeUndefined();
      expect(payload.items[0]).toEqual({
        productId: 1, // Fallback default
        quantity: 1, // Fallback default quantity
        unitCost: -5,
        taxRate: 15
      });
    });
  });

  describe('parseOrdersResponse()', () => {
    it('should parse direct response array and handle length as total', () => {
      const mockArray = [
        { id: 1, orderNo: 101, total: 500, status: 'pending' },
        { id: 2, orderNo: 102, total: 600, status: 'approved' }
      ];

      const result = parseOrdersResponse(mockArray);

      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.orders[0].orderNo).toBe(101);
    });

    it('should parse structured paginated response object containing total and data', () => {
      const mockObject = {
        data: [
          { id: 1, orderNo: 101, total: 500 }
        ],
        total: 45,
        page: 1,
        limit: 10
      };

      const result = parseOrdersResponse(mockObject);

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(45);
    });

    it('should safely return empty arrays and 0 total when json is null, undefined, or empty', () => {
      expect(parseOrdersResponse(null)).toEqual({ orders: [], total: 0 });
      expect(parseOrdersResponse(undefined)).toEqual({ orders: [], total: 0 });
      expect(parseOrdersResponse({})).toEqual({ orders: [], total: 0 });
    });
  });

  describe('canPerformAction() Permission/State Gates', () => {
    const adminUser = { role: 'admin' };
    const cfoUser = { role: 'CFO' };
    const standardUserWithEdit = {
      role: 'user',
      permissions: [{ module: 'purchase_orders', canEdit: true }]
    };
    const standardUserWithoutEdit = {
      role: 'user',
      permissions: [{ module: 'purchase_orders', canEdit: false }]
    };

    it('should allow admin/CFO to perform status actions under correct document state', () => {
      expect(canPerformAction('approve', 'pending', adminUser)).toBe(true);
      expect(canPerformAction('approve', 'approved', adminUser)).toBe(false); // cannot approve already approved PO
      expect(canPerformAction('complete', 'approved', cfoUser)).toBe(true);
      expect(canPerformAction('complete', 'pending', cfoUser)).toBe(false); // cannot complete unapproved PO
    });

    it('should restrict actions for standard users based on module permissions', () => {
      expect(canPerformAction('edit', 'pending', standardUserWithEdit)).toBe(true);
      expect(canPerformAction('edit', 'completed', standardUserWithEdit)).toBe(false); // completed state is terminal
      expect(canPerformAction('edit', 'pending', standardUserWithoutEdit)).toBe(false); // missing edit permission
    });
  });
});
