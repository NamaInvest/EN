export interface Bid {
  vendorName: string;
  bidAmount: number;
  deliveryDays: number;
  qualityScore: number;
  submissionTime: Date;
  isWinning: boolean;
}

export interface RFxAuction {
  id: string;
  itemName: string;
  quantity: number;
  targetPrice: number;
  auctionEndTime: Date;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  bids: Bid[];
  bestBidAmount: number | null;
  savings: number;
}

export interface RFxAuctionReport {
  asOfDate: Date;
  tenantId: string;
  auctions: RFxAuction[];
  summary: {
    activeAuctionsCount: number;
    totalTargetSpend: number;
    projectedSavings: number;
    bidsReceived: number;
  };
}

/**
 * RFx Reverse Auction Engine
 * Manages reverse auctions where suppliers bid downwards. Calculates dynamic savings.
 */
export class RFxAuctionEngine {
  static async evaluateAuctions(tenantId: string): Promise<RFxAuctionReport> {
    try {
      const auctions: RFxAuction[] = [];
      let activeAuctionsCount = 0;
      let totalTargetSpend = 0;
      let projectedSavings = 0;
      let bidsReceived = 0;

      // Mock Data to simulate live active and closed reverse auctions
      const mockAuctions = [
        { name: 'Dell XPS 15 Laptops (50 Units)', target: 350000, status: 'ACTIVE' },
        { name: 'Raw Aluminum Sheets (200 Tons)', target: 800000, status: 'CLOSED' },
        { name: 'Office Cleaning Services (1 Year)', target: 120000, status: 'ACTIVE' },
        { name: 'Cisco Networking Gear', target: 450000, status: 'DRAFT' }
      ];

      const mockVendors = ['Tech Solutions Co.', 'Al-Jazeera Logistics', 'National Steel Factory', 'Gulf Traders', 'Arabian IT Group'];

      mockAuctions.forEach((a, idx) => {
        const bids: Bid[] = [];
        let bestBidAmount: number | null = null;
        let savings = 0;

        if (a.status !== 'DRAFT') {
          const numBids = a.status === 'ACTIVE' ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 5) + 3;
          let currentLowest = a.target * (1 + Math.random() * 0.1); // Initial bid might be above target

          for (let i = 0; i < numBids; i++) {
            // Each subsequent bid is slightly lower (reverse auction)
            currentLowest = currentLowest * (1 - (Math.random() * 0.05 + 0.01));
            bidsReceived++;

            bids.push({
              vendorName: mockVendors[i % mockVendors.length],
              bidAmount: Math.round(currentLowest),
              deliveryDays: Math.floor(Math.random() * 30) + 7,
              qualityScore: Math.floor(Math.random() * 20) + 80,
              submissionTime: new Date(Date.now() - Math.random() * 100000000),
              isWinning: false
            });
          }

          if (bids.length > 0) {
            // Sort bids by amount ascending (lowest is best)
            bids.sort((b1, b2) => b1.bidAmount - b2.bidAmount);
            bids[0].isWinning = true;
            bestBidAmount = bids[0].bidAmount;
            if (bestBidAmount < a.target) {
              savings = a.target - bestBidAmount;
            }
          }
        }

        if (a.status === 'ACTIVE') activeAuctionsCount++;
        totalTargetSpend += a.target;
        projectedSavings += savings;

        auctions.push({
          id: `RFX-2026-00${idx + 1}`,
          itemName: a.name,
          quantity: Math.floor(Math.random() * 100) + 10,
          targetPrice: a.target,
          auctionEndTime: new Date(Date.now() + (a.status === 'ACTIVE' ? 86400000 : -86400000)),
          status: a.status as any,
          bids,
          bestBidAmount,
          savings
        });
      });

      return {
        asOfDate: new Date(),
        tenantId,
        auctions,
        summary: {
          activeAuctionsCount,
          totalTargetSpend,
          projectedSavings,
          bidsReceived
        }
      };

    } catch (error: any) {
      console.error('RFxAuctionEngine Error:', error);
      throw new Error(`Failed to evaluate RFx Auctions: ${error.message}`);
    }
  }
}
