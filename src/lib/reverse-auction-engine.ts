import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'reverse-auction-engine' });

export class ReverseAuctionEngine {
  static async createAuction(tenantId: string, rfqId: number, title: string, startTime: Date, endTime: Date) {
    return prisma.reverseAuction.create({ data: { tenantId, rfqId, title, startTime, endTime, status: 'DRAFT' } });
  }

  static async placeBid(auctionId: number, vendorId: number, amount: number) {
    const auction = await prisma.reverseAuction.findUniqueOrThrow({ where: { id: auctionId } });
    if (auction.status !== 'OPEN') throw new Error('Auction not open');
    if (auction.currentLowBid && amount >= Number(auction.currentLowBid)) throw new Error('Bid must be lower than current lowest');
    log.info(`Bid placed on auction ${auctionId} by vendor ${vendorId}: ${amount}`);

    // Anti-sniping: extend if bid within last 5 min
    const msLeft = new Date(auction.endTime).getTime() - Date.now();
    if (msLeft < 5 * 60000) {
      await prisma.reverseAuction.update({ where: { id: auctionId }, data: { endTime: new Date(Date.now() + 5 * 60000) } });
    }

    await prisma.reverseAuction.update({ where: { id: auctionId }, data: { currentLowBid: amount } });
    return prisma.auctionBid.create({ data: { auctionId, vendorId, amount } });
  }

  static async closeAuction(auctionId: number) {
    const bids = await prisma.auctionBid.findMany({ where: { auctionId }, orderBy: { amount: 'asc' } });
    if (!bids.length) return prisma.reverseAuction.update({ where: { id: auctionId }, data: { status: 'CLOSED' } });
    const winner = bids[0];
    await prisma.auctionBid.update({ where: { id: winner.id }, data: { isWinner: true } });
    return prisma.reverseAuction.update({ where: { id: auctionId }, data: { status: 'CLOSED', winnerId: winner.vendorId } });
  }
}
