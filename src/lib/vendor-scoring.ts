import { getPrisma } from './prisma';

export async function calculateVendorScore(supplierId: number, prisma: any) {
    // Quality Score (1-5): Average quality rating from Goods Receipts
    const ratings = await prisma.vendorRating.findMany({
        where: { supplierId }
    });

    const totalRatings = ratings.length;
    let avgQuality = 5;
    let avgDelivery = 5;
    let avgPricing = 5;

    if (totalRatings > 0) {
        avgQuality = ratings.reduce((sum: number, r: any) => sum + r.quality, 0) / totalRatings;
        avgDelivery = ratings.reduce((sum: number, r: any) => sum + r.delivery, 0) / totalRatings;
        avgPricing = ratings.reduce((sum: number, r: any) => sum + r.pricing, 0) / totalRatings;
    }

    // OTD (On Time Delivery): calculate from GRN vs PO expected date
    // For simulation, we will use the subjective delivery rating (1-5) converted to percentage
    const otdPercentage = (avgDelivery / 5) * 100;
    
    // Quality Percentage
    const qualityPercentage = (avgQuality / 5) * 100;

    // Pricing percentage
    const pricingPercentage = (avgPricing / 5) * 100;

    // Composite score (average of the three)
    const compositeScore = Math.round((otdPercentage + qualityPercentage + pricingPercentage) / 3);

    return {
        supplierId,
        otd: Math.round(otdPercentage),
        quality: Math.round(qualityPercentage),
        pricing: Math.round(pricingPercentage),
        responsiveness: 100, // mock
        compliance: 100, // mock
        compositeScore,
        status: compositeScore < 60 ? 'WARNING' : 'ACTIVE'
    };
}
