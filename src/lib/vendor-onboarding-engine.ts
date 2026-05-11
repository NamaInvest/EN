import { prisma } from '@/lib/prisma';

export interface VendorComplianceDoc {
  docType: 'CR' | 'ZATCA_CERT' | 'GOSI' | 'MUDAD' | 'BANK_LETTER';
  isUploaded: boolean;
  expiryDate?: Date;
  isValid: boolean;
}

export interface VendorScoring {
  vendorId: string;
  vendorName: string;
  category: string;
  yearsInBusiness: number;
  financialScore: number; // 0-100
  qualityScore: number;   // 0-100
  docs: VendorComplianceDoc[];
  overallRiskScore: number; // 0-100 (Higher is riskier)
  approvalStatus: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | 'PROBATION';
}

export interface VendorOnboardingReport {
  asOfDate: Date;
  tenantId: string;
  vendors: VendorScoring[];
  summary: {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    highRiskVendors: number;
  };
}

/**
 * Vendor Onboarding & Risk Engine
 * Evaluates new vendors based on ZATCA compliance and internal risk scoring matrices.
 */
export class VendorOnboardingEngine {
  static async evaluateVendors(tenantId: string): Promise<VendorOnboardingReport> {
    try {
      const vendors: VendorScoring[] = [];
      let totalPending = 0;
      let totalApproved = 0;
      let totalRejected = 0;
      let highRiskVendors = 0;

      // Mock Data to simulate the ZATCA/MUDAD API checks and internal financial scoring
      const mockVendors = [
        { name: 'Al-Jazeera Logistics LLC', category: 'Logistics', years: 8, fin: 85, qual: 90, docs: ['CR', 'ZATCA_CERT', 'GOSI', 'BANK_LETTER'] },
        { name: 'Tech Solutions Co.', category: 'IT Software', years: 2, fin: 55, qual: 80, docs: ['CR', 'ZATCA_CERT'] },
        { name: 'National Steel Factory', category: 'Raw Materials', years: 15, fin: 95, qual: 98, docs: ['CR', 'ZATCA_CERT', 'GOSI', 'MUDAD', 'BANK_LETTER'] },
        { name: 'Future Medical Supplies', category: 'Medical', years: 1, fin: 30, qual: 60, docs: ['CR'] },
        { name: 'Arabian Consulting Grp', category: 'Services', years: 5, fin: 75, qual: 85, docs: ['CR', 'ZATCA_CERT', 'GOSI'] }
      ];

      const requiredDocs = ['CR', 'ZATCA_CERT', 'GOSI', 'MUDAD', 'BANK_LETTER'];

      mockVendors.forEach((v, idx) => {
        const vendorDocs: VendorComplianceDoc[] = requiredDocs.map(req => {
          const isUploaded = v.docs.includes(req);
          return {
            docType: req as any,
            isUploaded,
            isValid: isUploaded, // Simplified logic: if uploaded, it's valid for now
            expiryDate: isUploaded ? new Date(Date.now() + Math.random() * 31536000000) : undefined // Random future date within 1 year
          };
        });

        const missingDocsCount = vendorDocs.filter(d => !d.isValid).length;
        
        // Risk Calculation Logic
        // Base risk 100. Lower is better. 
        // 20 pts per missing doc. Financial & Quality inversely reduce risk.
        let riskScore = 100 - (v.fin * 0.4) - (v.qual * 0.4) + (missingDocsCount * 15);
        if (v.years < 3) riskScore += 15; // Startup risk penalty
        
        riskScore = Math.min(100, Math.max(0, riskScore)); // clamp 0-100

        let approvalStatus: VendorScoring['approvalStatus'] = 'PENDING_REVIEW';
        if (riskScore < 30 && missingDocsCount === 0) {
          approvalStatus = 'APPROVED';
          totalApproved++;
        } else if (riskScore > 75 || !v.docs.includes('ZATCA_CERT')) {
          approvalStatus = 'REJECTED';
          totalRejected++;
          highRiskVendors++;
        } else if (riskScore >= 30 && riskScore <= 75) {
          approvalStatus = 'PROBATION';
          totalPending++;
        }

        vendors.push({
          vendorId: `VND-${2000 + idx}`,
          vendorName: v.name,
          category: v.category,
          yearsInBusiness: v.years,
          financialScore: v.fin,
          qualityScore: v.qual,
          docs: vendorDocs,
          overallRiskScore: Math.round(riskScore),
          approvalStatus
        });
      });

      return {
        asOfDate: new Date(),
        tenantId,
        vendors,
        summary: {
          totalPending,
          totalApproved,
          totalRejected,
          highRiskVendors
        }
      };

    } catch (error: any) {
      console.error('VendorOnboardingEngine Error:', error);
      throw new Error(`Failed to evaluate Vendors: ${error.message}`);
    }
  }
}
