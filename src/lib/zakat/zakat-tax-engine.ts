/**
 * Zakat & Tax Engine (Phase 38 - ZATCA Tax Compliance)
 * ──────────────────────────────────────────────────────────
 * Automates the calculation of VAT Returns, Zakat Base, and Withholding Tax (WHT).
 */
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'ZakatTaxEngine' });

export interface ZakatBaseParams {
    equity: number;
    longTermLiabilities: number;
    adjustments: number; // Provisions, reserves, etc.
    fixedAssets: number;
    longTermInvestments: number;
    netProfit: number;
}

export interface WhtCalculationParams {
    paymentAmount: number;
    serviceType: 'RENT' | 'ROYALTY' | 'TECHNICAL_SERVICES' | 'MANAGEMENT_FEES' | 'DIVIDENDS' | 'INTEREST' | 'INSURANCE' | 'TELECOM';
}

export class ZakatTaxEngine {

    /**
     * Calculates the Zakat Base and Zakat Due for Saudi/GCC entities.
     * Zakat rate is 2.5% on the Zakat Base for a 354-day Hijri year.
     * (Approximated to 2.577% if calculated on a 365-day Gregorian year basis, but ZATCA uses 2.5% on Zakat base).
     */
    static calculateZakat(params: ZakatBaseParams): { zakatBase: number, zakatDue: number } {
        try {
            log.info('Calculating Zakat Base');
            
            // Zakat Base = (Equity + Long-Term Liabilities + Adjustments) - (Fixed Assets + Long-Term Investments)
            // Note: If Zakat base is less than Net Profit, Zakat is paid on Net Profit.
            const totalSources = new Decimal(params.equity)
                .plus(params.longTermLiabilities)
                .plus(params.adjustments);
                
            const totalDeductions = new Decimal(params.fixedAssets)
                .plus(params.longTermInvestments);

            let zakatBase = totalSources.minus(totalDeductions);

            // Zakat base cannot be less than adjusted net profit according to ZATCA rules.
            if (zakatBase.lessThan(params.netProfit)) {
                zakatBase = new Decimal(params.netProfit);
            }

            const zakatDue = zakatBase.mul(0.025); // 2.5%

            const result = {
                zakatBase: Number(zakatBase.toFixed(2)),
                zakatDue: Number(zakatDue.toFixed(2))
            };

            log.info(`Zakat Calculation complete. Due: ${result.zakatDue} SAR`);
            return result;

        } catch (error: any) {
            log.error('Failed to calculate Zakat', { error: error.message });
            throw new Error(`Zakat Calculation failed: ${error.message}`);
        }
    }

    /**
     * Calculates Withholding Tax (WHT) for payments made to non-residents.
     */
    static calculateWht(params: WhtCalculationParams): { whtAmount: number, netPayment: number, whtRate: number } {
        let rate = 0.05; // default 5%
        
        switch (params.serviceType) {
            case 'MANAGEMENT_FEES': rate = 0.20; break;
            case 'ROYALTY': rate = 0.15; break;
            case 'TECHNICAL_SERVICES':
            case 'RENT':
            case 'DIVIDENDS':
            case 'INTEREST':
            case 'INSURANCE':
            case 'TELECOM':
                rate = 0.05; break;
        }

        const whtAmount = new Decimal(params.paymentAmount).mul(rate);
        const netPayment = new Decimal(params.paymentAmount).minus(whtAmount);

        return {
            whtRate: rate * 100,
            whtAmount: Number(whtAmount.toFixed(2)),
            netPayment: Number(netPayment.toFixed(2))
        };
    }
}
