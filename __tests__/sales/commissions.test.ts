describe('Sales Commission Calculation', () => {
    it('should calculate percentage commission correctly if target met', () => {
        const totalSales = 150000;
        const targetAmount = 100000;
        const rewardType: string = 'PERCENTAGE';
        const rewardValue = 5; // 5%

        let commissionAmount = 0;
        if (totalSales >= targetAmount) {
            if (rewardType === 'PERCENTAGE') {
                commissionAmount = totalSales * (rewardValue / 100);
            } else {
                commissionAmount = rewardValue;
            }
        }

        expect(commissionAmount).toBe(7500);
    });

    it('should return 0 commission if target not met', () => {
        const totalSales = 80000;
        const targetAmount = 100000;
        const rewardType: string = 'PERCENTAGE';
        const rewardValue = 5;

        let commissionAmount = 0;
        if (totalSales >= targetAmount) {
            commissionAmount = totalSales * (rewardValue / 100);
        }

        expect(commissionAmount).toBe(0);
    });

    it('should calculate fixed commission correctly if target met', () => {
        const totalSales = 120000;
        const targetAmount = 100000;
        const rewardType: string = 'FIXED';
        const rewardValue = 2000;

        let commissionAmount = 0;
        if (totalSales >= targetAmount) {
            if (rewardType === 'PERCENTAGE') {
                commissionAmount = totalSales * (rewardValue / 100);
            } else {
                commissionAmount = rewardValue;
            }
        }

        expect(commissionAmount).toBe(2000);
    });
});
