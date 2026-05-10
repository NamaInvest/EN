import { logger } from '@/lib/logger';

const log = logger.child({ service: 'storage.watermark' });

export class WatermarkService {
  async addWatermark(
    imageBuffer: Buffer,
    options: {
      text?: string;
      logoPath?: string;
      position?: 'center' | 'bottom-right';
      opacity?: number;
    }
  ): Promise<Buffer> {
    log.info(`[Watermark] Adding watermark to image: text=${options.text}, position=${options.position}`);
    // Stub Sharp composite logic
    return Buffer.concat([imageBuffer, Buffer.from('_watermarked')]);
  }
}
