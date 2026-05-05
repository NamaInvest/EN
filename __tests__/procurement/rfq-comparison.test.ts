describe('RFQ Comparison Logic', () => {
    it('should determine the best price for each item among multiple vendors', () => {
        const itemBids = [
            { vendorId: 1, unitPrice: 150, deliveryDays: 10 },
            { vendorId: 2, unitPrice: 120, deliveryDays: 15 }, // Best price
            { vendorId: 3, unitPrice: 180, deliveryDays: 5 },
            { vendorId: 4, unitPrice: null, deliveryDays: null } // Did not bid
        ];

        const validPrices = itemBids.map(b => b.unitPrice).filter(p => p !== null) as number[];
        const bestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

        const evaluatedBids = itemBids.map(b => ({
            ...b,
            isBestPrice: b.unitPrice === bestPrice
        }));

        expect(bestPrice).toBe(120);
        expect(evaluatedBids.find(b => b.vendorId === 2)?.isBestPrice).toBe(true);
        expect(evaluatedBids.find(b => b.vendorId === 1)?.isBestPrice).toBe(false);
    });

    it('should handle cases where no vendor submitted a valid price', () => {
        const itemBids = [
            { vendorId: 1, unitPrice: null, deliveryDays: null },
            { vendorId: 2, unitPrice: null, deliveryDays: null }
        ];

        const validPrices = itemBids.map(b => b.unitPrice).filter(p => p !== null) as number[];
        const bestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

        expect(bestPrice).toBe(null);
    });
});
